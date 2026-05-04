// ─────────────────────────────────────────────────────────────────────────────
// World.js  –  builds and owns the entire Three.js scene geometry
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

/** Reusable box-geometry helper */
function makeBox(w, h, d, color, receiveShadow = true) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = receiveShadow;
  return mesh;
}

/** Sphere helper */
function makeSphere(r, color, seg = 16) {
  const geo = new THREE.SphereGeometry(r, seg, seg);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

/** Cylinder helper */
function makeCylinder(rt, rb, h, color, seg = 12) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, seg);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

/** Simple pine-tree placed at (x, y, z) */
function makeTree(x, y, z, scale = 1) {
  const group = new THREE.Group();

  const trunk = makeCylinder(0.18 * scale, 0.25 * scale, 1.2 * scale, 0x6b4226);
  trunk.position.y = 0.6 * scale;
  group.add(trunk);

  const foliage1 = makeCylinder(0, 1.2 * scale, 1.8 * scale, 0x2d6a4f, 8);
  foliage1.position.y = 2 * scale;
  group.add(foliage1);

  const foliage2 = makeCylinder(0, 0.9 * scale, 1.5 * scale, 0x40916c, 8);
  foliage2.position.y = 2.9 * scale;
  group.add(foliage2);

  const foliage3 = makeCylinder(0, 0.55 * scale, 1.1 * scale, 0x52b788, 8);
  foliage3.position.y = 3.7 * scale;
  group.add(foliage3);

  group.position.set(x, y, z);
  return group;
}

/** Floating orb landmark at position p */
function makeLandmark(position, color, label) {
  const group = new THREE.Group();

  const core = makeSphere(1.1, color, 24);
  group.add(core);

  // Glowing ring
  const ringGeo = new THREE.TorusGeometry(1.7, 0.12, 8, 40);
  const ringMat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.5 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  group.position.copy(position);
  group.userData.label = label;
  group.userData.baseY = position.y;

  return group;
}

