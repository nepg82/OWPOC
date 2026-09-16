const interactables = [];
const buildingBoxes = [];
const treeObstacles = [];

function makeBuilding(x, z, w, d, h, color, name, blurb) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w * 1.02, 0.4, d * 1.02),
    new THREE.MeshStandardMaterial({ color: 0x2c2c2c })
  );
  roof.position.set(x, h + 0.2, z);
  roof.castShadow = true;
  scene.add(roof);

  interactables.push({ mesh, x, z, radius: Math.max(w, d) / 2 + 3.5, name, blurb, type: 'building' });
  buildingBoxes.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}

// Generic "sedan-shaped" vehicle: a body box with a smaller cabin/top box on
// top, four wheels at the corners. Body/top colors and dimensions can all be
// overridden via opts so this one function covers the Sedan and the Miata.
function makeVehicle(x, z, name, opts = {}) {
  const {
    bodyColor = 0xd64545,
    topColor = 0xbfd8e8,
    bodyDims = { w: 2.2, h: 0.9, d: 4.2 },
    bodyY = 0.7,
    topDims = { w: 1.9, h: 0.7, d: 2.0 },
    topOffsetZ = -0.2,
    topY = 1.35,
    wheelRadius = 0.4,
    wheelPositions = [[-1.1, 0.4, 1.4], [1.1, 0.4, 1.4], [-1.1, 0.4, -1.4], [1.1, 0.4, -1.4]]
  } = opts;

  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(bodyDims.w, bodyDims.h, bodyDims.d),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4, metalness: 0.3 })
  );
  body.position.y = bodyY;
  body.castShadow = true;
  group.add(body);

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(topDims.w, topDims.h, topDims.d),
    new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.2, metalness: 0.1 })
  );
  top.position.set(0, topY, topOffsetZ);
  top.castShadow = true;
  group.add(top);

  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.4, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  wheelPositions.forEach(p => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...p);
    wheel.castShadow = true;
    group.add(wheel);
  });

  group.position.set(x, 0, z);
  scene.add(group);

  const collision = {
    bodyHalf: { x: bodyDims.w / 2, z: bodyDims.d / 2 },
    bodyTop: bodyY + bodyDims.h / 2,
    topHalf: { x: topDims.w / 2, z: topDims.d / 2 },
    topOffsetZ,
    topTop: topY + topDims.h / 2
  };

  interactables.push({
    mesh: group, x, z,
    radius: Math.max(bodyDims.w, bodyDims.d) / 2 + 3.5,
    name, type: 'vehicle', speed: 0, collision
  });
}

// Pickup truck: distinct shape from the generic sedan builder - a small cab
// up front and a long, low, open bed behind it (with side rails + tailgate
// instead of a roof), on a longer wheelbase.
function makePickupTruck(x, z, name, opts = {}) {
  const { bodyColor = 0x8a8f98, topColor = 0xf2f2f2 } = opts;
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5, metalness: 0.3 });
  const railMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.6, metalness: 0.2 });

  const group = new THREE.Group();

  // Cab: small box up front...
  const cabBase = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.7), bodyMat);
  cabBase.position.set(0, 0.65, 1.7);
  cabBase.castShadow = true;
  group.add(cabBase);

  // ...with a white roof/greenhouse on top of it.
  const cabTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.7, 1.5),
    new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.3, metalness: 0.1 })
  );
  cabTop.position.set(0, 1.45, 1.55);
  cabTop.castShadow = true;
  group.add(cabTop);

  // Bed: long, low floor behind the cab...
  const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 3.0), bodyMat);
  bedFloor.position.set(0, 0.45, -1.15);
  bedFloor.castShadow = true;
  group.add(bedFloor);

  // ...with open side rails (no roof) and a tailgate at the back.
  const railGeo = new THREE.BoxGeometry(0.12, 0.5, 3.0);
  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.position.set(-0.94, 0.85, -1.15);
  leftRail.castShadow = true;
  group.add(leftRail);
  const rightRail = leftRail.clone();
  rightRail.position.x = 0.94;
  group.add(rightRail);

  const tailgate = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.12), railMat);
  tailgate.position.set(0, 0.85, -2.65);
  tailgate.castShadow = true;
  group.add(tailgate);

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.4, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const wheelPositions = [[-1.05, 0.42, 1.7], [1.05, 0.42, 1.7], [-1.05, 0.42, -1.6], [1.05, 0.42, -1.6]];
  wheelPositions.forEach(p => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...p);
    wheel.castShadow = true;
    group.add(wheel);
  });

  group.position.set(x, 0, z);
  scene.add(group);

  // Footprint roughly covers cab-front (z ~2.55) to tailgate (z ~-2.7); "body"
  // here stands in for the whole low bed/cab silhouette, "top" is just the
  // cab roof toward the front.
  const collision = {
    bodyHalf: { x: 1.05, z: 2.7 },
    bodyTop: 0.75,
    topHalf: { x: 0.9, z: 0.75 },
    topOffsetZ: 1.55,
    topTop: 1.8
  };

  interactables.push({ mesh: group, x, z, radius: 6.0, name, type: 'vehicle', speed: 0, collision });
}

