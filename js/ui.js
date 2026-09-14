const promptEl = document.getElementById('prompt');
const modalEl = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

let isLocked = false;
let cameraPitch = 0.25;
let nearest = null;
let modalOpen = false;

document.body.addEventListener('click', () => {
  if (!modalOpen && !isLocked) {
    document.body.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  isLocked = document.pointerLockElement === document.body;
});

document.addEventListener('mousemove', (e) => {
  if (!isLocked) return;
  const sensitivity = 0.0025;
  cameraPitch -= e.movementY * sensitivity;
  cameraPitch = Math.max(-Math.PI / 6, Math.min(Math.PI / 3, cameraPitch));
});

function closeModal() {
  modalEl.classList.remove('show');
  modalOpen = false;
}
window.closeModal = closeModal;

const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
let spaceJustPressed = false;
let shiftJustPressed = false;

window.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case 'w': keys.w = true; break;
    case 'a': keys.a = true; break;
    case 's': keys.s = true; break;
    case 'd': keys.d = true; break;
    case 'shift': if (!keys.shift) shiftJustPressed = true; keys.shift = true; break;
    case ' ': if (!keys.space) spaceJustPressed = true; keys.space = true; e.preventDefault(); break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.key.toLowerCase()) {
    case 'w': keys.w = false; break;
    case 'a': keys.a = false; break;
    case 's': keys.s = false; break;
    case 'd': keys.d = false; break;
    case 'shift': keys.shift = false; break;
    case ' ': keys.space = false; break;
  }
});

// --- Virtual Joystick Logic ---
const joyZone = document.getElementById('joystick-zone');
const joyKnob = document.getElementById('joystick-knob');
let joyActive = false;
let joyTouchId = null;
let joyCenter = { x: 0, y: 0 };
const maxRadius = 40;

joyZone.addEventListener('touchstart', (e) => {
  // Trigger Fullscreen & Landscape lock on first interaction
  tryFullscreenAndLock();

  const touch = e.changedTouches[0];
  joyTouchId = touch.identifier;
  joyActive = true;
  const rect = joyZone.getBoundingClientRect();
  joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  updateJoystick(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (!joyActive) return;
  for (let touch of e.changedTouches) {
    if (touch.identifier === joyTouchId) {
      updateJoystick(touch.clientX, touch.clientY);
    }
  }
}, { passive: false });

const resetJoystick = (e) => {
  if (!joyActive) return;
  for (let touch of e.changedTouches) {
    if (touch.identifier === joyTouchId) {
      joyActive = false;
      joyKnob.style.transform = `translate(-50%, -50%)`;
      // Clear movement keys
      keys.w = false; keys.s = false; keys.a = false; keys.d = false;
    }
  }
};

window.addEventListener('touchend', resetJoystick);
window.addEventListener('touchcancel', resetJoystick);

function updateJoystick(clientX, clientY) {
  let dx = clientX - joyCenter.x;
  let dy = clientY - joyCenter.y;
  let dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > maxRadius) {
    dx = (dx / dist) * maxRadius;
    dy = (dy / dist) * maxRadius;
  }

  joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

  // Map joystick deflection to WASD keys
  const threshold = 12;
  keys.w = dy < -threshold;
  keys.s = dy > threshold;
  keys.a = dx < -threshold;
  keys.d = dx > threshold;
}

// --- On-Screen Buttons ---
const btnJump = document.getElementById('btn-jump');
const btnAction = document.getElementById('btn-action');

btnJump.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!keys.shift) shiftJustPressed = true;
  keys.shift = true;
});
btnJump.addEventListener('touchend', () => { keys.shift = false; });

btnAction.addEventListener('touchstart', (e) => {
  e.preventDefault();
  spaceJustPressed = true;
});

// --- Lock Landscape & Hide Browser Chrome ---
function tryFullscreenAndLock() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    }).catch(() => {});
  }
}