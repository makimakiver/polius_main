import * as THREE from "three";

// A self-contained decorative scene: a slowly rotating glowing icosahedron with
// an additive halo and an upward-drifting particle field, lit golden-hour style,
// under an auto-orbiting camera the user can drag to look around. Trimmed from
// pollius_oss/src/world3d.ts with no simulation dependency.

const SKY_TOP = 0x7fa8c9;
const SKY_HORIZON = 0xe7d2a8;
const ORB_COLOR = 0xf2b53d;

const GLOW_TEXTURE = makeGlowTexture();

export class PolliusScene {
  private readonly host: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private frameId = 0;

  private readonly disposables: Array<{ dispose: () => void }> = [];
  private readonly motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.15 : 1;

  private orb!: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshStandardMaterial>;
  private halo!: THREE.Sprite;
  private particles!: ParticleField;

  // Camera rig
  private orbitAngle = 0.7;
  private targetOrbitAngle = 0.7;
  private elevation = 0.55;
  private targetElevation = 0.55;
  private readonly cameraRadius = 9;
  private readonly lookTarget = new THREE.Vector3(0, 0.2, 0);
  private readonly pointerAbort = new AbortController();
  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  constructor(host: HTMLElement) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.host.replaceChildren(this.renderer.domElement);
    this.bindPointerControls();

    this.scene.background = this.track(makeSkyTexture());

    this.buildLighting();
    this.buildOrb();
    this.particles = new ParticleField(this.scene, this.disposables);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host);
    this.resize();
  }

  start() {
    const animate = () => {
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const t = this.clock.elapsedTime;

      this.orb.rotation.y += dt * 0.4 * this.motion;
      this.orb.rotation.x += dt * 0.12 * this.motion;
      this.orb.position.y = 0.2 + Math.sin(t * 0.8) * 0.12 * this.motion;
      this.halo.position.copy(this.orb.position);
      this.orb.material.emissiveIntensity = 0.5 + Math.sin(t * 1.6) * 0.12;

      this.particles.update(dt, this.motion);

      if (!this.dragging) this.targetOrbitAngle += dt * 0.05 * this.motion;
      this.orbitAngle = THREE.MathUtils.damp(this.orbitAngle, this.targetOrbitAngle, 8, dt);
      this.elevation = THREE.MathUtils.damp(this.elevation, this.targetElevation, 8, dt);
      const elevation = this.elevation + Math.sin(t * 0.2) * 0.015 * this.motion;
      this.camera.position.set(
        Math.sin(this.orbitAngle) * this.cameraRadius * Math.cos(elevation),
        Math.sin(elevation) * this.cameraRadius + 1.2,
        Math.cos(this.orbitAngle) * this.cameraRadius * Math.cos(elevation)
      );
      this.camera.lookAt(this.lookTarget);

      this.renderer.render(this.scene, this.camera);
      this.frameId = window.requestAnimationFrame(animate);
    };
    this.frameId = window.requestAnimationFrame(animate);
  }

  destroy() {
    window.cancelAnimationFrame(this.frameId);
    this.pointerAbort.abort();
    this.resizeObserver.disconnect();
    for (const item of this.disposables) item.dispose();
    this.renderer.dispose();
    this.host.replaceChildren();
  }

  private buildLighting() {
    const hemi = new THREE.HemisphereLight(0xbcd6f0, 0x5a6b3c, 0.9);
    const sun = new THREE.DirectionalLight(0xffe6b0, 2.2);
    sun.position.set(6, 8, 4);
    const fill = new THREE.DirectionalLight(0x9fb6d6, 0.5);
    fill.position.set(-5, 3, -4);
    this.scene.add(hemi, sun, fill);
  }

  private buildOrb() {
    const geo = this.track(new THREE.IcosahedronGeometry(1.6, 2));
    const mat = this.track(
      new THREE.MeshStandardMaterial({
        color: ORB_COLOR,
        emissive: ORB_COLOR,
        emissiveIntensity: 0.5,
        roughness: 0.25,
        metalness: 0.35,
        flatShading: true
      })
    );
    this.orb = new THREE.Mesh(geo, mat);
    this.scene.add(this.orb);

    this.halo = makeGlowSprite(ORB_COLOR, 6, this.disposables);
    this.scene.add(this.halo);
  }

  private bindPointerControls() {
    const canvas = this.renderer.domElement;
    const signal = this.pointerAbort.signal;
    canvas.addEventListener(
      "pointerdown",
      (event) => {
        this.dragging = true;
        this.lastPointerX = event.clientX;
        this.lastPointerY = event.clientY;
        this.host.classList.add("is-dragging");
        canvas.setPointerCapture(event.pointerId);
      },
      { signal }
    );
    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (!this.dragging) return;
        const dx = event.clientX - this.lastPointerX;
        const dy = event.clientY - this.lastPointerY;
        this.lastPointerX = event.clientX;
        this.lastPointerY = event.clientY;
        this.targetOrbitAngle -= dx * 0.008;
        this.targetElevation = THREE.MathUtils.clamp(this.targetElevation + dy * 0.004, 0.2, 1.1);
      },
      { signal }
    );
    const release = (event: PointerEvent) => {
      this.dragging = false;
      this.host.classList.remove("is-dragging");
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    canvas.addEventListener("pointerup", release, { signal });
    canvas.addEventListener("pointercancel", release, { signal });
  }

  private track<T extends { dispose: () => void }>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  private resize() {
    const width = this.host.clientWidth || 900;
    const height = this.host.clientHeight || 560;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

// ── Particle field ──────────────────────────────────────────────────────────
class ParticleField {
  private readonly points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private readonly velocities: Float32Array;
  private readonly count = 220;

  constructor(scene: THREE.Scene, disposables: Array<{ dispose: () => void }>) {
    const positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count);
    for (let i = 0; i < this.count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 9 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      this.velocities[i] = 0.2 + Math.random() * 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: GLOW_TEXTURE,
      color: new THREE.Color(0xfff0c4),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    this.points = new THREE.Points(geo, mat);
    scene.add(this.points);
    disposables.push(geo, mat);
  }

  update(dt: number, motion: number) {
    const positions = this.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = positions.array as Float32Array;
    for (let i = 0; i < this.count; i += 1) {
      array[i * 3 + 1] += this.velocities[i] * 0.8 * motion * dt;
      if (array[i * 3 + 1] > 7.5) {
        array[i * 3 + 1] = -2;
        array[i * 3] = (Math.random() - 0.5) * 16;
        array[i * 3 + 2] = (Math.random() - 0.5) * 12;
      }
    }
    positions.needsUpdate = true;
  }
}

// ── Texture / sprite helpers ──────────────────────────────────────────────────
function makeGlowSprite(
  color: number,
  scale: number,
  disposables: Array<{ dispose: () => void }>
): THREE.Sprite {
  const material = new THREE.SpriteMaterial({
    map: GLOW_TEXTURE,
    color,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  disposables.push(material);
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(scale);
  return sprite;
}

function makeGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.65)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, hexString(SKY_TOP));
    gradient.addColorStop(0.6, "#b9c6c0");
    gradient.addColorStop(1, hexString(SKY_HORIZON));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 256);

    const glow = ctx.createRadialGradient(16, 232, 0, 16, 232, 120);
    glow.addColorStop(0, "rgba(255,238,196,0.85)");
    glow.addColorStop(1, "rgba(255,238,196,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 32, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hexString(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}
