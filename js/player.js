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
const JUMP_SPEED = 20.0;
const MOVE_SPEED = 8.5;

const CAR_MAX_SPEED = 22;
const CAR_MAX_REVERSE = 8;
const CAR_ACCEL = 14;
const CAR_FRICTION = 6;
const CAR_MAX_YAW_RATE = 2.0;

const drivingState = { active: false, vehicle: null };

// --- Carrying Props (blocks, eventually ramps) ---
let heldProp = null;

function pickUpProp(item) {
  heldProp = item;
  item.heldByPlayer = true;
  player.add(item.mesh); // reparent onto the player - position/yaw follow automatically
  item.mesh.position.set(0, 1.3, 1.0); // roughly chest-height, out in front
  item.mesh.rotation.set(0, 0, 0);
}

function placeHeldProp() {
  const item = heldProp;
  const yaw = player.rotation.y;
  const halfZ = item.collision.bodyHalf.z;
  const halfX = item.collision.bodyHalf.x;
  // Try a close spot right in front of the player first, then a bit further
  // out if that's occupied. If neither is clear, just keep carrying it.
  const tryDistances = [1.4 + halfZ, 2.4 + halfZ];

  for (const dist of tryDistances) {
    const spotX = player.position.x + Math.sin(yaw) * dist;
    const spotZ = player.position.z + Math.cos(yaw) * dist;
    if (!checkWorldCollisions(spotX, spotZ, Math.max(halfX, halfZ), GROUND_Y, null)) {
      scene.add(item.mesh); // un-parents back to world space
      item.mesh.position.set(spotX, 0, spotZ);
      item.mesh.rotation.set(0, 0, 0);
      item.x = spotX;
      item.z = spotZ;
      item.heldByPlayer = false;
      heldProp = null;
      return;
    }
  }
  // No clear spot within reach - stays in hand, try again facing somewhere else.
}

// --- Riding Pose (motorcycle only - cars just hide the player) ---
function setRiderPose(active) {
  if (active) {
    torso.rotation.x = 0.2;      // lean forward over the tank
    leftArm.rotation.x = -1.1;   // reach forward to the handlebars
    rightArm.rotation.x = -1.1;
    leftLeg.rotation.x = -1.0;   // knees up onto the pegs
    rightLeg.rotation.x = -1.0;
  } else {
    torso.rotation.x = 0;
    leftArm.rotation.x = 0;
    rightArm.rotation.x = 0;
    leftLeg.rotation.x = 0;
    rightLeg.rotation.x = 0;
  }
}

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
  const vehicleTop = findStandableSurfaceY(player.position.x, player.position.z);
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
  v.leanAngle = 0;

  if (v.vehicleKind === 'motorcycle') {
    // Keep the rider visible and parent them to the bike so their position,
    // yaw, and lean all follow the bike's transform automatically.
    v.mesh.add(player);
    player.position.set(0, -0.25, -0.1);
    player.rotation.set(0, 0, 0);
    setRiderPose(true);
    player.visible = true;
  } else {
    player.visible = false;
  }
}

function exitVehicle() {
  if (!drivingState.active) return;
  const v = drivingState.vehicle;

  if (v.vehicleKind === 'motorcycle') {
    scene.add(player); // un-parents back to world space
    setRiderPose(false);
    v.mesh.rotation.z = 0;
    v.leanAngle = 0;
  }

  const spot = findVehicleExitSpot(v);
  player.position.set(spot.x, GROUND_Y, spot.z);
  player.rotation.set(0, v.mesh.rotation.y, 0);
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

  if (v.vehicleKind === 'motorcycle') {
    // Lean into turns: more lean the harder you're turning and the faster
    // you're going, eased toward the target so it doesn't snap.
    const turnInput = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
    const speedFactor = Math.min(Math.abs(v.speed) / CAR_MAX_SPEED, 1);
    const targetLean = -turnInput * 0.4 * (0.3 + 0.7 * speedFactor);
    v.leanAngle = v.leanAngle + (targetLean - v.leanAngle) * Math.min(dt * 8, 1);
    v.mesh.rotation.z = v.leanAngle;
    // Player is parented to v.mesh while riding, so its position/yaw/lean
    // follow automatically - no world-space player update needed here.
  } else {
    player.position.set(v.x, v.mesh.position.y, v.z);
  }
}