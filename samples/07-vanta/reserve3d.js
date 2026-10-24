// Order summary: the configured Σ1 (Magenta Flux, Forged Y, cyan calipers) as a live studio thumbnail.
loadV3().then(V => {
  const { THREE } = V;
  const el = document.getElementById('rv3d');
  const w = el.clientWidth || 480;
  const S = V.stage(el, { w, h: 250, fov: 16, pos: [7.4, 1.8, 7.0], target: [0.35, .5, -0.3], bloom: [.5, .3, 3.0] });
  const car = V.buildCar({ paint: 'magenta', rim: 'forged', caliper: '#00e5ff' });
  const turn = new THREE.Group(); turn.add(car.group); S.scene.add(turn);
  V.studioLights(S.scene, { key: .45 });
  V.addFloor(S.scene, turn, { radius: 6, opacity: .85, edge: false, grid: false });
  S.animate(t => { turn.rotation.y = -0.1 + Math.sin(t * .2) * .3; }, { pose: 0, frames: 3 });
});
