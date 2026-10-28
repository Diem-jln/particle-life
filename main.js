/**
 * ============================================================================
 * CRYO-EM SYNTHETIC BIOME ORCHESTRATION MOTOR
 * TITAN KRIOS G4 & GRAND ARM 300cF ARCHITECTURE
 * 8 Clados Taxonómicos • Spatial Partitioning Hashing • Web Audio Síntesis
 * ============================================================================
 */

// --- 1. CONSTANTES & PARÁMETROS GLOBALES DEL BIOMA ---
const NUM_TYPES = 8;
// 12,000 especímenes distribuidos por estequiometría de membrana y citoesqueleto
const COUNTS = [2400, 1800, 1200, 1500, 1300, 1100, 1400, 1300];
const TOTAL_PARTICLES = COUNTS.reduce((sum, c) => sum + c, 0);

const WORLD_SIZE = 1600;
const HALF_SIZE = WORLD_SIZE * 0.5;

// Variables Dinámicas del Condensador
let VISCOSITY = 0.865;
let R_MAX_GLOBAL = 145;
let REPULSION_FACTOR = 3.4;
let DT = 0.45;
let GLOW_INTENSITY = 1.75;

// --- 2. PERFIL DE TAXONOMÍA (8 CLADOS BIOMOLECULARES) ---
const CLADE_CONFIG = [
  { name: "Fitomembrana Lipídica", rRep: 20, rMax: 120, mass: 1.4, color: new THREE.Color(0x00ff88) },
  { name: "Nucleoide / Ribosoma",  rRep: 26, rMax: 145, mass: 2.2, color: new THREE.Color(0x3b82f6) },
  { name: "Virión Lítico Alfa",     rRep: 12, rMax: 165, mass: 0.7, color: new THREE.Color(0xef4444) },
  { name: "Cilio Propulsor",        rRep: 16, rMax: 135, mass: 0.9, color: new THREE.Color(0xf59e0b) },
  { name: "Enzima Catalizadora",    rRep: 18, rMax: 140, mass: 1.1, color: new THREE.Color(0xeab308) },
  { name: "Biocristal Ancla",       rRep: 32, rMax: 110, mass: 3.5, color: new THREE.Color(0x06b6d4) },
  { name: "Matriz Biolum",          rRep: 14, rMax: 155, mass: 0.8, color: new THREE.Color(0xec4899) },
  { name: "Prion Disruptor",        rRep: 15, rMax: 150, mass: 1.0, color: new THREE.Color(0x8b5cf6) },
];

// Matriz de Interacción Molecular 8x8 [i][j]
let matrix = [];
for (let i = 0; i < NUM_TYPES; i++) {
  matrix[i] = new Float32Array(NUM_TYPES);
}

