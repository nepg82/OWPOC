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

function makeVehicle(x, z, color, name) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.9, 4.2),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 })
  );
  body.position.y = 0.7;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.7, 2.0),
    new THREE.MeshStandardMaterial({ color: 0xbfd8e8, roughness: 0.2, metalness: 0.1 })
  );
  cabin.position.set(0, 1.35, -0.2);
  cabin.castShadow = true;
  group.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const wheelPositions = [[-1.1, 0.4, 1.4], [1.1, 0.4, 1.4], [-1.1, 0.4, -1.4], [1.1, 0.4, -1.4]];
  wheelPositions.forEach(p => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...p);
    wheel.castShadow = true;
    group.add(wheel);
  });

  group.position.set(x, 0, z);
  scene.add(group);

  interactables.push({ mesh: group, x, z, radius: 4.5, name, type: 'vehicle', speed: 0 });
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

makeVehicle(8, 12, 0xd64545, "Sedan");
makeVehicle(-14, 40, 0x3560c9, "Pickup Truck");
makeVehicle(40, -12, 0xe0c23c, "Taxi");

for (let i = 0; i < 24; i++) {
  const angle = Math.random() * Math.PI * 2;
  const r = 15 + Math.random() * 95;
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  if (Math.abs(x) < 7 || Math.abs(z) < 7 || Math.abs(x - 50) < 7 || Math.abs(x + 50) < 7 || Math.abs(z - 50) < 7 || Math.abs(z + 50) < 7) continue;
  makeTree(x, z);
}

function checkWorldCollisions(posX, posZ, radius) {
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
  return false;
}