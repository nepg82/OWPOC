const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fd0ec);
scene.fog = new THREE.Fog(0x8fd0ec, 60, 500);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff3d6, 1.0);
sun.position.set(60, 90, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -300;
sun.shadow.camera.right = 300;
sun.shadow.camera.top = 300;
sun.shadow.camera.bottom = -300;
scene.add(sun);

const groundSize = 600;
const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x5b8a3a, roughness: 1 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function makeRoad(w, h, x, z) {
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.9 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.02, z);
  road.receiveShadow = true;
  scene.add(road);
}

makeRoad(groundSize, 10, 0, 0);
makeRoad(10, groundSize, 0, 0);
makeRoad(groundSize, 10, 0, 50);
makeRoad(10, groundSize, 50, 0);
makeRoad(groundSize, 10, 0, -50);
makeRoad(10, groundSize, -50, 0);

for (let i = -groundSize / 2; i < groundSize / 2; i += 6) {
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xdddddd })
  );
  mark.rotation.x = -Math.PI / 2;
  mark.position.set(i, 0.03, 0.05);
  scene.add(mark);
  const mark2 = mark.clone();
  mark2.rotation.z = Math.PI / 2;
  mark2.position.set(0.05, 0.03, i);
  scene.add(mark2);
}