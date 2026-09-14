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