// Motorcycle: two wheels in line, thin frame, seat/tank, handlebars. The
// footprint here is a single generous box - simplest thing that works with
// the generic collision/roof code above. vehicleKind: 'motorcycle' is what
// player.js uses to give it different mount/dismount behavior than the cars.
function makeMotorcycle(x, z, name, opts = {}) {
  const { bodyColor = 0x1a1a1a, accentColor = 0xd6394a } = opts;
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4, metalness: 0.5 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.35, metalness: 0.4 });

  const group = new THREE.Group();

  // Frame spine connecting front and rear.
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 1.5), bodyMat);
  frame.position.set(0, 0.55, 0);
  frame.castShadow = true;
  group.add(frame);

  // Fuel tank up front, seat toward the back.
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.55), accentMat);
  tank.position.set(0, 0.78, 0.35);
  tank.castShadow = true;
  group.add(tank);

  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.14, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  seat.position.set(0, 0.78, -0.2);
  seat.castShadow = true;
  group.add(seat);

  // Handlebars.
  const bars = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  bars.position.set(0, 1.0, 0.75);
  bars.castShadow = true;
  group.add(bars);

  // Headlight.
  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xf5f0d0 })
  );
  headlight.position.set(0, 0.85, 0.95);
  group.add(headlight);

  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.22, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.position.set(0, 0.38, 0.85);
  frontWheel.castShadow = true;
  group.add(frontWheel);

  const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
  rearWheel.rotation.z = Math.PI / 2;
  rearWheel.position.set(0, 0.42, -0.85);
  rearWheel.castShadow = true;
  group.add(rearWheel);

  group.position.set(x, 0, z);
  scene.add(group);

  const collision = {
    bodyHalf: { x: 0.45, z: 1.15 },
    bodyTop: 0.55,
    topHalf: { x: 0.45, z: 1.15 },
    topOffsetZ: 0,
    topTop: 1.0
  };

  interactables.push({
    mesh: group, x, z,
    radius: 3.5,
    name, type: 'vehicle', vehicleKind: 'motorcycle', speed: 0, collision
  });
}

// A simple crate/block prop. Reuses the same collision-shape struct as the
// vehicles (bodyHalf/bodyTop/top*) so it's automatically solid to walk or
// drive into, and standable on top via the same roof-height logic. Unlike
// vehicles it never moves on its own - the only way it moves is being
// picked up and placed by the player (see pickUpProp/placeHeldProp in
// player.js). heldByPlayer is toggled by those and makes this item invisible
// to collision/standing checks while it's being carried.
function makeBlock(x, z, opts = {}) {
  const { color = 0xd9b54c, dims = { w: 1.2, h: 1.2, d: 1.2 }, name = "Crate" } = opts;

  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(dims.w, dims.h, dims.d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.75 })
  );
  box.position.set(0, dims.h / 2, 0);
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  group.position.set(x, 0, z);
  scene.add(group);

  const collision = {
    bodyHalf: { x: dims.w / 2, z: dims.d / 2 },
    bodyTop: dims.h,
    topHalf: { x: dims.w / 2, z: dims.d / 2 },
    topOffsetZ: 0,
    topTop: dims.h
  };

  interactables.push({
    mesh: group, x, z,
    radius: 2.5,
    name, type: 'prop', heldByPlayer: false, collision
  });
}

function makeTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2f })
  );
  trunk.position.set(x, 1.1, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x2f7a3f })
  );
  leaves.position.set(x, 3.0, z);
  leaves.castShadow = true;
  scene.add(leaves);

  treeObstacles.push({ x, z, radius: 0.8 });
}

// Populate Map
makeBuilding(-25, -25, 14, 14, 10, 0xb5533c, "Corner Store", "A small shop on the block. Interior not built yet in this POC.");
makeBuilding(25, -25, 16, 12, 16, 0x4a6b8a, "Apartment Block", "Several floors of apartments. Interior not built yet in this POC.");
makeBuilding(-25, 25, 12, 12, 7, 0xd9a441, "Diner", "Smells like pancakes, hypothetically. Interior not built yet in this POC.");
makeBuilding(25, 25, 18, 14, 22, 0x6b7280, "Office Tower", "The tallest building around. Interior not built yet in this POC.");
makeBuilding(-75, 0, 12, 20, 9, 0x8a5fa3, "Library", "Quiet, presumably. Interior not built yet in this POC.");
makeBuilding(75, 0, 20, 12, 8, 0x3f9977, "Gym", "Interior not built yet in this POC.");
makeBuilding(0, -85, 14, 14, 12, 0xc25b8f, "Community Center", "Interior not built yet in this POC.");
makeBuilding(0, 85, 16, 16, 13, 0x556b8a, "Theater", "Interior not built yet in this POC.");

makeVehicle(8, 12, "Sedan", { bodyColor: 0xd64545 });

makePickupTruck(-14, 40, "Pickup Truck", { bodyColor: 0x8a8f98, topColor: 0xf5f5f5 });

// Small blue roadster with a black top - lower and a bit shorter than the sedan.
makeVehicle(40, -12, "Miata", {
  bodyColor: 0x1f4fbf,
  topColor: 0x111318,
  bodyDims: { w: 1.9, h: 0.75, d: 3.8 },
  bodyY: 0.62,
  topDims: { w: 1.6, h: 0.5, d: 1.7 },
  topOffsetZ: -0.15,
  topY: 1.1,
  wheelRadius: 0.36,
  wheelPositions: [[-1.0, 0.36, 1.25], [1.0, 0.36, 1.25], [-1.0, 0.36, -1.25], [1.0, 0.36, -1.25]]
});

makeMotorcycle(18, -40, "Motorcycle");

makeBlock(15, 10, { color: 0xd9b54c });
makeBlock(20, 10, { color: 0xb5533c });
makeBlock(25, 10, { color: 0x4a6b8a });

for (let i = 0; i < 24; i++) {
  const angle = Math.random() * Math.PI * 2;
  const r = 15 + Math.random() * 95;
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  if (Math.abs(x) < 7 || Math.abs(z) < 7 || Math.abs(x - 50) < 7 || Math.abs(x + 50) < 7 || Math.abs(z - 50) < 7 || Math.abs(z + 50) < 7) continue;
  makeTree(x, z);
}

// Each vehicle/prop carries its own footprint/heights (in its own local
// space, before rotation) on item.collision, set up in makeVehicle() /
// makePickupTruck() / makeMotorcycle() / makeBlock() above. Shared by both
// the "is this a wall" collision check and the "can I stand on this thing"
// check. Both functions below treat vehicles and props the same way; a prop
// currently being carried (heldByPlayer) is skipped by both, since it's
// riding along with the player rather than sitting in the world.

// Returns the top surface height at a world (x,z) over a given item, or
// null if that point isn't over the item at all.
function getObstacleTopAt(item, worldX, worldZ) {
  const c = item.collision;
  const dx = worldX - item.x;
  const dz = worldZ - item.z;
  const yaw = item.mesh.rotation.y;
  const cos = Math.cos(-yaw);
  const sin = Math.sin(-yaw);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;

  if (Math.abs(localX) <= c.topHalf.x && Math.abs(localZ - c.topOffsetZ) <= c.topHalf.z) {
    return c.topTop;
  }
  if (Math.abs(localX) <= c.bodyHalf.x && Math.abs(localZ) <= c.bodyHalf.z) {
    return c.bodyTop;
  }
  return null;
}

