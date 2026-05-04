// ─────────────────────────────────────────────────────────────────────────────
// Player.js  –  first-person camera controller (WASD + mouse look)
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

const SPEED      = 14;
const MOUSE_SENS = 0.0022;
const GRAVITY    = 18;
const JUMP_VEL   = 9;
const GROUND_Y   = 1.6; // eye height

export class Player {
  constructor(camera) {
    this.camera = camera;

    // Position
    camera.position.set(0, GROUND_Y, -120);
    camera.rotation.order = 'YXZ';

    // Look angles
    this.yaw   = 0;
    this.pitch = 0;

    // Movement
    this.velocity = new THREE.Vector3();
    this.onGround = true;

    // Key state
    this.keys = {};

    // Bind handlers
    this._onKey     = this._onKey.bind(this);
    this._onMouse   = this._onMouse.bind(this);
    this._onClick   = this._onClick.bind(this);
    this._onLockChange = this._onLockChange.bind(this);

    document.addEventListener('keydown',  this._onKey);
    document.addEventListener('keyup',    this._onKey);
    document.addEventListener('click',    this._onClick);
    document.addEventListener('mousemove', this._onMouse);
    document.addEventListener('pointerlockchange', this._onLockChange);
  }

  _onKey(e) {
    this.keys[e.code] = e.type === 'keydown';
  }

  _onClick() {
    if (!document.pointerLockElement) {
      document.body.requestPointerLock();
    }
  }

  _onLockChange() {
    this.locked = !!document.pointerLockElement;
  }

  _onMouse(e) {
    if (!this.locked) return;
    this.yaw   -= e.movementX * MOUSE_SENS;
    this.pitch -= e.movementY * MOUSE_SENS;
    this.pitch  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
  }

  update(dt) {
    const cam = this.camera;

    // Apply look
    cam.rotation.y = this.yaw;
    cam.rotation.x = this.pitch;

    // Gather input direction
    const dir = new THREE.Vector3();
    const k   = this.keys;

    if (k['KeyW'] || k['ArrowUp'])    dir.z -= 1;
    if (k['KeyS'] || k['ArrowDown'])  dir.z += 1;
    if (k['KeyA'] || k['ArrowLeft'])  dir.x -= 1;
    if (k['KeyD'] || k['ArrowRight']) dir.x += 1;

    if (dir.lengthSq() > 0) dir.normalize();

    // Transform to camera-local horizontal plane
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right   = new THREE.Vector3(Math.cos(this.yaw),  0, -Math.sin(this.yaw));

    const move = forward.clone().multiplyScalar(-dir.z)
      .add(right.clone().multiplyScalar(dir.x));

    // Jump
    if ((k['Space'] || k['KeyE']) && this.onGround) {
      this.velocity.y = JUMP_VEL;
      this.onGround   = false;
    }

    // Gravity
    if (!this.onGround) {
      this.velocity.y -= GRAVITY * dt;
    }

    // Apply horizontal movement
    cam.position.x += move.x * SPEED * dt;
    cam.position.z += move.z * SPEED * dt;
    cam.position.y += this.velocity.y * dt;

    // Floor clamp
    if (cam.position.y <= GROUND_Y) {
      cam.position.y = GROUND_Y;
      this.velocity.y = 0;
      this.onGround   = true;
    }

    // World boundary
    const BOUND = 200;
    cam.position.x = Math.max(-BOUND, Math.min(BOUND, cam.position.x));
    cam.position.z = Math.max(-BOUND, Math.min(BOUND, cam.position.z));
  }

  get position() {
    return this.camera.position;
  }

  dispose() {
    document.removeEventListener('keydown',  this._onKey);
    document.removeEventListener('keyup',    this._onKey);
    document.removeEventListener('click',    this._onClick);
    document.removeEventListener('mousemove', this._onMouse);
    document.removeEventListener('pointerlockchange', this._onLockChange);
  }
}
