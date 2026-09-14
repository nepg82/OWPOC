const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CylinderGeometry(0.45, 0.45, 1.3, 12),
  new THREE.MeshStandardMaterial({ color: 0xf0c29a })
);
body.position.y = 0.65 + 0.45;
body.castShadow = true;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.4, 14, 14),
  new THREE.MeshStandardMaterial({ color: 0xf0c29a })
);
head.position.y = 1.1 + 0.45 + 0.4;
head.castShadow = true;
player.add(head);

const nose = new THREE.Mesh(
  new THREE.ConeGeometry(0.12, 0.3, 8),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
nose.rotation.x = Math.PI / 2;
nose.position.set(0, 1.55, 0.4);
player.add(nose);

player.position.set(0, 0, 15);
scene.add(player);

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

    if (!checkWorldCollisions(clampedX, clampedZ, 0.5)) {
      player.position.x = clampedX;
      player.position.z = clampedZ;
    }
  }

  if (shiftJustPressed && playerState.grounded) {
    playerState.velocityY = JUMP_SPEED;
    playerState.grounded = false;
  }
  shiftJustPressed = false;

  playerState.velocityY += GRAVITY * dt;
  player.position.y += playerState.velocityY * dt;
  if (player.position.y <= GROUND_Y) {
    player.position.y = GROUND_Y;
    playerState.velocityY = 0;
    playerState.grounded = true;
  }
}

function enterVehicle(v) {
  drivingState.active = true;
  drivingState.vehicle = v;
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

  if (keys.w) {
    v.speed = Math.min(v.speed + CAR_ACCEL * dt, CAR_MAX_SPEED);
  } else if (keys.s) {
    v.speed = Math.max(v.speed - CAR_ACCEL * dt, -CAR_MAX_REVERSE);
  } else {
    if (v.speed > 0) v.speed = Math.max(0, v.speed - CAR_FRICTION * dt);
    if (v.speed < 0) v.speed = Math.min(0, v.speed + CAR_FRICTION * dt);
  }

  const turnFactor = v.speed / CAR_MAX_SPEED;
  if (keys.a) v.mesh.rotation.y += CAR_MAX_YAW_RATE * (turnFactor || 0.5) * dt;
  if (keys.d) v.mesh.rotation.y -= CAR_MAX_YAW_RATE * (turnFactor || 0.5) * dt;

  const nextX = v.x + Math.sin(v.mesh.rotation.y) * v.speed * dt;
  const nextZ = v.z + Math.cos(v.mesh.rotation.y) * v.speed * dt;
  const bound = groundSize / 2 - 2;
  const clampedX = Math.max(-bound, Math.min(bound, nextX));
  const clampedZ = Math.max(-bound, Math.min(bound, nextZ));

  if (checkWorldCollisions(clampedX, clampedZ, 1.4)) {
    v.speed = 0;
  } else {
    v.x = clampedX;
    v.z = clampedZ;
  }

  v.mesh.position.set(v.x, 0, v.z);
  player.position.set(v.x, v.mesh.position.y, v.z);
}