// --- 3. PRESETS BIOLÓGICOS / MORFOGENÉTICOS ---
function loadPreset(presetIndex) {
  // Limpiar a ceros
  for (let i = 0; i < NUM_TYPES; i++) {
    for (let j = 0; j < NUM_TYPES; j++) {
      matrix[i][j] = 0.0;
    }
  }

  switch (presetIndex) {
    case 0: // CÉLULAS COMPLETAS (Membranas estables que encierran núcleos)
      matrix[0][0] = 0.88;  matrix[0][1] = 0.40;  matrix[0][2] = -0.90; matrix[0][3] = 0.35;
      matrix[1][0] = -0.35; matrix[1][1] = -0.70; matrix[1][2] = -0.85; matrix[1][4] = 0.50;
      matrix[2][0] = 0.95;  matrix[2][1] = 0.80;  matrix[2][2] = -0.30; matrix[2][7] = 0.40;
      matrix[3][0] = 0.70;  matrix[3][3] = 0.65;  matrix[3][1] = 0.20;  matrix[3][2] = -0.60;
      matrix[4][0] = 0.30;  matrix[4][4] = -0.40; matrix[4][1] = 0.75;  matrix[4][6] = 0.60;
      matrix[5][5] = 0.90;  matrix[5][0] = 0.30;  matrix[5][1] = 0.20;  matrix[5][2] = -0.50;
      matrix[6][6] = 0.50;  matrix[6][0] = 0.40;  matrix[6][1] = 0.30;  matrix[6][7] = -0.80;
      matrix[7][0] = 0.60;  matrix[7][1] = 0.80;  matrix[7][2] = 0.50;  matrix[7][7] = 0.20;
      break;

    case 1: // ATAQUE VIRAL BACTERIÓFAGO
      matrix[2][0] = 1.00;  matrix[2][1] = 0.95;  matrix[2][2] = 0.40;  matrix[2][3] = -0.80;
      matrix[0][2] = -1.00; matrix[0][0] = 0.55;  matrix[1][2] = -1.00; matrix[1][1] = 0.30;
      matrix[3][2] = -0.70; matrix[3][0] = 0.80;  matrix[7][2] = 0.85;  matrix[7][0] = 0.90;
      break;

    case 2: // TEJIDO SINÁPTICO AXONAL
      matrix[6][6] = 0.85;  matrix[6][3] = 0.70;  matrix[3][6] = 0.70;  matrix[3][3] = 0.80;
      matrix[1][6] = 0.60;  matrix[6][1] = 0.40;  matrix[0][6] = 0.30;  matrix[5][6] = 0.90;
      break;

    case 3: // BIOCRÉCIMIENTO CRISTALINO
      matrix[5][5] = 0.98;  matrix[5][4] = 0.75;  matrix[4][5] = 0.60;  matrix[0][5] = 0.40;
      matrix[1][5] = -0.50; matrix[2][5] = -0.90; matrix[3][5] = 0.20;
      break;

    case 4: // PROPULSIÓN ZOOPLANCTON
      matrix[3][3] = 0.90;  matrix[3][0] = 0.80;  matrix[0][3] = 0.50;  matrix[0][0] = 0.75;
      matrix[1][0] = -0.30; matrix[3][1] = 0.40;  matrix[2][3] = 0.60;
      break;

    case 5: // CALDO PREBIÓTICO TÉRMICO
      for (let i = 0; i < NUM_TYPES; i++) {
        for (let j = 0; j < NUM_TYPES; j++) {
          matrix[i][j] = (Math.random() * 1.8 - 0.9);
        }
      }
      break;
  }
  updateMatrixDOM();
  announceHUD("Preset cargado: " + ["Células Completas", "Ataque Bacteriófago", "Tejido Sináptico", "Cristalización", "Zooplancton", "Caldo Prebiótico"][presetIndex]);
}

// --- 4. MOTOR DE AUDIO REACTIVO (Web Audio API) ---
class BiomeAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.filter = null;
    this.masterGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // 1. Osciladores Ambientales Sub-Graves (Hielo Líquido)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.filter = this.ctx.createBiquadFilter();
    this.masterGain = this.ctx.createGain();

    this.droneOsc1.type = 'sawtooth';
    this.droneOsc2.type = 'sine';

    this.droneOsc1.frequency.setValueAtTime(46.25, this.ctx.currentTime); // Fa#1
    this.droneOsc2.frequency.setValueAtTime(92.50, this.ctx.currentTime); // Fa#2

    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(180, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(4.5, this.ctx.currentTime);

    this.masterGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    this.droneOsc1.connect(this.filter);
    this.droneOsc2.connect(this.filter);
    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.droneOsc1.start();
    this.droneOsc2.start();
    this.isMuted = false;
  }

  toggle() {
    if (!this.ctx) {
      this.init();
      return true;
    }
    if (this.isMuted) {
      this.masterGain.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.05);
      this.isMuted = false;
      return true;
    } else {
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
      this.isMuted = true;
      return false;
    }
  }

  playTrigger(freq, duration = 0.25, type = 'triangle') {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(0.07, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  updateSwarmTelemetry(energyNorm) {
    if (!this.ctx || this.isMuted) return;
    const cutoff = 150 + Math.min(energyNorm * 35, 1200);
    this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.1);
  }
}