/** Flat platform */
function makePlatform(x, z, w, d, h, color) {
  const mesh = makeBox(w, h, d, color);
  mesh.position.set(x, h / 2, z);
  return mesh;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.landmarks = [];
    this._build();
  }

  _build() {
    const scene = this.scene;

    // ── Lighting ───────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0x4a6fa5, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.3);
    sun.position.set(80, 120, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    sun.shadow.camera.far = 600;
    scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0x8ab4f8, 0.4);
    fillLight.position.set(-60, 40, -80);
    scene.add(fillLight);

    // ── Sky gradient (large sphere) ────────────────────────────────
    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x0d1b2a,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // ── Stars ──────────────────────────────────────────────────────
    this._addStars();

    // ── Ground ────────────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1a3a2a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Central path (stone road)
    const path = makeBox(6, 0.05, 260, 0x8a7a6a);
    path.position.set(0, 0.02, 0);
    scene.add(path);

    // ── Chapter zones ─────────────────────────────────────────────

    // Zone 1 – Childhood (south)
    this._buildChildhoodZone(-100);

    // Zone 2 – Youth (center-south)
    this._buildYouthZone(-40);

    // Zone 3 – Dreams (center-north)
    this._buildDreamsZone(30);

    // Zone 4 – Future (north)
    this._buildFutureZone(90);

    // ── Forest borders ────────────────────────────────────────────
    this._addForestBorder();

    // ── Ambient fireflies ─────────────────────────────────────────
    this._addFireflies();

    // ── Floating particles ────────────────────────────────────────
    this._addParticles();
  }

  _addStars() {
    const positions = [];
    for (let i = 0; i < 3000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 460 + Math.random() * 30;
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true });
    this.scene.add(new THREE.Points(geo, mat));
  }

  _addParticles() {
    // Floating dust / spores near ground
    const positions = [];
    for (let i = 0; i < 600; i++) {
      positions.push(
        (Math.random() - 0.5) * 200,
        Math.random() * 12 + 0.5,
        (Math.random() - 0.5) * 260,
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xe8d5b7, size: 0.22, transparent: true, opacity: 0.45 });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  _addFireflies() {
    this.fireflies = [];
    for (let i = 0; i < 35; i++) {
      const light = new THREE.PointLight(0x7fff7f, 0.8, 12);
      light.position.set(
        (Math.random() - 0.5) * 120,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 240,
      );
      light.userData.phase = Math.random() * Math.PI * 2;
      light.userData.speed = 0.4 + Math.random() * 0.6;
      this.scene.add(light);
      this.fireflies.push(light);
    }
  }

  // ── Zone builders ────────────────────────────────────────────────

  _buildChildhoodZone(centerZ) {
    const scene = this.scene;
    const cx = 0, cz = centerZ;

    // Grass platform
    const plat = makePlatform(cx, cz, 55, 55, 0.3, 0x2d6e40);
    scene.add(plat);

    // Small house
    const house = new THREE.Group();
    const walls = makeBox(8, 5, 7, 0xf5deb3);
    walls.position.y = 2.5;
    house.add(walls);

    const roofGeo = new THREE.ConeGeometry(6.5, 4, 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 7;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);

    const door = makeBox(1.5, 2.5, 0.2, 0x6b4226);
    door.position.set(0, 1.25, 3.55);
    house.add(door);

    house.position.set(cx + 12, 0.3, cz - 5);
    scene.add(house);

    // Sandbox
    const sb = makeBox(4, 0.4, 4, 0xf0d090);
    sb.position.set(cx - 12, 0.5, cz + 5);
    scene.add(sb);

    // Toy blocks
    [[-1, 0], [0, 0], [1, 0], [-0.5, 1]].forEach(([bx, by]) => {
      const block = makeBox(0.7, 0.7, 0.7, [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12][Math.floor(Math.random() * 4)]);
      block.position.set(cx - 12 + bx * 0.8, 0.75 + by * 0.75, cz + 5);
      scene.add(block);
    });

    // Trees around
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 22;
      scene.add(makeTree(cx + Math.cos(angle) * r, 0, cz + Math.sin(angle) * r, 0.9));
    }

    // Swing
    const swingLeft  = makeBox(0.15, 4, 0.15, 0x8b6914);
    const swingRight = makeBox(0.15, 4, 0.15, 0x8b6914);
    swingLeft.position.set(cx - 14, 2, cz - 10);
    swingRight.position.set(cx - 12, 2, cz - 10);
    const seat = makeBox(2.2, 0.15, 0.5, 0x8b6914);
    seat.position.set(cx - 13, 0.3, cz - 10);
    scene.add(swingLeft, swingRight, seat);

    // Landmark orb
    const lm = makeLandmark(new THREE.Vector3(cx, 3.5, cz), 0xffd700, 'childhood');
    scene.add(lm);
    this.landmarks.push(lm);
  }

  _buildYouthZone(centerZ) {
    const scene = this.scene;
    const cx = 0, cz = centerZ;

    // Platform
    const plat = makePlatform(cx, cz, 55, 55, 0.3, 0x1a4d6b);
    scene.add(plat);

    // School building
    const school = new THREE.Group();
    const walls = makeBox(18, 7, 10, 0xd9e8f0);
    walls.position.y = 3.5;
    school.add(walls);

    const roof = makeBox(19, 1.2, 11, 0x607d8b);
    roof.position.y = 7.6;
    school.add(roof);

    // Windows
    for (let i = -2; i <= 2; i++) {
      const win = makeBox(1.5, 1.8, 0.15, 0x87ceeb);
      win.position.set(i * 3.5, 4, 5.1);
      school.add(win);
    }
    school.position.set(cx + 14, 0.3, cz);
    scene.add(school);

    // Books
    [[0, 0], [0.5, 0], [0, 0.45]].forEach(([bx, by], i) => {
      const book = makeBox(0.9, 0.3, 1.2, [0xe74c3c, 0x3498db, 0x27ae60][i]);
      book.position.set(cx - 12 + bx, 0.5 + by, cz);
      scene.add(book);
    });

    // Football
    const ball = makeSphere(0.6, 0x333333, 12);
    ball.position.set(cx - 14, 0.9, cz - 8);
    scene.add(ball);

    // Goal posts
    const gLeft  = makeBox(0.2, 4, 0.2, 0xffffff);
    const gRight = makeBox(0.2, 4, 0.2, 0xffffff);
    const gTop   = makeBox(8.4, 0.2, 0.2, 0xffffff);
    gLeft.position.set(cx - 18, 2, cz - 8);
    gRight.position.set(cx - 10, 2, cz - 8);
    gTop.position.set(cx - 14, 4, cz - 8);
    scene.add(gLeft, gRight, gTop);

    // Street lamps
    for (let s = -2; s <= 2; s++) {
      const pole = makeBox(0.15, 5, 0.15, 0x555555);
      pole.position.set(cx + 4, 2.5, cz + s * 9);
      const lamp = makeSphere(0.35, 0xffffaa, 8);
      lamp.position.set(cx + 4, 5.5, cz + s * 9);
      const pl = new THREE.PointLight(0xffffaa, 0.6, 14);
      pl.position.set(cx + 4, 5.5, cz + s * 9);
      scene.add(pole, lamp, pl);
    }

    // Landmark
    const lm = makeLandmark(new THREE.Vector3(cx, 3.5, cz), 0x4fc3f7, 'youth');
    scene.add(lm);
    this.landmarks.push(lm);
  }

  _buildDreamsZone(centerZ) {
    const scene = this.scene;
    const cx = 0, cz = centerZ;

    // Platform – purple dreamlike
    const plat = makePlatform(cx, cz, 55, 55, 0.3, 0x2d1b4e);
    scene.add(plat);

    // Floating crystals
    const crystalColors = [0x9b59b6, 0x8e44ad, 0x6c3483, 0xd2b4de, 0xa569bd];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 14 + Math.random() * 8;
      const h = 1.5 + Math.random() * 3;
      const geo = new THREE.OctahedronGeometry(0.7 + Math.random() * 0.7, 0);
      const mat = new THREE.MeshLambertMaterial({
        color: crystalColors[i % crystalColors.length],
        emissive: crystalColors[i % crystalColors.length],
        emissiveIntensity: 0.3,
      });
      const crystal = new THREE.Mesh(geo, mat);
      crystal.position.set(cx + Math.cos(angle) * r, h, cz + Math.sin(angle) * r);
      crystal.userData.floatPhase = Math.random() * Math.PI * 2;
      crystal.userData.baseY = h;
      crystal.castShadow = true;
      scene.add(crystal);
      this._crystals = this._crystals || [];
      this._crystals.push(crystal);
    }

    // Computer desk (dreams of coding)
    const desk = makeBox(5, 0.15, 2.5, 0x5d4037);
    desk.position.set(cx + 10, 1.2, cz);
    scene.add(desk);

    const monitor = makeBox(3.5, 2.2, 0.2, 0x263238);
    monitor.position.set(cx + 10, 2.7, cz - 0.8);
    scene.add(monitor);

    const screen = makeBox(3.1, 1.9, 0.05, 0x1565c0);
    screen.position.set(cx + 10, 2.7, cz - 0.88);
    scene.add(screen);

    const keyboard = makeBox(2.5, 0.1, 0.9, 0x455a64);
    keyboard.position.set(cx + 10, 1.3, cz + 0.3);
    scene.add(keyboard);

    // Stars cluster (dream stars closer to ground)
    const starPos = [];
    for (let i = 0; i < 300; i++) {
      starPos.push(
        cx + (Math.random() - 0.5) * 50,
        2 + Math.random() * 15,
        cz + (Math.random() - 0.5) * 50,
      );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xd2b4de, size: 0.25, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Landmark
    const lm = makeLandmark(new THREE.Vector3(cx, 3.5, cz), 0xbd7aff, 'dreams');
    scene.add(lm);
    this.landmarks.push(lm);
  }

  _buildFutureZone(centerZ) {
    const scene = this.scene;
    const cx = 0, cz = centerZ;

    // Platform – bright/hopeful
    const plat = makePlatform(cx, cz, 60, 60, 0.3, 0x0d3b4a);
    scene.add(plat);

    // Futuristic pillars
    const pillarPositions = [[-15, -15], [15, -15], [-15, 15], [15, 15]];
    pillarPositions.forEach(([px, pz]) => {
      const pillar = makeCylinder(0.6, 0.8, 10, 0x00bcd4, 6);
      pillar.position.set(cx + px, 5, cz + pz);
      scene.add(pillar);

      const cap = makeSphere(1, 0x00e5ff, 16);
      cap.position.set(cx + px, 10.5, cz + pz);
      scene.add(cap);

      const pl = new THREE.PointLight(0x00e5ff, 0.9, 20);
      pl.position.set(cx + px, 10.5, cz + pz);
      scene.add(pl);
    });

    // Central platform raised
    const center = makePlatform(cx, cz, 14, 14, 1.2, 0x37474f);
    scene.add(center);

    // Rocket / tower on center
    const rocketBody = makeCylinder(1.2, 1.8, 9, 0xeceff1, 8);
    rocketBody.position.set(cx, 5.5, cz);
    scene.add(rocketBody);

    const rocketNose = makeCylinder(0, 1.2, 3.5, 0xef5350, 8);
    rocketNose.position.set(cx, 11.25, cz);
    scene.add(rocketNose);

    const fin1 = makeBox(1.5, 2.5, 0.15, 0xef5350);
    const fin2 = fin1.clone();
    const fin3 = fin1.clone();
    fin1.position.set(cx + 1.9, 1.7, cz);
    fin2.position.set(cx - 1.9, 1.7, cz);
    fin3.position.set(cx, 1.7, cz + 1.9);
    scene.add(fin1, fin2, fin3);

    // Exhaust glow
    const exhaustLight = new THREE.PointLight(0xff6600, 1.5, 18);
    exhaustLight.position.set(cx, 0.8, cz);
    scene.add(exhaustLight);
    this._exhaustLight = exhaustLight;

    // Stepping stones path
    for (let i = 1; i <= 4; i++) {
      const stone = makePlatform(cx, cz - 30 + i * 6, 3.5, 3.5, 0.25, 0x455a64);
      scene.add(stone);
    }

    // Landmark
    const lm = makeLandmark(new THREE.Vector3(cx, 6, cz), 0x00e5ff, 'future');
    scene.add(lm);
    this.landmarks.push(lm);
  }

  _addForestBorder() {
    const scene = this.scene;
    const count = 120;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 80 + Math.random() * 30;
      scene.add(makeTree(
        Math.cos(angle) * r,
        0,
        Math.sin(angle) * (r * 1.6) - 10,
        0.8 + Math.random() * 0.9,
      ));
    }
  }

  /** Called each frame – animates orbs, crystals, fireflies, particles */
  update(time) {
    // Float landmark orbs
    this.landmarks.forEach((lm, i) => {
      lm.position.y = lm.userData.baseY + Math.sin(time * 0.8 + i * 1.5) * 0.4;
      lm.rotation.y = time * 0.5 + i;
    });

    // Float crystals
    if (this._crystals) {
      this._crystals.forEach(c => {
        c.position.y = c.userData.baseY + Math.sin(time * 0.7 + c.userData.floatPhase) * 0.5;
        c.rotation.y += 0.01;
      });
    }

    // Fireflies
    this.fireflies.forEach(f => {
      const phase = f.userData.phase + time * f.userData.speed;
      f.position.x += Math.sin(phase * 1.3) * 0.04;
      f.position.z += Math.cos(phase * 0.9) * 0.04;
      f.position.y = 1.5 + Math.sin(phase * 1.7) * 1;
      f.intensity = 0.3 + Math.abs(Math.sin(phase * 2)) * 1.2;
    });

    // Rocket exhaust flicker
    if (this._exhaustLight) {
      this._exhaustLight.intensity = 1 + Math.sin(time * 8) * 0.5;
    }

    // Drift particles slowly
    if (this.particles) {
      this.particles.rotation.y = time * 0.02;
    }
  }
}
