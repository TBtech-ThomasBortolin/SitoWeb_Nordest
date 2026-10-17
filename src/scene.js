import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Ambiente "cabina di verniciatura": stanza scura con strisce di luce a soffitto e
// pannelli laterali, per riflessi lunghi e netti come sulla carrozzeria lucida.
function boothEnvironment() {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x050608);
  const strip = (w, h, intensity, color = 0xffffff) =>
    new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
  for (let i = -2; i <= 2; i++) {
    const m = strip(0.6, 14, 3.2);
    m.position.set(i * 2.2, 6, 0);
    m.rotation.x = Math.PI / 2;
    env.add(m);
  }
  const left = strip(10, 2.2, 1.6); left.position.set(-7, 1, 0); left.rotation.y = Math.PI / 2; env.add(left);
  const right = strip(10, 1.2, 1.1); right.position.set(7, 2.5, 0); right.rotation.y = -Math.PI / 2; env.add(right);
  const back = strip(8, 0.5, 2.0); back.position.set(0, 0.5, -7); env.add(back);
  const front = strip(8, 0.8, 1.4); front.position.set(0, 2, 7); front.rotation.y = Math.PI; env.add(front);
  const warm = strip(4, 4, 0.9, 0xff4a5a); warm.position.set(0, -6, 2); warm.rotation.x = -Math.PI / 2; env.add(warm);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0x0d0f12 }));
  floor.position.y = -6.5; floor.rotation.x = -Math.PI / 2; env.add(floor);
  return env;
}

// ---------- SUV in stile Alfa Romeo Stelvio, modellato a codice (senza marchi) ----------
// Profilo laterale (asse x = lunghezza, muso verso +x) estruso sulla larghezza.
// Proporzioni ispirate alla Stelvio: 4,69 m di lunghezza, 2,82 m di passo, tetto spiovente.
const WHEEL_R = 0.39;
const AXLE_Y = 0.39;
const AXLE_X = 1.41;
const ARCH_R = 0.48;
const HALF_W = 0.95;

function bodyShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.24, 0.52);
  // sottoscocca alta da SUV + passaruota posteriore
  s.lineTo(-AXLE_X - ARCH_R, 0.34);
  s.absarc(-AXLE_X, AXLE_Y, ARCH_R, Math.PI + 0.1, -0.1, true);
  s.lineTo(AXLE_X - ARCH_R, 0.32);
  // passaruota anteriore
  s.absarc(AXLE_X, AXLE_Y, ARCH_R, Math.PI + 0.1, -0.1, true);
  s.lineTo(2.18, 0.34);
  // paraurti e muso alto, quasi verticale
  s.bezierCurveTo(2.32, 0.36, 2.37, 0.52, 2.37, 0.66);
  s.bezierCurveTo(2.37, 0.8, 2.33, 0.9, 2.24, 0.95);
  // cofano lungo e leggermente bombato
  s.bezierCurveTo(1.9, 1.03, 1.35, 1.07, 0.95, 1.09);
  // linea di cintura che sale verso la coda
  s.lineTo(-1.75, 1.16);
  // coda raccolta
  s.bezierCurveTo(-2.1, 1.16, -2.3, 1.06, -2.32, 0.88);
  s.bezierCurveTo(-2.33, 0.72, -2.3, 0.58, -2.24, 0.52);
  return s;
}

function cabinShape() {
  // padiglione da "SUV coupé": parabrezza inclinato, tetto che scende verso il lunotto
  const s = new THREE.Shape();
  s.moveTo(0.98, 1.06);
  s.bezierCurveTo(0.7, 1.24, 0.38, 1.52, 0.02, 1.6);
  s.bezierCurveTo(-0.45, 1.66, -0.95, 1.64, -1.32, 1.54);
  s.bezierCurveTo(-1.62, 1.44, -1.86, 1.28, -2.0, 1.14);
  s.lineTo(0.98, 1.06);
  return s;
}

// Scudetto a V del "trilobo"
function shieldShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.17, 0.2);
  s.quadraticCurveTo(0, 0.24, 0.17, 0.2);
  s.quadraticCurveTo(0.16, 0.02, 0.0, -0.22);
  s.quadraticCurveTo(-0.16, 0.02, -0.17, 0.2);
  return s;
}