const audio = new BiomeAudioEngine();

// --- 5. ESTRUCTURA DE ESPECÍMENES EN MEMORIA ---
const posX = new Float32Array(TOTAL_PARTICLES);
const posY = new Float32Array(TOTAL_PARTICLES);
const posZ = new Float32Array(TOTAL_PARTICLES);
const velX = new Float32Array(TOTAL_PARTICLES);
const velY = new Float32Array(TOTAL_PARTICLES);
const types = new Uint8Array(TOTAL_PARTICLES);

function initializeSpecimenDistribution() {
  let idx = 0;
  for (let t = 0; t < NUM_TYPES; t++) {
    for (let c = 0; c < COUNTS[t]; c++) {
      const radius = Math.sqrt(Math.random()) * (HALF_SIZE * 0.88);
      const angle = Math.random() * Math.PI * 2;
      posX[idx] = Math.cos(angle) * radius;
      posY[idx] = Math.sin(angle) * radius;
      posZ[idx] = (Math.random() - 0.5) * 60; // Delgada capa vítrea
      velX[idx] = 0;
      velY[idx] = 0;
      types[idx] = t;
      idx++;
    }
  }
}
initializeSpecimenDistribution();

// --- 6. RENDERIZADOR THREE.JS & SHADER DE CONTRASTE DE FASE CRYO-EM ---
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03060a, 0.0004);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 1, 4500);
camera.position.z = 980;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x03060a, 1.0);
container.appendChild(renderer.domElement);

// Textura de Contraste de Fase con Aberración de Scherzer
function createCryoEMTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const center = size / 2;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center);

  // Perfil Cryo: Núcleo denso -> Anillo de difracción oscuro -> Halo de fase
  grad.addColorStop(0.00, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.18, "rgba(255, 255, 255, 0.85)");
  grad.addColorStop(0.38, "rgba(100, 220, 255, 0.40)");
  grad.addColorStop(0.60, "rgba(2, 8, 18, 0.90)"); // Anillo de absorción de contraste
  grad.addColorStop(0.82, "rgba(78, 242, 210, 0.35)"); // Halo de fase de Fresnel
  grad.addColorStop(1.00, "rgba(0, 0, 0, 0.0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const geometry = new THREE.BufferGeometry();
const bufferPositions = new Float32Array(TOTAL_PARTICLES * 3);
const bufferColors = new Float32Array(TOTAL_PARTICLES * 3);

function updateGeometryColors() {
  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    const cl = CLADE_CONFIG[types[i]].color;
    bufferColors[i * 3 + 0] = cl.r;
    bufferColors[i * 3 + 1] = cl.g;
    bufferColors[i * 3 + 2] = cl.b;
  }
}
updateGeometryColors();

for (let i = 0; i < TOTAL_PARTICLES; i++) {
  bufferPositions[i * 3 + 0] = posX[i];
  bufferPositions[i * 3 + 1] = posY[i];
  bufferPositions[i * 3 + 2] = posZ[i];
}

geometry.setAttribute("position", new THREE.BufferAttribute(bufferPositions, 3));
geometry.setAttribute("color", new THREE.BufferAttribute(bufferColors, 3));

const particleMaterial = new THREE.PointsMaterial({
  size: 22,
  map: createCryoEMTexture(),
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 0.94
});

const particleCloud = new THREE.Points(geometry, particleMaterial);
scene.add(particleCloud);

// --- 7. SPATIAL PARTITIONING GRID (O(N) GPU-LIKE HASHING) ---
let CELL_SIZE = R_MAX_GLOBAL;
let GRID_DIM = Math.ceil(WORLD_SIZE / CELL_SIZE);
let head = new Int32Array(GRID_DIM * GRID_DIM);
let next = new Int32Array(TOTAL_PARTICLES);

function rebuildSpatialGridStructure() {
  CELL_SIZE = R_MAX_GLOBAL;
  GRID_DIM = Math.ceil(WORLD_SIZE / CELL_SIZE);
  head = new Int32Array(GRID_DIM * GRID_DIM);
}

