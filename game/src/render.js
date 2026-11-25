// Drawing only: the Three.js renderer and the camera that follows the chef.
// The camera sits high and south of the chef and looks slightly north, so the
// whole kitchen — bins, board, stove, island and pass — stays in frame.
import * as THREE from 'three';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const CAMERA_OFFSET = { x: 0, y: 10.0, z: 8.0 };

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2b1608');
  scene.fog = new THREE.Fog('#2b1608', 26, 46);

  const ambient = new THREE.AmbientLight('#fff1d6', 0.85);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#ffe8c0', 1.6);
  sun.position.set(6, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.camera.far = 40;
  scene.add(sun);
  const warm = new THREE.PointLight('#ffb63d', 12, 14, 1.6);
  warm.position.set(0, 4.5, 0.5);
  scene.add(warm);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 0, 0);
  const desired = new THREE.Vector3();
  let snapped = false;

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  /** One frame: ease the camera toward the chef and paint the kitchen. */
  function draw(state, time) {
    const chef = state.chef;
    desired.set(chef.x * 0.45 + CAMERA_OFFSET.x, CAMERA_OFFSET.y, chef.z * 0.45 + CAMERA_OFFSET.z);
    if (!snapped) {
      camera.position.copy(desired);
      snapped = true;
    } else {
      camera.position.lerp(desired, 0.08);
    }
    target.set(chef.x * 0.55, 0, chef.z * 0.55 - 1.4);
    camera.lookAt(target);
    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener('resize', resize);
  return { scene, draw };
}
