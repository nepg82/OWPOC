// --- Procedural Humanoid Character ---
const player = new THREE.Group();

// Materials
const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c29a });
const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

// Torso
const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), shirtMat);
torso.position.y = 1.35;
torso.castShadow = true;
player.add(torso);

// Head
const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), skinMat);
head.position.y = 0.65;
head.castShadow = true;
torso.add(head);

// Left & Right Arms (Pivoted at shoulder)
const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
armGeo.translate(0, -0.3, 0); // Shift origin to shoulder joint

const leftArm = new THREE.Mesh(armGeo, shirtMat);
leftArm.position.set(0.45, 0.35, 0);
leftArm.castShadow = true;
torso.add(leftArm);

const rightArm = new THREE.Mesh(armGeo, shirtMat);
rightArm.position.set(-0.45, 0.35, 0);
rightArm.castShadow = true;
torso.add(rightArm);

// Left & Right Legs (Pivoted at hip)
const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
legGeo.translate(0, -0.4, 0); // Shift origin to hip joint

const leftLeg = new THREE.Mesh(legGeo, pantsMat);
leftLeg.position.set(0.2, 0.9, 0);
leftLeg.castShadow = true;
player.add(leftLeg);

const rightLeg = new THREE.Mesh(legGeo, pantsMat);
rightLeg.position.set(-0.2, 0.9, 0);
rightLeg.castShadow = true;
player.add(rightLeg);

player.position.set(0, 0, 15);
scene.add(player);

// State & Constants
const playerState = { velocityY: 0, grounded: true, turnSpeed: 2.6 };
const GROUND_Y = 0;
const GRAVITY = -28;
const JUMP_SPEED = 9.5;
const MOVE_SPEED = 8.5;

const CAR_MAX_SPEED = 22;
const CAR_MAX_REVERSE = 8;
const CAR_ACCEL = 14;
const CAR_FRICTION = 6;
const CAR_MAX_YAW_RATE = 2.0;

const drivingState = { active: false, vehicle: null };

// --- Walk Cycle Animation ---
let walkTime = 0;

function animateHumanoid(dt, isMoving) {
  if (isMoving) {
    walkTime += dt * 10;
    leftArm.rotation.x = Math.sin(walkTime) * 0.6;
    rightArm.rotation.x = -Math.sin(walkTime) * 0.6;
    leftLeg.rotation.x = -Math.sin(walkTime) * 0.7;
    rightLeg.rotation.x = Math.sin(walkTime) * 0.7;
  } else {
    leftArm.rotation.x *= 0.8;
    rightArm.rotation.x *= 0.8;
    leftLeg.rotation.x *= 0.8;
    rightLeg.rotation.x *= 0.8;
  }
}

function updatePlayer(dt) {
  if (drivingState.active) return;

  if (keys.a) player.rotation.y += playerState.turnSpeed * dt;
  if (keys.d) player.rotation.y -= playerState.turnSpeed * dt;

  let moveDir = 0;
  if (keys.w) moveDir += 1;
  if (keys.s) moveDir -= 1;

  if (moveDir !== 0) {
    const nextX = player.position.x + Math.sin(player.rotation.y) * moveDir * MOVE_SPEED * dt;
    const nextZ = player.position.z + Math.cos(player.rotation.y) * moveDir * MOVE_SPEED * dt;
    const bound = groundSize / 2 - 2;
    const clampedX = Math.max(-bound, Math.min(bound, nextX));
    const clampedZ = Math.max(-bound, Math.min(bound, nextZ));

    if (!checkWorldCollisions(clampedX, clampedZ, 0.5, player.position.y)) {
      player.position.x = clampedX;
      player.position.z = clampedZ;
    }
  }

  // Animate character limbs based on movement
  animateHumanoid(dt, moveDir !== 0);

  if (shiftJustPressed && playerState.grounded) {
    playerState.velocityY = JUMP_SPEED;
    playerState.grounded = false;
  }
  shiftJustPressed = false;

  const prevY = player.position.y;
  playerState.velocityY += GRAVITY * dt;
  player.position.y += playerState.velocityY * dt;

  // Only snap onto a vehicle roof if we were already at/above it (i.e. falling onto
  // it), not when merely walking into the side of a parked car at ground level.
  const vehicleTop = findVehicleSurfaceY(player.position.x, player.position.z);
  const landingY = (vehicleTop !== null && prevY >= vehicleTop - 0.1) ? vehicleTop : GROUND_Y;

  if (player.position.y <= landingY) {
    player.position.y = landingY;
    playerState.velocityY = 0;
    playerState.grounded = true;
  } else {
    playerState.grounded = false;
  }
}