function getGridCellIndex(x, y) {
  let gx = Math.floor((x + HALF_SIZE) / CELL_SIZE);
  let gy = Math.floor((y + HALF_SIZE) / CELL_SIZE);
  if (gx < 0) gx = 0; else if (gx >= GRID_DIM) gx = GRID_DIM - 1;
  if (gy < 0) gy = 0; else if (gy >= GRID_DIM) gy = GRID_DIM - 1;
  return gy * GRID_DIM + gx;
}

// --- 8. SONDA DE HAZ DE ELECTRONES (INTERACCIÓN DEL PUNTERO) ---
let activeProbeMode = "tweezer";
const probe = { x: 99999, y: 99999, isEngaged: false };

window.addEventListener("pointerdown", () => {
  probe.isEngaged = true;
  audio.init();
});

window.addEventListener("pointerup", () => {
  probe.isEngaged = false;
});

window.addEventListener("pointermove", (event) => {
  const normX = (event.clientX / window.innerWidth) * 2 - 1;
  const normY = -(event.clientY / window.innerHeight) * 2 + 1;

  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(normX, normY), camera);

  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const intersectTarget = new THREE.Vector3();
  ray.ray.intersectPlane(plane, intersectTarget);

  if (intersectTarget) {
    probe.x = intersectTarget.x;
    probe.y = intersectTarget.y;
  }
});

// --- 9. FÍSICA ASIMÉTRICA & SIMULACIÓN EN TIEMPO REAL ---
let totalKineticEnergySum = 0;