// Cerchio a fori tondi, il classico disegno "a telefono" delle sportive italiane
function buildWheel(rubber, rimMat, caliper, holeMat) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(WHEEL_R - 0.075, 0.075, 16, 48), rubber);
  tire.scale.z = 2.1;
  g.add(tire);
  const RIM = WHEEL_R - 0.13;
  const face = new THREE.Mesh(new THREE.CircleGeometry(RIM, 48), rimMat);
  face.position.z = 0.08;
  g.add(face);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(RIM, 0.016, 10, 48), rimMat);
  lip.position.z = 0.085;
  g.add(lip);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.068, 24), holeMat);
    hole.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.083);
    g.add(hole);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 20), holeMat);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.09;
  g.add(hub);
  const cal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.04), caliper);
  cal.position.set(0.14, 0.12, 0.05);
  g.add(cal);
  return g;
}

// Deforma una geometria vertice per vertice (rastremature), poi ricalcola le normali
function sculpt(source, fn, maxEdge = 0.09) {
  // suddivide i triangoli lunghi delle facce laterali, così la deformazione resta liscia
  let geo = new TessellateModifier(maxEdge, 8).modify(source.toNonIndexed());
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-4);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    fn(v);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Larghezza relativa dell'auto vista dall'alto: muso e coda arrotondati
const planTaper = (x) => {
  const front = Math.max(0, x - 1.75) / 0.65;
  const rear = Math.max(0, -x - 1.8) / 0.55;
  return 1 - 0.22 * front * front - 0.16 * rear * rear;
};

function buildCar(paint) {
  const car = new THREE.Group();

  const extrude = (shape, depth, bevel) => {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, steps: 1, curveSegments: 48,
      bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 8,
    });
    geo.translate(0, 0, -depth / 2);
    return geo;
  };

  const bodyGeo = sculpt(extrude(bodyShape(), HALF_W * 2 - 0.24, 0.12), (v) => {
    // fianchi che rientrano sopra la linea di cintura + spalla sui parafanghi
    const shoulder = THREE.MathUtils.smoothstep(v.y, 0.75, 1.18);
    const hood = THREE.MathUtils.smoothstep(v.x, 0.9, 2.3) * THREE.MathUtils.smoothstep(v.y, 0.8, 1.1);
    v.z *= planTaper(v.x) * (1 - 0.1 * shoulder - 0.06 * hood);
    // cofano leggermente più basso ai lati (nervature)
    v.y -= 0.04 * hood * Math.pow(Math.abs(v.z) / HALF_W, 2);
  });
  const body = new THREE.Mesh(bodyGeo, paint);
  car.add(body);

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x06080b, metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6,
  });
  const cabinGeo = sculpt(extrude(cabinShape(), HALF_W * 2 - 0.42, 0.1), (v) => {
    // padiglione che si stringe verso il tetto (tumblehome)
    const t = THREE.MathUtils.clamp((v.y - 1.06) / 0.6, 0, 1);
    v.z *= planTaper(v.x) * (1 - 0.32 * t);
  });
  const cabin = new THREE.Mesh(cabinGeo, glass);
  car.add(cabin);

  const dark = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, metalness: 0.3, roughness: 0.6 });
  const chromeTrim = new THREE.MeshPhysicalMaterial({ color: 0xe6e9ee, metalness: 1, roughness: 0.12, envMapIntensity: 1.6 });

  // modanatura cromata sotto i finestrini
  for (const z of [-1, 1]) {
    const t = new THREE.Mesh(new RoundedBoxGeometry(2.9, 0.025, 0.02, 2, 0.01), chromeTrim);
    t.position.set(-0.5, 1.12, z * (HALF_W - 0.25));
    t.rotation.z = -0.025;
    car.add(t);
  }

  // protezioni nere sottoporta, da SUV
  for (const z of [-1, 1]) {
    const sill = new THREE.Mesh(new RoundedBoxGeometry(1.86, 0.12, 0.06, 2, 0.03), dark);
    sill.position.set(0, 0.36, z * (HALF_W - 0.02));
    car.add(sill);
  }

  // trilobo: scudetto centrale a V + due prese d'aria laterali basse
  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape(), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 });
  const shield = new THREE.Mesh(shieldGeo, dark);
  shield.rotation.y = Math.PI / 2;
  shield.position.set(2.37, 0.66, 0);
  car.add(shield);
  const frameGeo = new THREE.ExtrudeGeometry(shieldShape(), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.035, bevelSegments: 2 });
  const shieldFrame = new THREE.Mesh(frameGeo, chromeTrim);
  shieldFrame.rotation.y = Math.PI / 2;
  shieldFrame.position.set(2.355, 0.66, 0);
  car.add(shieldFrame);
  for (const z of [-0.52, 0.52]) {
    const intake = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.14, 0.5, 3, 0.04), dark);
    intake.position.set(2.34, 0.5, z);
    intake.rotation.x = z > 0 ? -0.12 : 0.12;
    car.add(intake);
  }

  // fari affilati che salgono verso i parafanghi
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf3ff, emissiveIntensity: 2.4 });
  for (const z of [-0.6, 0.6]) {
    const h = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.07, 0.48, 3, 0.03), headMat);
    h.position.set(2.29, 0.88, z);
    h.rotation.set(z > 0 ? 0.18 : -0.18, z > 0 ? -0.35 : 0.35, -0.35);
    car.add(h);
  }

  // fanali posteriori orizzontali, che avvolgono gli spigoli
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff1a2e, emissive: 0xff1a2e, emissiveIntensity: 2.6 });
  for (const z of [-0.62, 0.62]) {
    const tl = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.08, 0.5, 3, 0.03), tailMat);
    tl.position.set(-2.27, 1.0, z);
    tl.rotation.y = z > 0 ? 0.3 : -0.3;
    car.add(tl);
  }
  // diffusore con doppio scarico
  const diff = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.14, 1.4, 3, 0.04), dark);
  diff.position.set(-2.27, 0.46, 0);
  car.add(diff);
  for (const z of [-0.5, 0.5]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 20), chromeTrim);
    ex.rotation.z = Math.PI / 2;
    ex.position.set(-2.32, 0.42, z);
    car.add(ex);
  }

  // specchietti
  for (const z of [-1, 1]) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.1, 0.16, 3, 0.04), paint);
    m.position.set(0.72, 1.2, z * (HALF_W - 0.06));
    car.add(m);
  }

  // ruote
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.85, metalness: 0 });
  const rimMat = new THREE.MeshPhysicalMaterial({ color: 0xd9dde3, metalness: 1, roughness: 0.2, clearcoat: 0.6, envMapIntensity: 1.5, side: THREE.DoubleSide });
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide });
  const caliper = new THREE.MeshStandardMaterial({ color: 0xe11d2e, roughness: 0.4 });
  for (const x of [-AXLE_X, AXLE_X]) {
    for (const side of [-1, 1]) {
      const w = buildWheel(rubber, rimMat, caliper, holeMat);
      w.position.set(x, AXLE_Y, side * (HALF_W - 0.1));
      if (side < 0) w.rotation.y = Math.PI;
      car.add(w);
    }
  }

  // ombra di contatto
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.85)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 2.9),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  car.add(shadow);

  // centra l'auto sull'origine
  car.position.y = -0.8;
  return { car };
}