function enterVehicle(v) {
  drivingState.active = true;
  drivingState.vehicle = v;
  v.gear = 'forward';
  player.visible = false;
}

function exitVehicle() {
  if (!drivingState.active) return;
  const v = drivingState.vehicle;
  player.position.set(v.x + 2.5, GROUND_Y, v.z);
  player.rotation.y = v.mesh.rotation.y;
  player.visible = true;
  drivingState.active = false;
  drivingState.vehicle = null;
}

function updateVehicle(dt) {
  if (!drivingState.active) return;
  const v = drivingState.vehicle;
  if (v.gear === undefined) v.gear = 'forward';

  if (v.gear === 'forward') {
    if (keys.w) {
      v.speed = Math.min(v.speed + CAR_ACCEL * dt, CAR_MAX_SPEED);
    } else if (keys.s) {
      // Brake toward a stop. Once stopped, holding S just holds the brake;
      // a fresh press of S (release + press again) shifts into reverse.
      v.speed = Math.max(0, v.speed - CAR_ACCEL * dt);
      if (v.speed === 0 && sJustPressed) {
        v.gear = 'reverse';
      }
    } else {
      if (v.speed > 0) v.speed = Math.max(0, v.speed - CAR_FRICTION * dt);
      else if (v.speed < 0) v.speed = Math.min(0, v.speed + CAR_FRICTION * dt);
    }
  } else {
    // reverse gear
    if (keys.s) {
      v.speed = Math.max(v.speed - CAR_ACCEL * dt, -CAR_MAX_REVERSE);
    } else if (keys.w) {
      // Brake toward a stop; a fresh press of W shifts back into forward.
      v.speed = Math.min(0, v.speed + CAR_ACCEL * dt);
      if (v.speed === 0 && wJustPressed) {
        v.gear = 'forward';
      }
    } else {
      if (v.speed > 0) v.speed = Math.max(0, v.speed - CAR_FRICTION * dt);
      else if (v.speed < 0) v.speed = Math.min(0, v.speed + CAR_FRICTION * dt);
    }
  }

  const turnFactor = v.speed / CAR_MAX_SPEED;
  if (keys.a) v.mesh.rotation.y += CAR_MAX_YAW_RATE * (turnFactor || 0.5) * dt;
  if (keys.d) v.mesh.rotation.y -= CAR_MAX_YAW_RATE * (turnFactor || 0.5) * dt;

  const nextX = v.x + Math.sin(v.mesh.rotation.y) * v.speed * dt;
  const nextZ = v.z + Math.cos(v.mesh.rotation.y) * v.speed * dt;
  const bound = groundSize / 2 - 2;
  const clampedX = Math.max(-bound, Math.min(bound, nextX));
  const clampedZ = Math.max(-bound, Math.min(bound, nextZ));

  if (checkWorldCollisions(clampedX, clampedZ, 1.4, undefined, v)) {
    v.speed = 0;
  } else {
    v.x = clampedX;
    v.z = clampedZ;
  }

  v.mesh.position.set(v.x, 0, v.z);
  player.position.set(v.x, v.mesh.position.y, v.z);
}