function stepSimulation() {
  // 1. Limpieza de grilla
  head.fill(-1);
  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    const c = getGridCellIndex(posX[i], posY[i]);
    next[i] = head[c];
    head[c] = i;
  }

  totalKineticEnergySum = 0;
  let colorsNeedUpdate = false;
  const posArr = geometry.attributes.position.array;

  // 2. Evaluación de Fuerzas
  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    const px = posX[i];
    const py = posY[i];
    const typeI = types[i];
    const cfgI = CLADE_CONFIG[typeI];
    const rMaxI = cfgI.rMax;
    const rRepI = cfgI.rRep;
    const massI = cfgI.mass;

    let fx = 0.0;
    let fy = 0.0;

    const gx = Math.floor((px + HALF_SIZE) / CELL_SIZE);
    const gy = Math.floor((py + HALF_SIZE) / CELL_SIZE);

    // Vecindad 3x3
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const cx = (gx + ox + GRID_DIM) % GRID_DIM;
        const cy = (gy + oy + GRID_DIM) % GRID_DIM;
        let j = head[cy * GRID_DIM + cx];

        while (j !== -1) {
          if (i !== j) {
            let dx = posX[j] - px;
            let dy = posY[j] - py;

            // Envoltura toroidal
            if (dx > HALF_SIZE) dx -= WORLD_SIZE;
            if (dx < -HALF_SIZE) dx += WORLD_SIZE;
            if (dy > HALF_SIZE) dy -= WORLD_SIZE;
            if (dy < -HALF_SIZE) dy += WORLD_SIZE;

            const distSq = dx * dx + dy * dy;

            if (distSq > 0.001 && distSq < rMaxI * rMaxI) {
              const dist = Math.sqrt(distSq);
              const typeJ = types[j];
              const sharedRep = (rRepI + CLADE_CONFIG[typeJ].rRep) * 0.5;

              let force = 0.0;
              if (dist < sharedRep) {
                // Núcleo duro incompresible
                force = (dist / sharedRep - 1.0) * REPULSION_FACTOR;
              } else {
                // Fuerza de afinidad asimétrica
                const attr = matrix[typeI][typeJ];
                const mid = (sharedRep + rMaxI) * 0.5;
                const halfW = (rMaxI - sharedRep) * 0.5;
                force = attr * (1.0 - Math.abs(dist - mid) / halfW);

                // Dinámica de torsión en filamentos y cilios
                if (typeI === 3) {
                  fx += (-dy / dist) * 0.35;
                  fy += (dx / dist) * 0.35;
                }
              }

              fx += (dx / dist) * force;
              fy += (dy / dist) * force;
            }
          }
          j = next[j];
        }
      }
    }

    // Interacción de Sonda del Haz de Electrones
    if (probe.isEngaged) {
      let mx = px - probe.x;
      let my = py - probe.y;
      let mDistSq = mx * mx + my * my;

      if (mDistSq < 300 * 300 && mDistSq > 1) {
        let mDist = Math.sqrt(mDistSq);
        let ndx = mx / mDist;
        let ndy = my / mDist;

        if (activeProbeMode === "tweezer") {
          // Pinza óptica: atrae al centro
          let pull = (1.0 - mDist / 300) * 22.0;
          fx -= ndx * pull;
          fy -= ndy * pull;
        } else if (activeProbeMode === "vortex") {
          // Vórtice angular
          let pull = (1.0 - mDist / 300) * 18.0;
          fx -= ndx * pull;
          fy -= ndy * pull;
          fx += -ndy * pull * 1.5;
          fy += ndx * pull * 1.5;
        } else if (activeProbeMode === "lysis") {
          // Dispersión lítica
          let push = (1.0 - mDist / 300) * 45.0;
          fx += ndx * push;
          fy += ndy * push;
        } else if (activeProbeMode === "inoculate") {
          // Transmutación en caliente de espécimen a nucleoide (Clado 1)
          if (mDist < 60 && typeI !== 1) {
            types[i] = 1;
            const c = CLADE_CONFIG[1].color;
            bufferColors[i * 3 + 0] = c.r;
            bufferColors[i * 3 + 1] = c.g;
            bufferColors[i * 3 + 2] = c.b;
            colorsNeedUpdate = true;
          }
        }
      }
    }

    // Integración Newton-Verlet con Inercia
    velX[i] = (velX[i] + (fx / massI) * DT) * VISCOSITY;
    velY[i] = (velY[i] + (fy / massI) * DT) * VISCOSITY;

    let nx = px + velX[i] * DT;
    let ny = py + velY[i] * DT;

    // Wrap-around toroidal
    if (nx > HALF_SIZE) nx -= WORLD_SIZE;
    if (nx < -HALF_SIZE) nx += WORLD_SIZE;
    if (ny > HALF_SIZE) ny -= WORLD_SIZE;
    if (ny < -HALF_SIZE) ny += WORLD_SIZE;

    posX[i] = nx;
    posY[i] = ny;

    // Fluctuación Browniana en Z
    posZ[i] = Math.sin(i * 0.1 + performance.now() * 0.002) * 18;

    posArr[i * 3 + 0] = nx;
    posArr[i * 3 + 1] = ny;
    posArr[i * 3 + 2] = posZ[i];

    totalKineticEnergySum += (velX[i] * velX[i] + velY[i] * velY[i]);
  }

  geometry.attributes.position.needsUpdate = true;
  if (colorsNeedUpdate) {
    geometry.attributes.color.needsUpdate = true;
  }

  // Audio Telemetría
  const meanEnergy = totalKineticEnergySum / TOTAL_PARTICLES;
  audio.updateSwarmTelemetry(meanEnergy);
}

// --- 10. GENERADOR DE MATRIZ DE AFINIDADES DOM 8x8 ---
const matrixGridDOM = document.getElementById("affinity-matrix-grid");

function buildMatrixDOM() {
  matrixGridDOM.innerHTML = "";
  for (let i = 0; i < NUM_TYPES; i++) {
    for (let j = 0; j < NUM_TYPES; j++) {
      const cell = document.createElement("div");
      cell.className = "matrix-cell";
      cell.dataset.i = i;
      cell.dataset.j = j;
      cell.title = `${CLADE_CONFIG[i].name} → ${CLADE_CONFIG[j].name}`;

      cell.onclick = () => {
        // Ciclar valor: atracción -> repulsión -> neutro
        let val = matrix[i][j];
        if (val >= 0.5) val = -0.8;
        else if (val <= -0.5) val = 0.0;
        else val = 0.8;
        matrix[i][j] = val;
        updateMatrixDOM();
        audio.playTrigger(320 + i * 40, 0.15);
      };

      matrixGridDOM.appendChild(cell);
    }
  }
  updateMatrixDOM();
}

