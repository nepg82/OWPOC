function updateCamera() {
  const target = drivingState.active ? drivingState.vehicle.mesh : player;
  const onMotorcycle = drivingState.active && drivingState.vehicle.vehicleKind === 'motorcycle';
  const distance = onMotorcycle ? 7.5 : (drivingState.active ? 11.0 : 7.0);
  const yaw = target.rotation.y;

  const offsetX = -Math.sin(yaw) * distance * Math.cos(cameraPitch);
  const offsetZ = -Math.cos(yaw) * distance * Math.cos(cameraPitch);
  const offsetY = distance * Math.sin(cameraPitch) + (onMotorcycle ? 1.8 : (drivingState.active ? 2.5 : 1.8));

  const desiredPos = new THREE.Vector3(
    target.position.x + offsetX,
    target.position.y + offsetY,
    target.position.z + offsetZ
  );

  camera.position.lerp(desiredPos, 0.15);
  const lookTarget = target.position.clone().add(new THREE.Vector3(0, 1.4, 0));
  camera.lookAt(lookTarget);
}

function findNearestInteractable() {
  let best = null;
  let bestDist = Infinity;
  const refPos = drivingState.active ? drivingState.vehicle.mesh.position : player.position;

  for (const item of interactables) {
    const dx = refPos.x - item.x;
    const dz = refPos.z - item.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < item.radius && dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }
  return best;
}

function updateInteraction() {
  if (drivingState.active) {
    promptEl.innerHTML = `<kbd>SPACE</kbd> Exit vehicle`;
    promptEl.classList.add('show');
    if (spaceJustPressed) exitVehicle();
    spaceJustPressed = false;
    return;
  }

  if (modalOpen) return;

  if (heldProp) {
    // Hands are full - SPACE always places, regardless of what's nearby.
    promptEl.innerHTML = `<kbd>SPACE</kbd> place ${heldProp.name}`;
    promptEl.classList.add('show');
    if (spaceJustPressed) placeHeldProp();
    spaceJustPressed = false;
    return;
  }

  nearest = findNearestInteractable();

  if (nearest) {
    let verb = 'enter';
    if (nearest.type === 'vehicle') verb = 'drive';
    if (nearest.type === 'prop') verb = 'pick up';
    promptEl.innerHTML = `<kbd>SPACE</kbd> ${verb} ${nearest.name}`;
    promptEl.classList.add('show');
  } else {
    promptEl.classList.remove('show');
  }

  if (spaceJustPressed && nearest) {
    if (nearest.type === 'vehicle') {
      enterVehicle(nearest);
    } else if (nearest.type === 'prop') {
      pickUpProp(nearest);
    } else {
      modalTitle.textContent = nearest.name;
      modalBody.textContent = nearest.blurb;
      modalEl.classList.add('show');
      modalOpen = true;
    }
  }
  spaceJustPressed = false;
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  updatePlayer(dt);
  updateVehicle(dt);
  updateInteraction();
  updateCamera();

  wJustPressed = false;
  sJustPressed = false;

  renderer.render(scene, camera);
}

animate();