// Returns the highest standable surface under a given world position, or null.
function findStandableSurfaceY(worldX, worldZ) {
  let top = null;
  for (const item of interactables) {
    if (item.type !== 'vehicle' && item.type !== 'prop') continue;
    if (item.heldByPlayer) continue;
    if (drivingState.active && drivingState.vehicle === item) continue; // can't stand on the car you're driving
    const y = getObstacleTopAt(item, worldX, worldZ);
    if (y !== null && (top === null || y > top)) top = y;
  }
  return top;
}

function checkDynamicCollisions(posX, posZ, radius, posY, excludeVehicle) {
  for (const item of interactables) {
    if (item.type !== 'vehicle' && item.type !== 'prop') continue;
    if (item === excludeVehicle) continue;
    if (item.heldByPlayer) continue;

    const bodyHalf = item.collision.bodyHalf;
    const dx = posX - item.x;
    const dz = posZ - item.z;
    const yaw = item.mesh.rotation.y;
    // Rotate the world-space point into the item's local space so a
    // turned vehicle's box is still tested correctly.
    const cos = Math.cos(-yaw);
    const sin = Math.sin(-yaw);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;

    const closestX = Math.max(-bodyHalf.x, Math.min(localX, bodyHalf.x));
    const closestZ = Math.max(-bodyHalf.z, Math.min(localZ, bodyHalf.z));
    const ddx = localX - closestX;
    const ddz = localZ - closestZ;
    if (ddx * ddx + ddz * ddz >= radius * radius) continue; // not overlapping the footprint

    // Overlapping the footprint in X/Z - but if we've already cleared the
    // roof height at this spot (jumping/standing on top), it's not a wall.
    if (posY !== undefined) {
      const topHere = getObstacleTopAt(item, posX, posZ);
      if (topHere !== null && posY >= topHere - 0.15) continue;
    }

    return true;
  }
  return false;
}

function checkWorldCollisions(posX, posZ, radius, posY, excludeVehicle) {
  for (const box of buildingBoxes) {
    const closestX = Math.max(box.minX, Math.min(posX, box.maxX));
    const closestZ = Math.max(box.minZ, Math.min(posZ, box.maxZ));
    const dx = posX - closestX;
    const dz = posZ - closestZ;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  for (const tree of treeObstacles) {
    const dx = posX - tree.x;
    const dz = posZ - tree.z;
    const minDist = radius + tree.radius;
    if (dx * dx + dz * dz < minDist * minDist) return true;
  }
  if (checkDynamicCollisions(posX, posZ, radius, posY, excludeVehicle)) return true;
  return false;
}

// Where to put the player when they get out of a vehicle. Candidate offsets
// are computed in the vehicle's own LOCAL space (right/left/behind/front),
// sized off that vehicle's actual collision.bodyHalf footprint, then rotated
// by the vehicle's current yaw into world space - so "get out" lands near the
// vehicle regardless of which way it happens to be parked or how long/wide
// it is. Candidates are tried in order and the first one not already
// occupied by a building/tree/other vehicle is used.
const PLAYER_RADIUS = 0.5; // matches the radius used for the player elsewhere

function findVehicleExitSpot(v) {
  const half = v.collision.bodyHalf;
  const clearance = 1.2; // gap beyond the vehicle's own edge
  const yaw = v.mesh.rotation.y;

  const localCandidates = [
    { x: half.x + clearance, z: 0 },     // right side
    { x: -(half.x + clearance), z: 0 },  // left side
    { x: 0, z: -(half.z + clearance) },  // behind
    { x: 0, z: half.z + clearance }      // in front
  ];

  const toWorld = (local) => ({
    x: v.x + local.x * Math.cos(yaw) + local.z * Math.sin(yaw),
    z: v.z - local.x * Math.sin(yaw) + local.z * Math.cos(yaw)
  });

  for (const local of localCandidates) {
    const spot = toWorld(local);
    if (!checkWorldCollisions(spot.x, spot.z, PLAYER_RADIUS, GROUND_Y, v)) {
      return spot;
    }
  }

  // Boxed in on all four sides - fall back to the right-side spot rather
  // than leaving the player with nowhere to go.
  return toWorld(localCandidates[0]);
}