function updateMatrixDOM() {
  const cells = matrixGridDOM.querySelectorAll(".matrix-cell");
  cells.forEach(cell => {
    const i = parseInt(cell.dataset.i);
    const j = parseInt(cell.dataset.j);
    const val = matrix[i][j];

    cell.innerText = val.toFixed(1);

    if (val > 0.05) {
      const intensity = Math.min(val, 1.0);
      cell.style.background = `rgba(0, 255, 136, ${0.15 + intensity * 0.45})`;
      cell.style.color = "#00ff88";
    } else if (val < -0.05) {
      const intensity = Math.min(Math.abs(val), 1.0);
      cell.style.background = `rgba(239, 68, 68, ${0.15 + intensity * 0.45})`;
      cell.style.color = "#ef4444";
    } else {
      cell.style.background = "#0c1524";
      cell.style.color = "#475569";
    }
  });
}

// --- 11. MONITOR FFT DE DIFRACCIÓN TEM EN VIVO ---
const stemCanvas = document.getElementById("stem-fft-canvas");
const stemCtx = stemCanvas.getContext("2d");

function renderSTEMDiffractionMonitor() {
  stemCtx.fillStyle = "#020408";
  stemCtx.fillRect(0, 0, stemCanvas.width, stemCanvas.height);

  const cx = stemCanvas.width / 2;
  const cy = stemCanvas.height / 2;

  // Anillos de Bragg
  stemCtx.strokeStyle = "rgba(78, 242, 210, 0.25)";
  stemCtx.lineWidth = 1;
  stemCtx.beginPath();
  stemCtx.arc(cx, cy, 14, 0, Math.PI * 2);
  stemCtx.arc(cx, cy, 28, 0, Math.PI * 2);
  stemCtx.stroke();

  // Spot central de electrones no desviados
  stemCtx.fillStyle = "#ffffff";
  stemCtx.beginPath();
  stemCtx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  stemCtx.fill();

  // Puntos de difracción muestreados de la velocidad
  stemCtx.fillStyle = "rgba(78, 242, 210, 0.75)";
  const sampleStep = 80;
  for (let i = 0; i < TOTAL_PARTICLES; i += sampleStep) {
    const spotX = cx + velX[i] * 6;
    const spotY = cy + velY[i] * 6;
    stemCtx.fillRect(spotX, spotY, 1.5, 1.5);
  }
}

// --- 12. CONTROLADORES HUD, EVENTOS Y SLIDERS ---
document.getElementById("btn-audio-toggle").onclick = (e) => {
  const isNowActive = audio.toggle();
  const btn = e.currentTarget;
  if (isNowActive) {
    btn.classList.add("active");
    btn.querySelector(".btn-text").innerText = "SONAR RES: ON";
  } else {
    btn.classList.remove("active");
    btn.querySelector(".btn-text").innerText = "SONAR RES: OFF";
  }
};

// Modos de Sonda
document.querySelectorAll(".btn-probe").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".btn-probe").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeProbeMode = btn.dataset.probe;
    audio.playTrigger(440, 0.1);
  };
});

// Presets
document.querySelectorAll(".preset-grid .btn-ctrl").forEach((btn, idx) => {
  btn.onclick = () => {
    document.querySelectorAll(".preset-grid .btn-ctrl").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadPreset(idx);
    audio.playTrigger(550, 0.25);
  };
});

// Deslizadores
const rngViscosity = document.getElementById("rng-viscosity");
rngViscosity.oninput = (e) => {
  VISCOSITY = parseFloat(e.target.value);
  document.getElementById("out-viscosity").innerText = VISCOSITY.toFixed(3);
};

