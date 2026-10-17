import * as THREE from 'three';

// Simplex noise 3D (Ashima Arts / Stefan Gustavson, MIT)
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform vec3 uPointer;
float displace(vec3 p){
  float n = snoise(p*uFreq + vec3(0.0, uTime*0.35, uTime*0.2));
  n += 0.18*snoise(p*uFreq*2.3 - vec3(uTime*0.25));
  // "Bozza" che segue il puntatore: come una pressione del levabolli
  float d = distance(normalize(p), normalize(uPointer));
  n += 0.5*smoothstep(0.8, 0.0, d)*min(length(uPointer.xy), 1.0);
  return n*uAmp;
}
vec3 orthogonal(vec3 v){
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
}
`;

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
  const warm = strip(4, 4, 0.9, 0xff4a5a); warm.position.set(0, -6, 2); warm.rotation.x = -Math.PI / 2; env.add(warm);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0x0d0f12 }));
  floor.position.y = -6.5; floor.rotation.x = -Math.PI / 2; env.add(floor);
  return env;
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

  // Ambiente "officina" per i riflessi del clearcoat
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(boothEnvironment(), 0.02).texture;
  scene.environment = env;

  const lightKey = new THREE.DirectionalLight(0xffffff, 2.2);
  lightKey.position.set(4, 5, 6);
  const lightRim = new THREE.PointLight(0xff2a3c, 40, 20);
  lightRim.position.set(-4, -2, 2);
  const lightBack = new THREE.PointLight(0x5c7cff, 18, 20);
  lightBack.position.set(3, -3, -4);
  scene.add(lightKey, lightRim, lightBack);

  // ---------- Goccia di vernice ----------
  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.24 },
    uFreq: { value: 0.55 },
    uPointer: { value: new THREE.Vector3(0, 0, 0) },
  };

  const paint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#c8102e'),
    metalness: 0.6,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    iridescence: 0.12,
    iridescenceIOR: 1.3,
    envMapIntensity: 1.2,
  });
  paint.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${NOISE}`)
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
        vec3 pos0 = position;
        float eps = 0.01;
        vec3 t = orthogonal(normal);
        vec3 b = normalize(cross(normal, t));
        vec3 pA = pos0 + normal*displace(pos0);
        vec3 pB = pos0 + t*eps; pB += normal*displace(pB);
        vec3 pC = pos0 + b*eps; pC += normal*displace(pC);
        vec3 objectNormal = normalize(cross(pB - pA, pC - pA));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif
        `
      )
      .replace('#include <begin_vertex>', 'vec3 transformed = pA;');
  };

  const detail = isSmall() ? 48 : 96;
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, detail), paint);

  // ---------- Anelli cromati (come cerchioni / bersaglio laser) ----------
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xdfe3ea, metalness: 1, roughness: 0.12, clearcoat: 1, envMapIntensity: 1.4 });
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.022, 16, 200), chrome);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.012, 16, 200), chrome);
  ringA.rotation.set(1.2, 0.2, 0);
  ringB.rotation.set(1.45, -0.4, 0.3);

  // Anello laser (si accende nella sezione tecnologie)
  const laserMat = new THREE.MeshBasicMaterial({ color: 0xff3347, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const laser = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.012, 8, 220), laserMat);
  laser.rotation.x = Math.PI / 2;
  const laserGlow = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.07, 8, 220), laserMat.clone());
  laserGlow.rotation.x = Math.PI / 2;
  laserGlow.material.opacity = 0;

  // ---------- Particelle "nebulizzate" dalla pistola a spruzzo ----------
  const COUNT = isSmall() ? 900 : 2400;
  const pos = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 2.2 + Math.random() * 3.2;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
    pos[i * 3 + 2] = r * Math.cos(ph);
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
        float a = uTime*(0.05 + aSeed*0.08);
        float c = cos(a), s = sin(a);
        p.xz = mat2(c,-s,s,c)*p.xz;
        p.y += sin(uTime*0.6 + aSeed*20.0)*0.12;
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = (1.2 + aSeed*2.6) * uPR * (6.0 / -mv.z);
        vA = 0.35 + 0.65*fract(aSeed*7.0 + uTime*0.1);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; varying float vA;
      void main(){
        float d = length(gl_PointCoord-0.5);
        float a = smoothstep(0.5,0.0,d)*vA*uOpacity;
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const points = new THREE.Points(pGeo, pMat);

  const rig = new THREE.Group();
  rig.add(blob, ringA, ringB, laser, laserGlow, points);
  scene.add(rig);

  // Stato pilotato da GSAP/ScrollTrigger
  const state = {
    x: 0, y: 0, scale: 1, rotY: 0, laser: 0, laserY: 0, ringsOpacity: 1,
  };
  const layout = () => {
    // in hero la goccia sta a destra su desktop, in alto al centro su mobile
    const small = isSmall();
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    return small ? { x: 0, y: Math.min(1.95, 2.84 * 0.62), scale: 0.6 } : { x: Math.max(1.6, halfW * 0.52), y: -0.1, scale: camera.aspect < 1.4 ? 0.8 : 1 };
  };
  Object.assign(state, layout());

  // Puntatore
  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);
  const onMove = (x, y) => {
    pointerTarget.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  };
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

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!reducedMotion) uniforms.uTime.value = t;

    pointer.lerp(pointerTarget, 0.06);
    // il puntatore "preme" sulla goccia nel punto corrispondente
    uniforms.uPointer.value.set(pointer.x * 1.2, pointer.y * 1.2, 0.9).multiplyScalar(reducedMotion ? 0 : 1);

    rig.position.x += (state.x + pointer.x * 0.25 - rig.position.x) * 0.08;
    rig.position.y += (state.y + pointer.y * 0.2 - rig.position.y) * 0.08;
    const s = rig.scale.x + (state.scale - rig.scale.x) * 0.08;
    rig.scale.setScalar(s);

    blob.rotation.y += reducedMotion ? 0 : dt * 0.12;
    blob.rotation.x = pointer.y * 0.25;
    rig.rotation.y = state.rotY + pointer.x * 0.3;

    ringA.rotation.z += reducedMotion ? 0 : dt * 0.18;
    ringB.rotation.z -= reducedMotion ? 0 : dt * 0.12;
    chrome.opacity = state.ringsOpacity;
    chrome.transparent = state.ringsOpacity < 1;

    // scansione laser su e giù
    const ly = Math.sin(t * 1.6) * 1.4 * state.laser + state.laserY;
    laser.position.y = ly;
    laserGlow.position.y = ly;
    const rr = Math.sqrt(Math.max(0.05, 1.55 * 1.55 - ly * ly)) / 1.9 + 0.08;
    laser.scale.setScalar(rr);
    laserGlow.scale.setScalar(rr);
    laserMat.opacity = state.laser;
    laserGlow.material.opacity = state.laser * 0.35;

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(() => { if (running && visible) frame(); });

  // Prima compilazione dello shader (evita scatti al primo frame)
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
      const target = { r: color.r, g: color.g, b: color.b };
      gsap.to(paint.color, { ...target, duration: 1.1, ease: 'power3.out' });
      gsap.to(paint, { metalness: isDark ? 0.4 : 0.7, roughness: isDark ? 0.2 : 0.32, duration: 1 });
      const pc = color.clone().offsetHSL(0, 0, isDark ? 0.45 : 0.12);
      gsap.to(pMat.uniforms.uColor.value, { r: pc.r, g: pc.g, b: pc.b, duration: 1.1 });
      // un "colpo" di deformazione quando cambia vernice
      gsap.fromTo(uniforms.uAmp, { value: 0.5 }, { value: 0.24, duration: 1.6, ease: 'elastic.out(1, 0.35)' });
    },
  };
}