export function createScene(canvas, { reducedMotion = false, onProgress } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  const isSmall = () => window.innerWidth < 760;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall() ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(boothEnvironment(), 0.02).texture;

  const lightKey = new THREE.DirectionalLight(0xffffff, 2.0);
  lightKey.position.set(4, 6, 6);
  const lightRim = new THREE.PointLight(0xff2a3c, 30, 20);
  lightRim.position.set(-4, -1, 3);
  const lightBack = new THREE.PointLight(0x5c7cff, 14, 20);
  lightBack.position.set(3, 2, -4);
  scene.add(lightKey, lightRim, lightBack);

  const uniforms = { uTime: { value: 0 } };

  // Vernice da carrozzeria: base metallizzata + trasparente lucido
  const paint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#c8102e'),
    metalness: 0.55,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.25,
  });

  const { car } = buildCar(paint);

  // Pedana girevole da showroom
  const deck = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3347, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.012, 8, 200), ringMat);
  ring.rotation.x = Math.PI / 2;
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xdfe3ea, metalness: 1, roughness: 0.15, transparent: true, opacity: 1 });
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.008, 8, 200), chrome);
  ring2.rotation.x = Math.PI / 2;
  deck.add(ring, ring2);
  deck.position.y = -0.8;

  // Laser del banco di riscontro: anello che scorre lungo l'auto
  const laserMat = new THREE.MeshBasicMaterial({ color: 0xff3347, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const laser = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.012, 8, 160), laserMat);
  const laserGlow = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.06, 8, 160), laserMat.clone());
  for (const l of [laser, laserGlow]) { l.rotation.y = Math.PI / 2; l.scale.set(1, 0.8, 1); }

  // Particelle di vernice nebulizzata
  const COUNT = isSmall() ? 800 : 2000;
  const pos = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 3 + Math.random() * 3.5;
    const th = Math.random() * Math.PI * 2;
    pos[i * 3] = r * Math.cos(th);
    pos[i * 3 + 1] = (Math.random() - 0.4) * 3.2;
    pos[i * 3 + 2] = r * Math.sin(th);
    seeds[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: uniforms.uTime, uColor: { value: new THREE.Color('#ff4255') }, uPR: { value: renderer.getPixelRatio() }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSeed; uniform float uTime; uniform float uPR; varying float vA;
      void main(){
        vec3 p = position;
        float a = uTime*(0.04 + aSeed*0.06);
        float c = cos(a), s = sin(a);
        p.xz = mat2(c,-s,s,c)*p.xz;
        p.y += sin(uTime*0.6 + aSeed*20.0)*0.12;
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = (1.2 + aSeed*2.6) * uPR * (6.0 / -mv.z);
        vA = 0.3 + 0.6*fract(aSeed*7.0 + uTime*0.1);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; varying float vA;
      void main(){
        float d = length(gl_PointCoord-0.5);
        gl_FragColor = vec4(uColor, smoothstep(0.5,0.0,d)*vA*uOpacity);
      }`,
  });
  const points = new THREE.Points(pGeo, pMat);

  // turntable = auto + laser (ruotano insieme); rig = tutto, guidato dallo scroll
  const turntable = new THREE.Group();
  turntable.add(car, laser, laserGlow);
  const rig = new THREE.Group();
  rig.add(turntable, deck, points);
  rig.rotation.x = 0.22; // vista leggermente dall'alto
  scene.add(rig);

  const state = { x: 0, y: 0, scale: 1, rotY: 0, laser: 0, laserY: 0, ringsOpacity: 1, spin: 0 };
  const layout = () => {
    const small = isSmall();
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    return small
      ? { x: 0, y: 1.55, scale: Math.min(0.46, halfW / 3.7) }
      : { x: Math.max(1.6, halfW * 0.5), y: -0.5, scale: camera.aspect < 1.4 ? 0.58 : 0.72 };
  };
  Object.assign(state, layout());

  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);
  const onMove = (x, y) => pointerTarget.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); }, { passive: true });

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall() ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pMat.uniforms.uPR.value = renderer.getPixelRatio();
  };
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let running = true;
  let visible = true;
  let idleYaw = -0.55; // tre quarti anteriore

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!reducedMotion) {
      uniforms.uTime.value = t;
      idleYaw += dt * 0.18;
    }
    pointer.lerp(pointerTarget, 0.06);

    rig.position.x += (state.x - rig.position.x) * 0.08;
    rig.position.y += (state.y - rig.position.y) * 0.08;
    rig.scale.setScalar(rig.scale.x + (state.scale - rig.scale.x) * 0.08);
    rig.rotation.x = 0.22 - pointer.y * 0.08;

    // l'auto gira lenta sulla pedana; il mouse la orienta
    turntable.rotation.y = idleYaw + state.rotY + state.spin + pointer.x * 0.5;

    chrome.opacity = state.ringsOpacity;
    ringMat.opacity = 0.9 * state.ringsOpacity;

    // banco laser: scansione avanti e indietro lungo la vettura
    const lx = Math.sin(t * 1.4) * 2.2;
    laser.position.set(lx, 0, 0);
    laserGlow.position.set(lx, 0, 0);
    laserMat.opacity = state.laser;
    laserGlow.material.opacity = state.laser * 0.35;

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(() => { if (running && visible) frame(); });
  renderer.compile(scene, camera);
  onProgress && onProgress(1);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  const color = new THREE.Color();
  return {
    state,
    layout,
    uniforms,
    paint,
    particles: pMat,
    setVisible(v) { visible = v; },
    setPaint(hex, gsap) {
      color.set(hex);
      const isDark = color.getHSL({}).l < 0.12;
      gsap.to(paint.color, { r: color.r, g: color.g, b: color.b, duration: 1.1, ease: 'power3.out' });
      gsap.to(paint, { metalness: isDark ? 0.35 : 0.55, roughness: isDark ? 0.2 : 0.32, duration: 1 });
      const pc = color.clone().offsetHSL(0, 0, isDark ? 0.45 : 0.12);
      gsap.to(pMat.uniforms.uColor.value, { r: pc.r, g: pc.g, b: pc.b, duration: 1.1 });
      // piroetta sulla pedana per mostrare la nuova vernice
      if (!reducedMotion) gsap.to(state, { spin: `+=${Math.PI * 2}`, duration: 1.8, ease: 'power3.inOut' });
    },
  };
}
