// ─────────────────────────────────────────────────────────────────────────────
// main.js  –  entry point: renderer, game loop, startup
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { World }        from './components/World.js';
import { Player }       from './components/Player.js';
import { StoryManager } from './components/StoryManager.js';

// ── Renderer ──────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

// ── Scene & Camera ────────────────────────────────────────────────────────────
const scene  = new THREE.Scene();
scene.fog    = new THREE.FogExp2(0x0d1b2a, 0.007);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 800);

// ── Game objects ──────────────────────────────────────────────────────────────
const world        = new World(scene);
const player       = new Player(camera);
const storyManager = new StoryManager(world.landmarks);

// ── Resize handler ────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Title-screen start button ─────────────────────────────────────────────────
const titleScreen = document.getElementById('title-screen');
const hud         = document.getElementById('hud');
const startBtn    = document.getElementById('start-btn');

let gameStarted = false;

startBtn.addEventListener('click', () => {
  titleScreen.style.opacity = '0';
  setTimeout(() => {
    titleScreen.style.display = 'none';
    hud.style.display = 'block';
    gameStarted = true;
    // Request pointer lock after brief delay
    setTimeout(() => document.body.requestPointerLock(), 300);
  }, 1000);
});

// ── Clock ─────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

// ── Render loop ───────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  const dt   = Math.min(clock.getDelta(), 0.05); // cap to 50 ms
  const time = clock.getElapsedTime();

  if (gameStarted) {
    if (!storyManager.isDialogOpen) {
      player.update(dt);
    }
    storyManager.update(player.position);
    world.update(time);
  }

  renderer.render(scene, camera);
}

animate();