const rngRmax = document.getElementById("rng-rmax");
rngRmax.oninput = (e) => {
  R_MAX_GLOBAL = parseFloat(e.target.value);
  document.getElementById("out-rmax").innerText = R_MAX_GLOBAL + " nm";
  rebuildSpatialGridStructure();
};

const rngRepulsion = document.getElementById("rng-repulsion");
rngRepulsion.oninput = (e) => {
  REPULSION_FACTOR = parseFloat(e.target.value);
  document.getElementById("out-repulsion").innerText = REPULSION_FACTOR.toFixed(2) + "×";
};

const rngDt = document.getElementById("rng-dt");
rngDt.oninput = (e) => {
  DT = parseFloat(e.target.value);
  document.getElementById("out-dt").innerText = DT.toFixed(2) + " fs";
};

const rngGlow = document.getElementById("rng-glow");
rngGlow.oninput = (e) => {
  GLOW_INTENSITY = parseFloat(e.target.value);
  document.getElementById("out-glow").innerText = GLOW_INTENSITY.toFixed(2);
  particleMaterial.size = 14 * GLOW_INTENSITY;
};

// Acciones Genéticas
document.getElementById("btn-mutate-mild").onclick = () => {
  for (let i = 0; i < NUM_TYPES; i++) {
    for (let j = 0; j < NUM_TYPES; j++) {
      matrix[i][j] += (Math.random() * 2 - 1) * 0.22;
      matrix[i][j] = Math.max(-1.0, Math.min(1.0, matrix[i][j]));
    }
  }
  updateMatrixDOM();
  announceHUD("Deriva Genética (+15%) introducida en el genoma.");
  audio.playTrigger(600, 0.3);
};

document.getElementById("btn-mutate-hard").onclick = () => {
  for (let i = 0; i < NUM_TYPES; i++) {
    for (let j = 0; j < NUM_TYPES; j++) {
      matrix[i][j] = (Math.random() * 2.0 - 1.0);
    }
  }
  updateMatrixDOM();
  announceHUD("SALTO EVOLUTIVO RADICAL: Todas las afinidades barajadas.");
  audio.playTrigger(750, 0.45, 'sawtooth');
};

document.getElementById("btn-thermal-shock").onclick = () => {
  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    velX[i] += (Math.random() - 0.5) * 45;
    velY[i] += (Math.random() - 0.5) * 45;
  }
  announceHUD("Choque Térmico: Dispersión cinética inducida.");
  audio.playTrigger(220, 0.5, 'square');
};

document.getElementById("btn-freeze-reboot").onclick = () => {
  initializeSpecimenDistribution();
  updateGeometryColors();
  geometry.attributes.color.needsUpdate = true;
  announceHUD("Vitrificación Criogénica: Espacio reiniciado a 77.4 K.");
  audio.playTrigger(880, 0.35);
};

// Notificador HUD
let annTimeout = null;
function announceHUD(msg) {
  const box = document.getElementById("hud-announcer");
  const text = document.getElementById("ann-message");
  text.innerText = msg;
  box.classList.remove("announcer-hidden");

  clearTimeout(annTimeout);
  annTimeout = setTimeout(() => {
    box.classList.add("announcer-hidden");
  }, 3500);
}

// --- 13. BUCLE PRINCIPAL DE ANIMACIÓN Y TELEMETRÍA FPS ---
let lastTime = performance.now();
let frames = 0;
const fpsBadge = document.getElementById("fps-badge");

function engineLoop() {
  requestAnimationFrame(engineLoop);

  frames++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    fpsBadge.innerText = `FPS: ${frames}`;
    frames = 0;
    lastTime = now;

    // Actualizar Vitals
    const meanEnergy = (totalKineticEnergySum / TOTAL_PARTICLES).toFixed(1);
    document.getElementById("vital-energy").innerText = `${meanEnergy} pJ`;
  }

  stepSimulation();
  renderSTEMDiffractionMonitor();
  renderer.render(scene, camera);
}

// Redimensionamiento
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Inicialización final
buildMatrixDOM();
loadPreset(0);
engineLoop();