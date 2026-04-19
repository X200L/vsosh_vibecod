const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const gameRoot = document.getElementById("gameRoot");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const WORLD_W = 28;
const WORLD_H = 12;
const WORLD_D = 28;
const WORLD_STORAGE_KEY = "minicraft_world";
const SAVE_VERSION = 4;

const BLOCK_AIR = 0;
const BLOCK_GRASS = 1;
const BLOCK_DIRT = 2;
const BLOCK_STONE = 3;
const BLOCK_WOOD = 4;
const BLOCK_LEAVES = 5;
const BLOCK_SAND = 6;
const BLOCK_EYE = 7;
const BLOCK_PARASITE = 8;
const BLOCK_CORE = 9;
const BLOCK_FLESH = 10;

const BLOCK_NAMES = {
  [BLOCK_GRASS]: "grass",
  [BLOCK_DIRT]: "dirt",
  [BLOCK_STONE]: "stone",
  [BLOCK_WOOD]: "wood",
  [BLOCK_LEAVES]: "leaves",
  [BLOCK_SAND]: "sand",
  [BLOCK_EYE]: "eye",
  [BLOCK_PARASITE]: "parasite",
  [BLOCK_CORE]: "core",
  [BLOCK_FLESH]: "flesh"
};

const BLOCK_COLORS = {
  [BLOCK_GRASS]: {
    top: "#61c449",
    left: "#3f8f36",
    right: "#2f742b"
  },
  [BLOCK_DIRT]: {
    top: "#9a6a3a",
    left: "#76502f",
    right: "#5f3f27"
  },
  [BLOCK_STONE]: {
    top: "#9ea4a8",
    left: "#767d82",
    right: "#61686e"
  },
  [BLOCK_WOOD]: {
    top: "#b98547",
    left: "#7b4f2b",
    right: "#643d22"
  },
  [BLOCK_LEAVES]: {
    top: "#4fbf5c",
    left: "#33873d",
    right: "#286f33"
  },
  [BLOCK_SAND]: {
    top: "#e5d37d",
    left: "#c6ad5c",
    right: "#ad9650"
  },
  [BLOCK_EYE]: {
    top: "#ffe6ef",
    left: "#9b1834",
    right: "#580a28"
  },
  [BLOCK_PARASITE]: {
    top: "#53ff8f",
    left: "#18833f",
    right: "#09602f"
  },
  [BLOCK_CORE]: {
    top: "#72f7ff",
    left: "#225bff",
    right: "#10106e"
  },
  [BLOCK_FLESH]: {
    top: "#ff8a91",
    left: "#b73f4e",
    right: "#7c2436"
  }
};

let world = [];
const player = { x: WORLD_W / 2, y: WORLD_H - 2, z: WORLD_D / 2, speed: 0.12 };
const keys = {};
const hotbarBlocks = [BLOCK_GRASS, BLOCK_DIRT, BLOCK_STONE, BLOCK_WOOD, BLOCK_LEAVES, BLOCK_SAND];
const coordsEl = document.getElementById("coords");
const hotbarEl = document.getElementById("hotbar");
const selectedBlockEl = document.getElementById("selectedBlock");
const memeMessageEl = document.getElementById("memeMessage");
const debugOverlayEl = document.getElementById("debugOverlay");
const chaosFillEl = document.getElementById("chaosFill");
const chaosValueEl = document.getElementById("chaosValue");
const collapseFillEl = document.getElementById("collapseFill");
const collapseValueEl = document.getElementById("collapseValue");
const parasitePressureEl = document.getElementById("parasitePressure");
const objectivePanelEl = document.getElementById("objectivePanel");
const worldMessageEl = document.getElementById("worldMessage");
const endScreenEl = document.getElementById("endScreen");
const endTitleEl = document.getElementById("endTitle");
const endSubtitleEl = document.getElementById("endSubtitle");
const introOverlayEl = document.getElementById("introOverlay");
const tutorialOverlayEl = document.getElementById("tutorialOverlay");
let selectedBlockIndex = 0;
let hoveredBlock = null;
let memeMessageTimer = null;
let debugOverlayEnabled = false;
let frameCount = 0;
let fps = 0;
let fpsLastTime = performance.now();
let worldAnger = 0;
const maxWorldAnger = 100;
let worldPhase = 0;
let collectedCores = 0;
const totalCores = 3;
let gameWon = false;
let gameLost = false;
let worldCollapse = 0;
const maxWorldCollapse = 100;
let parasiteCount = 0;
let fleshCount = 0;
let parasitePressure = 0;
const maxParasiteCountBeforeLoss = 45;
let gameTimer = 0;
let highAngerTimer = 0;
let parasiteScanTimer = 0;
let coreHintTimer = 420;
let parasiteReliefTimer = 0;
let maxAngerTimer = 0;
const maxAngerThresholdFrames = 3600;
let finalMadnessUnlocked = false;
let finalMadnessActive = false;
let introTimerMs = 0;
const introDurationMs = 5000;
let introVisible = false;

let tutorialTimerMs = 0;
const tutorialDurationMs = 5000;
let lastLoopTime = performance.now();
const nukeState = {
  active: false,
  phase: "idle",
  timer: 0,
  targetX: 0,
  targetY: 0,
  targetZ: 0,
  radius: 0,
  pulse: 0
};
const activeEffects = {
  screenShakeTimer: 0,
  screenShakePower: 0,
  driftTimer: 0,
  driftDuration: 0,
  invertTimer: 0,
  upsideDownTimer: 0,
  liarHotbarTimer: 0,
  blinkTimer: 0,
  coughTimer: 0,
  debugCorruptionTimer: 0,
  phaseEventCooldown: 120,
  parasiteCooldown: 60,
  eyeCooldown: 90
};
let messageText = "";
let messageTimer = 0;
let objectiveText = "Collect anomaly cores";
const worldPhrases = [
  "The grass whispers: press F again.",
  "Stone says you are definitely speedrunning.",
  "Tree AI requests more sunlight and snacks.",
  "Sandbox core online. Absolutely stable. Probably.",
  "Local chicken not found. Proceeding anyway.",
  "The dirt coughs into your inventory.",
  "Approved geometry denies all allegations."
];
const fakeHotbarLabels = [
  "maybe stone",
  "human grass",
  "approved geometry",
  "nutritional dirt",
  "legal leaves",
  "wet evidence",
  "block-shaped rumor",
  "safe cube"
];
const corruptionLines = [
  "reality.dll failed",
  "grass thread blocked",
  "warning: stone became emotional",
  "object world has opinions",
  "sky matrix returned false",
  "parasite budget exceeded"
];

window.addEventListener("keydown", (e) => {
  const lowered = e.key.toLowerCase();
  keys[lowered] = true;
  keys[e.key] = true;

  if (lowered === "r") {
    restartGame();
  }

  if (lowered === "f") {
    showWorldPhrase();
  }

  if ((e.key === " " || e.key === "Enter") && introVisible) {
    hideIntroOverlay();
  }

  if ((e.key === " " || e.key === "Enter") && tutorialTimerMs > 0) {
    hideTutorialOverlay();
  }

  if (lowered === "b") {
    startAtomicBomb();
  }

  if (e.key === "`") {
    debugOverlayEnabled = !debugOverlayEnabled;
    updateDebugOverlay();
  }

  const n = Number(e.key);
  if (n >= 1 && n <= hotbarBlocks.length) {
    selectedBlockIndex = n - 1;
    updateHotbar();
  }
});

window.addEventListener("keyup", (e) => {
  const lowered = e.key.toLowerCase();
  keys[lowered] = false;
  keys[e.key] = false;
});

function createEmptyWorld() {
  world = [];

  for (let x = 0; x < WORLD_W; x += 1) {
    world[x] = [];

    for (let y = 0; y < WORLD_H; y += 1) {
      world[x][y] = [];

      for (let z = 0; z < WORLD_D; z += 1) {
        world[x][y][z] = BLOCK_AIR;
      }
    }
  }
}

function inBounds(x, y, z) {
  return x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H && z >= 0 && z < WORLD_D;
}

function getBlock(x, y, z) {
  if (!inBounds(x, y, z)) {
    return BLOCK_AIR;
  }

  return world[x][y][z];
}

function setBlock(x, y, z, value) {
  if (!inBounds(x, y, z)) {
    return;
  }

  world[x][y][z] = value;
}

function getTopHeight(x, z) {
  for (let y = WORLD_H - 1; y >= 0; y -= 1) {
    if (getBlock(x, y, z) !== BLOCK_AIR) {
      return y;
    }
  }

  return -1;
}

function placeTree(x, z) {
  const groundY = getTopHeight(x, z);
  const trunkBaseY = groundY + 1;
  const leafBaseY = trunkBaseY + 2;

  if (groundY < 0 || trunkBaseY + 2 >= WORLD_H) {
    return;
  }

  for (let leafX = x - 1; leafX <= x + 1; leafX += 1) {
    for (let leafZ = z - 1; leafZ <= z + 1; leafZ += 1) {
      setBlock(leafX, leafBaseY, leafZ, BLOCK_LEAVES);
    }
  }

  setBlock(x, leafBaseY + 1, z, BLOCK_LEAVES);

  for (let y = trunkBaseY; y < trunkBaseY + 3; y += 1) {
    setBlock(x, y, z, BLOCK_WOOD);
  }
}

function placeSurfaceBlock(x, z, blockId) {
  const y = getTopHeight(x, z) + 1;

  if (y > 0 && y < WORLD_H) {
    setBlock(x, y, z, blockId);
  }
}

function placeHiddenCore(x, z) {
  const surfaceY = getTopHeight(x, z);
  const y = Math.max(1, Math.min(WORLD_H - 3, surfaceY - 2));
  setBlock(x, y, z, BLOCK_CORE);
}

function placeAnomalies() {
  const corePositions = [
    [5, 7],
    [18, 20],
    [24, 9]
  ];
  const eyePositions = [
    [8, 14],
    [15, 5],
    [22, 23],
    [4, 22]
  ];
  const parasitePositions = [
    [6, 20],
    [13, 13],
    [21, 7],
    [25, 18]
  ];

  for (const [x, z] of corePositions) {
    placeHiddenCore(x, z);
  }

  for (const [x, z] of eyePositions) {
    placeSurfaceBlock(x, z, BLOCK_EYE);
  }

  for (const [x, z] of parasitePositions) {
    placeSurfaceBlock(x, z, BLOCK_PARASITE);
  }
}

function generateWorld() {
  createEmptyWorld();

  for (let x = 0; x < WORLD_W; x += 1) {
    for (let z = 0; z < WORLD_D; z += 1) {
      const waveHeight = Math.floor(
        4
        + Math.sin(x * 0.38) * 2.1
        + Math.cos(z * 0.32) * 1.8
        + Math.sin((x + z) * 0.18) * 1.1
      );
      const height = Math.max(1, Math.min(WORLD_H - 2, waveHeight));
      const isBeach = z < 4 || x > WORLD_W - 5;
      const isAnomalyPatch = (x * 17 + z * 31) % 97 === 0;
      const topBlock = isBeach ? BLOCK_SAND : isAnomalyPatch ? BLOCK_STONE : BLOCK_GRASS;

      for (let y = 0; y <= height; y += 1) {
        if (y === height) {
          setBlock(x, y, z, topBlock);
        } else if (height - y <= 2) {
          setBlock(x, y, z, BLOCK_DIRT);
        } else {
          setBlock(x, y, z, BLOCK_STONE);
        }
      }
    }
  }

  const treePositions = [
    [4, 5],
    [7, 18],
    [12, 9],
    [15, 22],
    [20, 6],
    [23, 16],
    [10, 25],
    [25, 24]
  ];

  for (const [x, z] of treePositions) {
    placeTree(x, z);
  }

  placeAnomalies();
}

function saveWorld() {
  localStorage.setItem(WORLD_STORAGE_KEY, JSON.stringify({
    version: SAVE_VERSION,
    width: WORLD_W,
    height: WORLD_H,
    depth: WORLD_D,
    blocks: world
  }));
}

function loadWorld() {
  const storedWorld = localStorage.getItem(WORLD_STORAGE_KEY);

  if (storedWorld === null) {
    return false;
  }

  try {
    const save = JSON.parse(storedWorld);

    if (Array.isArray(save)) {
      return false;
    }

    if (
      save.version !== SAVE_VERSION
      || save.width !== WORLD_W
      || save.height !== WORLD_H
      || save.depth !== WORLD_D
      || !Array.isArray(save.blocks)
    ) {
      return false;
    }

    world = save.blocks;
    return true;
  } catch {
    return false;
  }
}

const TILE_W = 48;
const TILE_H = 24;
const BLOCK_H = 24;

function worldToScreen(x, y, z) {
  const sx = (x - z) * (TILE_W / 2);
  const sy = (x + z) * (TILE_H / 2) - y * BLOCK_H;
  const playerSx = (player.x - player.z) * (TILE_W / 2);
  const playerSy = (player.x + player.z) * (TILE_H / 2) - player.y * BLOCK_H;

  return {
    x: canvas.width / 2 + sx - playerSx,
    y: canvas.height / 2 + sy - playerSy
  };
}

function movingForward() {
  return keys["w"] || keys["arrowup"];
}

function movingBackward() {
  return keys["s"] || keys["arrowdown"];
}

function movingLeft() {
  return keys["a"] || keys["arrowleft"];
}

function movingRight() {
  return keys["d"] || keys["arrowright"];
}

function isMovementPressed() {
  return movingForward() || movingBackward() || movingLeft() || movingRight() || keys["q"] || keys["e"];
}

function updatePlayer() {
  if (movingForward()) {
    player.z -= player.speed;
  }
  if (movingBackward()) {
    player.z += player.speed;
  }
  if (movingLeft()) {
    player.x -= player.speed;
  }
  if (movingRight()) {
    player.x += player.speed;
  }
  if (keys["q"]) {
    player.y += player.speed;
  }
  if (keys["e"]) {
    player.y -= player.speed;
  }

  player.x = Math.max(0, Math.min(WORLD_W - 1, player.x));
  player.z = Math.max(0, Math.min(WORLD_D - 1, player.z));
  player.y = Math.max(0, Math.min(WORLD_H + 2, player.y));
}

function updateUI() {
  coordsEl.textContent = `X: ${player.x.toFixed(1)} Y: ${player.y.toFixed(1)} Z: ${player.z.toFixed(1)}`;
}

function clampWorldAnger() {
  worldAnger = Math.max(0, Math.min(maxWorldAnger, worldAnger));
}

function showWorldMessage(text, duration = 180) {
  messageText = text;
  messageTimer = duration;
  updateChaosUI();
}

function getPhaseForAnger() {
  if (worldAnger >= 75) {
    return 3;
  }

  if (worldAnger >= 45) {
    return 2;
  }

  if (worldAnger >= 20) {
    return 1;
  }

  return 0;
}

function updateWorldPhase() {
  const nextPhase = getPhaseForAnger();

  if (nextPhase === worldPhase) {
    return;
  }

  const previousPhase = worldPhase;
  worldPhase = nextPhase;

  const phaseMessages = [
    "",
    "The world noticed you",
    "Geometry is irritated",
    "The world is no longer pretending"
  ];

  if (worldPhase > previousPhase && phaseMessages[worldPhase]) {
    showWorldMessage(phaseMessages[worldPhase], 210);
    triggerScreenShake(4 + worldPhase * 2, 28 + worldPhase * 12);

    if (worldPhase >= 2) {
      triggerDrift(160);
      activeEffects.liarHotbarTimer = Math.max(activeEffects.liarHotbarTimer, 300);
      activeEffects.debugCorruptionTimer = Math.max(activeEffects.debugCorruptionTimer, 360);
    }

    if (worldPhase >= 3) {
      triggerRealityBlink();
    }
  }
}

function addWorldAnger(amount) {
  if (gameWon || gameLost) {
    return;
  }

  worldAnger += amount;
  clampWorldAnger();
  if (!gameWon && !gameLost) {
    updateWorldPhase();
  }
  updateChaosUI();
}

function reduceWorldCollapse(amount) {
  worldCollapse = Math.max(0, worldCollapse - amount);
  updateCollapseUI();
}

function handleBrokenBlock(blockId) {
  if (gameWon || gameLost) {
    return;
  }

  if (blockId === BLOCK_CORE) {
    collectedCores = Math.min(totalCores, collectedCores + 1);
    addWorldAnger(-22);
    reduceWorldCollapse(18);
    parasiteReliefTimer = 360;
    triggerScreenShake(7, 34);
    showWorldMessage(`Core stabilized: ${collectedCores}/${totalCores}`, 190);
    activeEffects.debugCorruptionTimer = Math.max(activeEffects.debugCorruptionTimer, 360);
    coreHintTimer = 300;
    updateGameState();
    return;
  }

  if (blockId === BLOCK_EYE) {
    addWorldAnger(14);
    worldCollapse = Math.min(maxWorldCollapse, worldCollapse + 2.5);
    triggerScreenShake(12, 54);
    activeEffects.liarHotbarTimer = Math.max(activeEffects.liarHotbarTimer, 240);
    showNearestCoreHint("The eye screamed toward");
    return;
  }

  if (blockId === BLOCK_PARASITE) {
    addWorldAnger(-4);
    reduceWorldCollapse(3.5);
    parasiteReliefTimer = Math.max(parasiteReliefTimer, 120);
    triggerScreenShake(3, 18);
    showWorldMessage("Parasite growth burned back", 90);
    scanParasitePressure();
    return;
  }

  if (blockId === BLOCK_FLESH) {
    addWorldAnger(-1);
    reduceWorldCollapse(1);
    activeEffects.coughTimer = Math.max(activeEffects.coughTimer, 45);
    return;
  }

  addWorldAnger(blockId === BLOCK_WOOD || blockId === BLOCK_LEAVES ? 2 : 1);
}

function resetChaosState() {
  worldAnger = 0;
  worldPhase = 0;
  collectedCores = 0;
  gameWon = false;
  gameLost = false;
  worldCollapse = 0;
  parasiteCount = 0;
  fleshCount = 0;
  parasitePressure = 0;
  gameTimer = 0;
  highAngerTimer = 0;
  parasiteScanTimer = 0;
  coreHintTimer = 420;
  parasiteReliefTimer = 0;
  maxAngerTimer = 0;
  finalMadnessUnlocked = false;
  finalMadnessActive = false;
  messageText = "";
  messageTimer = 0;
  introTimerMs = 0;
  introVisible = false;
  nukeState.active = false;
  nukeState.phase = "idle";
  nukeState.timer = 0;
  nukeState.radius = 0;
  nukeState.pulse = 0;

  for (const key of Object.keys(activeEffects)) {
    activeEffects[key] = 0;
  }

  activeEffects.phaseEventCooldown = 120;
  activeEffects.parasiteCooldown = 60;
  activeEffects.eyeCooldown = 90;
  player.x = WORLD_W / 2;
  player.y = WORLD_H - 2;
  player.z = WORLD_D / 2;
  gameRoot.style.setProperty("--chaos-x", "0px");
  gameRoot.style.setProperty("--chaos-y", "0px");
  gameRoot.style.setProperty("--chaos-wave-rot", "0deg");
  gameRoot.style.setProperty("--chaos-spin-rot", "0deg");
  gameRoot.style.setProperty("--chaos-scale", "1");
  document.body.classList.remove(
    "chaos-tilt",
    "chaos-upside-down",
    "chaos-invert",
    "chaos-wave",
    "chaos-meltdown",
    "chaos-debug",
    "game-won",
    "game-lost"
  );
  endScreenEl.classList.remove("visible");
  endScreenEl.setAttribute("aria-hidden", "true");
  updateHotbar();
  updateChaosUI();
  updateCollapseUI();
  hideIntroOverlay();
  hideTutorialOverlay();
}

function restartGame() {
  generateWorld();
  resetChaosState();
  scanParasitePressure();
  saveWorld();
  updateHoveredBlock();
  showWorldMessage("New run. Find anomaly cores.", 140);
  showIntroOverlay();
  showTutorialOverlay();
}

function triggerScreenShake(power, duration) {
  activeEffects.screenShakePower = Math.max(activeEffects.screenShakePower, power);
  activeEffects.screenShakeTimer = Math.max(activeEffects.screenShakeTimer, duration);
}

function triggerDrift(duration) {
  activeEffects.driftTimer = Math.max(activeEffects.driftTimer, duration);
  activeEffects.driftDuration = Math.max(activeEffects.driftDuration, duration);
  document.body.classList.add("chaos-wave");
}

function triggerUpsideDown(duration) {
  activeEffects.upsideDownTimer = Math.max(activeEffects.upsideDownTimer, duration);
  activeEffects.invertTimer = Math.max(activeEffects.invertTimer, Math.floor(duration * 0.5));
  showWorldMessage(Math.random() > 0.5 ? "Reality rotated" : "The sky disagrees", duration + 30);
}

function triggerRealityBlink() {
  activeEffects.blinkTimer = 24;
  activeEffects.invertTimer = Math.max(activeEffects.invertTimer, 24);
  activeEffects.debugCorruptionTimer = Math.max(activeEffects.debugCorruptionTimer, 240);
  triggerScreenShake(8, 34);
  showWorldMessage("Reality blinked", 90);

  const changes = 4 + worldPhase * 2;

  for (let i = 0; i < changes; i += 1) {
    const x = Math.floor(Math.random() * WORLD_W);
    const z = Math.floor(Math.random() * WORLD_D);
    const y = getTopHeight(x, z);
    const block = getBlock(x, y, z);

    if (block === BLOCK_DIRT || block === BLOCK_GRASS || block === BLOCK_SAND) {
      setBlock(x, y, z, Math.random() > 0.35 ? BLOCK_FLESH : BLOCK_PARASITE);
    } else if (block === BLOCK_AIR && y + 1 < WORLD_H) {
      setBlock(x, y + 1, z, BLOCK_EYE);
    }
  }

  saveWorld();
}

function updateChaosUI() {
  const percent = Math.round((worldAnger / maxWorldAnger) * 100);
  chaosFillEl.style.width = `${percent}%`;
  chaosValueEl.textContent = `${percent}%`;

  if (gameWon) {
    objectiveText = "Reality is stable. Probably.";
  } else if (gameLost) {
    objectiveText = "Run failed. Press R.";
  } else if (parasitePressure >= maxParasiteCountBeforeLoss * 0.72) {
    objectiveText = "Destroy parasite growth";
  } else if (worldPhase >= 3) {
    objectiveText = `Survive and extract the last core: ${collectedCores}/${totalCores}`;
  } else if (collectedCores === 0) {
    objectiveText = `Find anomaly cores: ${collectedCores}/${totalCores}`;
  } else if (collectedCores < totalCores) {
    objectiveText = `Return stability cores: ${collectedCores}/${totalCores}`;
  } else {
    objectiveText = "Return to stability";
  }

  objectivePanelEl.textContent = objectiveText;

  if (messageTimer > 0 && messageText !== "") {
    worldMessageEl.textContent = messageText;
    worldMessageEl.classList.add("visible");
  } else {
    worldMessageEl.classList.remove("visible");
  }
}

function updateHotbar() {
  hotbarEl.innerHTML = "";

  hotbarBlocks.forEach((blockId, index) => {
    const slot = document.createElement("div");
    slot.className = "hotbar-slot";

    if (index === selectedBlockIndex) {
      slot.classList.add("active");
    }

    if (activeEffects.liarHotbarTimer > 0) {
      slot.textContent = fakeHotbarLabels[(index + worldPhase + frameCount) % fakeHotbarLabels.length];
    } else {
      slot.textContent = BLOCK_NAMES[blockId];
    }

    hotbarEl.appendChild(slot);
  });

  if (activeEffects.liarHotbarTimer > 0) {
    selectedBlockEl.textContent = `Block: ${fakeHotbarLabels[(selectedBlockIndex + frameCount) % fakeHotbarLabels.length]}`;
  } else {
    selectedBlockEl.textContent = `Block: ${BLOCK_NAMES[hotbarBlocks[selectedBlockIndex]]}`;
  }
}

function showWorldPhrase() {
  const index = Math.floor(Math.random() * worldPhrases.length);
  memeMessageEl.textContent = worldPhrases[index];
  memeMessageEl.classList.add("visible");

  if (memeMessageTimer !== null) {
    clearTimeout(memeMessageTimer);
  }

  memeMessageTimer = setTimeout(() => {
    memeMessageEl.classList.remove("visible");
    memeMessageTimer = null;
  }, 2400);
}

function showIntroOverlay() {
  introTimerMs = introDurationMs;
  introVisible = true;
  introOverlayEl.classList.add("visible");
}

function hideIntroOverlay() {
  introTimerMs = 0;
  introVisible = false;
  introOverlayEl.classList.remove("visible");
}

function updateIntroOverlay(deltaMs) {
  if (!introVisible) {
    return;
  }

  introTimerMs = Math.max(0, introTimerMs - deltaMs);

  if (introTimerMs === 0) {
    hideIntroOverlay();
  }
}

function showTutorialOverlay() {
  tutorialTimerMs = tutorialDurationMs;
  tutorialOverlayEl.classList.add("visible");
  tutorialOverlayEl.setAttribute("aria-hidden", "false");
}

function hideTutorialOverlay() {
  tutorialTimerMs = 0;
  tutorialOverlayEl.classList.remove("visible");
  tutorialOverlayEl.setAttribute("aria-hidden", "true");
}

function updateTutorialOverlay(deltaMs) {
  if (tutorialTimerMs <= 0) {
    return;
  }

  tutorialTimerMs = Math.max(0, tutorialTimerMs - deltaMs);

  if (tutorialTimerMs === 0) {
    hideTutorialOverlay();
  }
}

function startAtomicBomb() {
  if (gameWon || gameLost || nukeState.active || hoveredBlock === null) {
    if (hoveredBlock === null && !gameWon && !gameLost && !nukeState.active) {
      showWorldMessage("No lock: aim at a block first", 90);
    }
    return;
  }

  nukeState.active = true;
  nukeState.phase = "warning";
  nukeState.timer = 54;
  nukeState.targetX = hoveredBlock.x;
  nukeState.targetY = hoveredBlock.y;
  nukeState.targetZ = hoveredBlock.z;
  nukeState.radius = 5;
  nukeState.pulse = 0;
  triggerScreenShake(7, 40);
  showWorldMessage("Nuclear solution armed", 120);
}

function detonateAtomicBomb() {
  const radiusSq = nukeState.radius * nukeState.radius;
  let destroyedBlocks = 0;

  for (let x = nukeState.targetX - nukeState.radius; x <= nukeState.targetX + nukeState.radius; x += 1) {
    for (let y = nukeState.targetY - nukeState.radius; y <= nukeState.targetY + nukeState.radius; y += 1) {
      for (let z = nukeState.targetZ - nukeState.radius; z <= nukeState.targetZ + nukeState.radius; z += 1) {
        if (!inBounds(x, y, z)) {
          continue;
        }

        const dx = x - nukeState.targetX;
        const dy = y - nukeState.targetY;
        const dz = z - nukeState.targetZ;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq > radiusSq) {
          continue;
        }

        const block = getBlock(x, y, z);
        if (block === BLOCK_AIR) {
          continue;
        }

        setBlock(x, y, z, BLOCK_AIR);
        destroyedBlocks += 1;
      }
    }
  }

  for (let i = 0; i < 14; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const dist = nukeState.radius + Math.random() * 1.5;
    const x = Math.round(nukeState.targetX + Math.cos(angle) * dist);
    const z = Math.round(nukeState.targetZ + Math.sin(angle) * dist);
    const y = getTopHeight(x, z) + 1;

    if (inBounds(x, y, z) && getBlock(x, y, z) === BLOCK_AIR) {
      setBlock(x, y, z, Math.random() > 0.58 ? BLOCK_PARASITE : BLOCK_FLESH);
    }
  }

  addWorldAnger(24);
  worldCollapse = Math.min(maxWorldCollapse, worldCollapse + 14);
  activeEffects.invertTimer = Math.max(activeEffects.invertTimer, 28);
  activeEffects.debugCorruptionTimer = Math.max(activeEffects.debugCorruptionTimer, 320);
  triggerDrift(170);
  triggerScreenShake(20, 72);
  scanParasitePressure();
  updateCollapseUI();
  showWorldMessage(`Detonation complete (${destroyedBlocks} blocks)`, 150);
  saveWorld();
}

function updateAtomicBomb() {
  if (!nukeState.active) {
    return;
  }

  nukeState.timer = Math.max(0, nukeState.timer - 1);
  nukeState.pulse += 1;

  if (nukeState.phase === "warning") {
    triggerScreenShake(8, 8);

    if (nukeState.timer === 0) {
      nukeState.phase = "flash";
      nukeState.timer = 16;
      activeEffects.invertTimer = Math.max(activeEffects.invertTimer, 20);
      triggerScreenShake(24, 28);
    }
    return;
  }

  if (nukeState.phase === "flash") {
    if (nukeState.timer === 0) {
      nukeState.phase = "detonation";
      nukeState.timer = 1;
      detonateAtomicBomb();
    }
    return;
  }

  if (nukeState.phase === "detonation") {
    nukeState.phase = "cooldown";
    nukeState.timer = 48;
    return;
  }

  if (nukeState.phase === "cooldown" && nukeState.timer === 0) {
    nukeState.active = false;
    nukeState.phase = "idle";
    nukeState.radius = 0;
    nukeState.pulse = 0;
  }
}

function updateDebugOverlay() {
  if (!debugOverlayEnabled) {
    debugOverlayEl.classList.remove("visible");
    return;
  }

  const corrupted = worldPhase >= 2 || activeEffects.debugCorruptionTimer > 0;
  const extraLines = corrupted
    ? corruptionLines.slice(0, Math.min(corruptionLines.length, 2 + worldPhase * 2))
    : ["Nanobots in leaves: calibrated"];

  debugOverlayEl.classList.add("visible");
  debugOverlayEl.textContent = [
    corrupted ? "!!! ENGINE PANIC TELEMETRY !!!" : "=== FAKE ENGINE TELEMETRY ===",
    `FPS: ${fps}`,
    `World anger: ${worldAnger.toFixed(1)}/${maxWorldAnger}`,
    `World collapse: ${worldCollapse.toFixed(1)}/${maxWorldCollapse}`,
    `Chaos phase: ${worldPhase}`,
    `Cores stolen: ${collectedCores}/${totalCores}`,
    `Parasite pressure: ${Math.round(parasitePressure)}/${maxParasiteCountBeforeLoss}`,
    `Run timer: ${Math.floor(gameTimer / 60)}s`,
    `Screen truth: ${activeEffects.liarHotbarTimer > 0 ? "lying" : "unverified"}`,
    `Chunk mood: ${Math.round((player.x + player.z) * 3) % 7}/6`,
    `Isometric entropy: ${(Math.sin(player.x) * Math.cos(player.z) * 100).toFixed(2)}%`,
    `Hovered block: ${hoveredBlock ? `${hoveredBlock.x},${hoveredBlock.y},${hoveredBlock.z}` : "none"}`,
    ...extraLines
  ].join("\n");
}

function decrementEffectTimers() {
  const timerKeys = [
    "screenShakeTimer",
    "driftTimer",
    "invertTimer",
    "upsideDownTimer",
    "liarHotbarTimer",
    "blinkTimer",
    "coughTimer",
    "debugCorruptionTimer",
    "phaseEventCooldown",
    "parasiteCooldown",
    "eyeCooldown"
  ];

  for (const key of timerKeys) {
    activeEffects[key] = Math.max(0, activeEffects[key] - 1);
  }

  if (activeEffects.driftTimer === 0) {
    activeEffects.driftDuration = 0;
  }

  if (activeEffects.screenShakeTimer === 0) {
    activeEffects.screenShakePower = 0;
  }
}

function updateScreenEffects() {
  const wasLying = activeEffects.liarHotbarTimer > 0;
  decrementEffectTimers();

  let x = 0;
  let y = 0;
  let waveRot = 0;
  let spinRot = 0;
  let scale = 1;

  if (activeEffects.screenShakeTimer > 0) {
    const fade = activeEffects.screenShakeTimer / Math.max(1, activeEffects.screenShakeTimer + 12);
    const power = activeEffects.screenShakePower * fade;
    x += (Math.random() * 2 - 1) * power;
    y += (Math.random() * 2 - 1) * power;
  }

  if (activeEffects.driftTimer > 0) {
    const elapsed = activeEffects.driftDuration - activeEffects.driftTimer;
    x += Math.sin(elapsed * 0.045) * 18;
    y += Math.cos(elapsed * 0.035) * 10;
  }

  if (nukeState.active && nukeState.phase !== "idle") {
    const boomPulse = Math.sin(nukeState.pulse * 0.45);
    x += boomPulse * 8;
    y += Math.cos(nukeState.pulse * 0.42) * 5;
    waveRot += boomPulse * 3.8;
  }

  if (finalMadnessActive) {
    const t = gameTimer;
    x += Math.sin(t * 0.07) * 36 + Math.sin(t * 0.19) * 12;
    y += Math.cos(t * 0.08) * 20 + Math.sin(t * 0.14) * 8;
    waveRot += Math.sin(t * 0.06) * 12;
    spinRot += (t * 0.22) % 360;
    scale += Math.sin(t * 0.09) * 0.02;
  }

  gameRoot.style.setProperty("--chaos-x", `${x.toFixed(2)}px`);
  gameRoot.style.setProperty("--chaos-y", `${y.toFixed(2)}px`);
  gameRoot.style.setProperty("--chaos-wave-rot", `${waveRot.toFixed(2)}deg`);
  gameRoot.style.setProperty("--chaos-spin-rot", `${spinRot.toFixed(2)}deg`);
  gameRoot.style.setProperty("--chaos-scale", `${scale.toFixed(4)}`);
  document.body.classList.toggle("chaos-tilt", worldPhase >= 2 || activeEffects.driftTimer > 0);
  document.body.classList.toggle("chaos-invert", activeEffects.invertTimer > 0 || activeEffects.blinkTimer > 0);
  document.body.classList.toggle("chaos-upside-down", activeEffects.upsideDownTimer > 0);
  document.body.classList.toggle("chaos-wave", activeEffects.driftTimer > 0 || worldPhase >= 3);
  document.body.classList.toggle("chaos-meltdown", finalMadnessActive);
  document.body.classList.toggle("chaos-debug", worldPhase >= 2 || activeEffects.debugCorruptionTimer > 0);

  if (wasLying || activeEffects.liarHotbarTimer > 0) {
    updateHotbar();
  }
}

function triggerPhaseEvents() {
  if (worldPhase <= 0 || activeEffects.phaseEventCooldown > 0) {
    return;
  }

  const roll = Math.random();
  const madnessBoost = finalMadnessActive ? 1 : 0;

  if (worldPhase === 1) {
    if (roll < 0.55) {
      triggerScreenShake(2.5, 18);
    } else {
      showWorldMessage("Something moved underground", 110);
    }

    activeEffects.phaseEventCooldown = (finalMadnessActive ? 170 : 300) + Math.floor(Math.random() * (finalMadnessActive ? 90 : 180));
    return;
  }

  if (worldPhase === 2) {
    if (roll < 0.34) {
      activeEffects.liarHotbarTimer = 260 + madnessBoost * 220;
      showWorldMessage("Inventory translated itself", 120);
    } else if (roll < 0.68) {
      triggerDrift(180 + madnessBoost * 120);
    } else {
      activeEffects.coughTimer = 80 + madnessBoost * 50;
      activeEffects.debugCorruptionTimer = 220 + madnessBoost * 210;
      showWorldMessage("The world coughed", 120);
      triggerScreenShake(4 + madnessBoost * 2, 22 + madnessBoost * 20);
    }

    activeEffects.phaseEventCooldown = (finalMadnessActive ? 130 : 240) + Math.floor(Math.random() * (finalMadnessActive ? 90 : 160));
    return;
  }

  if (roll < 0.28) {
    triggerUpsideDown(90);
  } else if (roll < 0.62) {
    triggerRealityBlink();
  } else {
    activeEffects.liarHotbarTimer = 360 + madnessBoost * 300;
    triggerDrift(220 + madnessBoost * 160);
    showWorldMessage("The interface is making things up", 130);
  }

  activeEffects.phaseEventCooldown = (finalMadnessActive ? 90 : 180) + Math.floor(Math.random() * (finalMadnessActive ? 80 : 140));
}

function findBlocks(blockId, limit = Infinity) {
  const results = [];

  for (let x = 0; x < WORLD_W; x += 1) {
    for (let y = 0; y < WORLD_H; y += 1) {
      for (let z = 0; z < WORLD_D; z += 1) {
        if (getBlock(x, y, z) === blockId) {
          results.push({ x, y, z });

          if (results.length >= limit) {
            return results;
          }
        }
      }
    }
  }

  return results;
}

function scanParasitePressure() {
  parasiteCount = 0;
  fleshCount = 0;

  for (let x = 0; x < WORLD_W; x += 1) {
    for (let y = 0; y < WORLD_H; y += 1) {
      for (let z = 0; z < WORLD_D; z += 1) {
        const block = getBlock(x, y, z);

        if (block === BLOCK_PARASITE) {
          parasiteCount += 1;
        } else if (block === BLOCK_FLESH) {
          fleshCount += 1;
        }
      }
    }
  }

  parasitePressure = parasiteCount + fleshCount * 0.5;
  updateCollapseUI();
}

function updateCollapseUI() {
  const collapsePercent = Math.round((worldCollapse / maxWorldCollapse) * 100);
  collapseFillEl.style.width = `${collapsePercent}%`;
  collapseValueEl.textContent = `${collapsePercent}%`;
  parasitePressureEl.textContent = `Parasite pressure: ${Math.round(parasitePressure)}/${maxParasiteCountBeforeLoss}`;
}

function getNearestCore() {
  let nearestCore = null;
  let nearestDistance = Infinity;

  for (let x = 0; x < WORLD_W; x += 1) {
    for (let y = 0; y < WORLD_H; y += 1) {
      for (let z = 0; z < WORLD_D; z += 1) {
        if (getBlock(x, y, z) !== BLOCK_CORE) {
          continue;
        }

        const dx = x - player.x;
        const dy = y - player.y;
        const dz = z - player.z;
        const distance = dx * dx + dy * dy + dz * dz;

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestCore = { x, y, z, dx, dy, dz };
        }
      }
    }
  }

  return nearestCore;
}

function getCoreDirection(core) {
  if (core === null) {
    return "";
  }

  if (Math.abs(core.dy) > Math.max(Math.abs(core.dx), Math.abs(core.dz)) && Math.abs(core.dy) > 1.5) {
    return core.dy > 0 ? "above you" : "below you";
  }

  if (Math.abs(core.dx) > Math.abs(core.dz)) {
    return core.dx > 0 ? "east" : "west";
  }

  return core.dz > 0 ? "south" : "north";
}

function showNearestCoreHint(prefix = "The core is") {
  const nearestCore = getNearestCore();

  if (nearestCore === null) {
    showWorldMessage("No cores remain. Make reality accept it.", 150);
    return;
  }

  const direction = getCoreDirection(nearestCore);
  showWorldMessage(`${prefix} ${direction}`, 145);
}

function triggerVictory() {
  if (gameWon || gameLost) {
    return;
  }

  gameWon = true;
  worldAnger = 0;
  worldCollapse = 0;
  worldPhase = 0;
  messageTimer = 0;

  for (const key of Object.keys(activeEffects)) {
    activeEffects[key] = 0;
  }

  activeEffects.phaseEventCooldown = 9999;
  activeEffects.parasiteCooldown = 9999;
  activeEffects.eyeCooldown = 9999;
  gameRoot.style.setProperty("--chaos-x", "0px");
  gameRoot.style.setProperty("--chaos-y", "0px");
  gameRoot.style.setProperty("--chaos-wave-rot", "0deg");
  gameRoot.style.setProperty("--chaos-spin-rot", "0deg");
  gameRoot.style.setProperty("--chaos-scale", "1");
  document.body.classList.remove("chaos-tilt", "chaos-upside-down", "chaos-invert", "chaos-wave", "chaos-meltdown", "chaos-debug", "game-lost");
  document.body.classList.add("game-won");
  endTitleEl.textContent = "Reality is stable. Probably.";
  endSubtitleEl.textContent = "You convinced geometry to stand down.";
  endScreenEl.classList.add("visible");
  endScreenEl.setAttribute("aria-hidden", "false");
  updateHotbar();
  updateChaosUI();
  updateCollapseUI();
}

function triggerLoss(reason) {
  if (gameWon || gameLost) {
    return;
  }

  gameLost = true;
  messageTimer = 0;
  activeEffects.screenShakeTimer = 9999;
  activeEffects.screenShakePower = 6;
  activeEffects.driftTimer = 9999;
  activeEffects.driftDuration = 9999;
  activeEffects.debugCorruptionTimer = 9999;
  document.body.classList.remove("game-won");
  document.body.classList.add("game-lost", "chaos-wave");
  endTitleEl.textContent = "The world replaced you";
  endSubtitleEl.textContent = reason;
  endScreenEl.classList.add("visible");
  endScreenEl.setAttribute("aria-hidden", "false");
  updateChaosUI();
  updateCollapseUI();
}

function updateGameState() {
  if (gameWon || gameLost) {
    updateChaosUI();
    updateCollapseUI();
    return;
  }

  if (parasiteScanTimer <= 0) {
    scanParasitePressure();
    parasiteScanTimer = 45;
  } else {
    parasiteScanTimer -= 1;
  }

  if (worldAnger >= 72) {
    highAngerTimer += 1;
  } else {
    highAngerTimer = Math.max(0, highAngerTimer - 2);
  }

  const timePressure = Math.min(0.018, gameTimer / 72000);
  const parasiteRatio = parasitePressure / maxParasiteCountBeforeLoss;
  let collapseDelta = timePressure + parasiteRatio * 0.018;

  if (worldPhase >= 2) {
    collapseDelta += worldPhase * 0.008;
  }

  if (highAngerTimer > 180) {
    collapseDelta += 0.04 + (worldAnger - 72) * 0.0015;
  }

  if (parasiteReliefTimer > 0) {
    parasiteReliefTimer -= 1;
    collapseDelta *= 0.25;
  }

  worldCollapse = Math.max(0, Math.min(maxWorldCollapse, worldCollapse + collapseDelta));

  if (collectedCores >= totalCores) {
    triggerVictory();
    return;
  }

  if (parasitePressure >= maxParasiteCountBeforeLoss) {
    triggerLoss("You were outvoted by blocks.");
    return;
  }

  if (worldCollapse >= maxWorldCollapse) {
    triggerLoss("Geometry revoked your permissions.");
    return;
  }

  if (coreHintTimer <= 0 && collectedCores < totalCores) {
    showNearestCoreHint(Math.random() > 0.5 ? "The core is" : "Something hums");
    coreHintTimer = Math.max(240, 560 - worldPhase * 70 - Math.floor(gameTimer / 900));
  } else {
    coreHintTimer -= 1;
  }

  updateChaosUI();
  updateCollapseUI();
}

function trySpreadParasite(origin) {
  const neighbors = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0, 1, 0],
    [0, -1, 0]
  ];
  const [dx, dy, dz] = neighbors[Math.floor(Math.random() * neighbors.length)];
  const x = origin.x + dx;
  const y = origin.y + dy;
  const z = origin.z + dz;
  const target = getBlock(x, y, z);

  if (!inBounds(x, y, z)) {
    return false;
  }

  if (target === BLOCK_DIRT || target === BLOCK_GRASS || target === BLOCK_SAND) {
    setBlock(x, y, z, Math.random() > 0.35 ? BLOCK_FLESH : BLOCK_PARASITE);
    return true;
  }

  if (target === BLOCK_AIR && y > 0 && getBlock(x, y - 1, z) !== BLOCK_AIR) {
    setBlock(x, y, z, BLOCK_PARASITE);
    return true;
  }

  return false;
}

function updateAnomalies() {
  if (gameWon || gameLost || parasiteReliefTimer > 0) {
    return;
  }

  if (activeEffects.parasiteCooldown === 0) {
    const parasites = findBlocks(BLOCK_PARASITE);
    let spreads = 0;
    const timerPressure = gameTimer > 3600 ? 1 : 0;
    const maxSpreads = worldPhase >= 3 ? 3 + timerPressure : worldPhase >= 2 ? 2 : 1;

    for (let i = 0; i < parasites.length && spreads < maxSpreads; i += 1) {
      const parasite = parasites[Math.floor(Math.random() * parasites.length)];

      if (trySpreadParasite(parasite)) {
        spreads += 1;
      }
    }

    if (spreads > 0 && worldPhase >= 2) {
      activeEffects.debugCorruptionTimer = Math.max(activeEffects.debugCorruptionTimer, 120);
      saveWorld();
    }

    activeEffects.parasiteCooldown = Math.max(32, (worldPhase >= 3 ? 45 : 75) - Math.floor(gameTimer / 1200));
  }

  if (activeEffects.eyeCooldown === 0) {
    updateEyeBlocks();
    activeEffects.eyeCooldown = 80 + Math.floor(Math.random() * 80);
  }
}

function updateEyeBlocks() {
  const eyes = findBlocks(BLOCK_EYE);

  for (const eye of eyes) {
    const dx = eye.x - player.x;
    const dz = eye.z - player.z;
    const nearPlayer = dx * dx + dz * dz < 18;

    if (nearPlayer && Math.random() < 0.45) {
      showWorldMessage("The eye remembers you", 95);
      activeEffects.debugCorruptionTimer = Math.max(activeEffects.debugCorruptionTimer, 160);
    }

    if (worldPhase >= 2 && Math.random() < 0.18) {
      const nx = Math.max(1, Math.min(WORLD_W - 2, eye.x + Math.floor(Math.random() * 5) - 2));
      const nz = Math.max(1, Math.min(WORLD_D - 2, eye.z + Math.floor(Math.random() * 5) - 2));
      const ny = getTopHeight(nx, nz) + 1;

      if (ny > 0 && ny < WORLD_H && getBlock(nx, ny, nz) === BLOCK_AIR) {
        setBlock(eye.x, eye.y, eye.z, BLOCK_AIR);
        setBlock(nx, ny, nz, BLOCK_EYE);
        saveWorld();
      }
    }
  }
}

function updateHoveredBlock() {
  let best = null;
  let bestDist = Infinity;

  for (let x = 0; x < WORLD_W; x += 1) {
    for (let y = 0; y < WORLD_H; y += 1) {
      for (let z = 0; z < WORLD_D; z += 1) {
        if (getBlock(x, y, z) === BLOCK_AIR) {
          continue;
        }

        if (getBlock(x, y + 1, z) !== BLOCK_AIR) {
          continue;
        }

        const p = worldToScreen(x, y, z);
        const dx = p.x - canvas.width / 2;
        const dy = p.y - BLOCK_H + TILE_H / 2 - canvas.height / 2;
        const dist = dx * dx + dy * dy;

        if (dist < bestDist) {
          bestDist = dist;
          best = { x, y, z };
        }
      }
    }
  }

  hoveredBlock = bestDist <= 120 * 120 ? best : null;
}

function drawFace(points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.stroke();
}

function drawBlock(x, y, z, blockId) {
  if (blockId === BLOCK_AIR) {
    return;
  }

  const p = worldToScreen(x, y, z);
  const colors = BLOCK_COLORS[blockId];

  const top = [
    { x: p.x, y: p.y - BLOCK_H },
    { x: p.x + TILE_W / 2, y: p.y - BLOCK_H + TILE_H / 2 },
    { x: p.x, y: p.y - BLOCK_H + TILE_H },
    { x: p.x - TILE_W / 2, y: p.y - BLOCK_H + TILE_H / 2 }
  ];
  const left = [
    { x: p.x - TILE_W / 2, y: p.y - BLOCK_H + TILE_H / 2 },
    { x: p.x, y: p.y - BLOCK_H + TILE_H },
    { x: p.x, y: p.y + TILE_H },
    { x: p.x - TILE_W / 2, y: p.y + TILE_H / 2 }
  ];
  const right = [
    { x: p.x + TILE_W / 2, y: p.y - BLOCK_H + TILE_H / 2 },
    { x: p.x, y: p.y - BLOCK_H + TILE_H },
    { x: p.x, y: p.y + TILE_H },
    { x: p.x + TILE_W / 2, y: p.y + TILE_H / 2 }
  ];

  drawFace(left, colors.left);
  drawFace(right, colors.right);
  drawFace(top, colors.top);

  if (blockId === BLOCK_EYE) {
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - BLOCK_H + TILE_H / 2, 10, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1b0711";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x + Math.sin(frameCount * 0.08) * 3, p.y - BLOCK_H + TILE_H / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff7a8";
    ctx.fill();
  }

  if (blockId === BLOCK_CORE) {
    ctx.beginPath();
    ctx.arc(p.x, p.y - BLOCK_H + TILE_H / 2, 7 + Math.sin(frameCount * 0.12) * 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 247, 168, 0.9)";
    ctx.fill();
  }

  if (blockId === BLOCK_PARASITE) {
    ctx.strokeStyle = "#eaff6e";
    ctx.beginPath();
    ctx.moveTo(p.x - 12, p.y - BLOCK_H + TILE_H / 2);
    ctx.lineTo(p.x + 10, p.y - BLOCK_H + 5);
    ctx.moveTo(p.x + 12, p.y - BLOCK_H + TILE_H / 2);
    ctx.lineTo(p.x - 8, p.y - BLOCK_H + 6);
    ctx.stroke();
  }
}

function drawHoveredOutline() {
  if (hoveredBlock === null) {
    return;
  }

  const p = worldToScreen(hoveredBlock.x, hoveredBlock.y, hoveredBlock.z);
  const top = [
    { x: p.x, y: p.y - BLOCK_H },
    { x: p.x + TILE_W / 2, y: p.y - BLOCK_H + TILE_H / 2 },
    { x: p.x, y: p.y - BLOCK_H + TILE_H },
    { x: p.x - TILE_W / 2, y: p.y - BLOCK_H + TILE_H / 2 }
  ];

  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);
  ctx.lineTo(top[1].x, top[1].y);
  ctx.lineTo(top[2].x, top[2].y);
  ctx.lineTo(top[3].x, top[3].y);
  ctx.closePath();
  ctx.strokeStyle = "#fff7a8";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.lineWidth = 1;
}

function renderWorld() {
  const blocks = [];

  for (let x = 0; x < WORLD_W; x += 1) {
    for (let y = 0; y < WORLD_H; y += 1) {
      for (let z = 0; z < WORLD_D; z += 1) {
        const id = getBlock(x, y, z);

        if (id !== BLOCK_AIR) {
          blocks.push({
            x,
            y,
            z,
            id,
            sort: x + y + z
          });
        }
      }
    }
  }

  blocks.sort((a, b) => a.sort - b.sort);

  for (const block of blocks) {
    drawBlock(block.x, block.y, block.z, block.id);
  }
}

function renderAtomicBombOverlay() {
  if (!nukeState.active || nukeState.phase === "idle") {
    return;
  }

  const center = worldToScreen(nukeState.targetX, nukeState.targetY, nukeState.targetZ);
  const pulse = Math.max(0, Math.sin(nukeState.pulse * 0.35));

  if (nukeState.phase === "warning") {
    const radius = 38 + pulse * 34;
    ctx.strokeStyle = `rgba(255, 90, 70, ${0.65 + pulse * 0.35})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(center.x, center.y - BLOCK_H / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  if (nukeState.phase === "flash" || nukeState.phase === "detonation" || nukeState.phase === "cooldown") {
    const cooldownFactor = nukeState.phase === "cooldown" ? nukeState.timer / 48 : 1;
    const alpha = Math.min(0.95, 0.42 + pulse * 0.5) * cooldownFactor;
    ctx.fillStyle = `rgba(255, 245, 190, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shockRadius = (1 - cooldownFactor) * 1600 + pulse * 40;
    ctx.strokeStyle = `rgba(255, 180, 90, ${0.72 * cooldownFactor})`;
    ctx.lineWidth = 14 * cooldownFactor;
    ctx.beginPath();
    ctx.arc(center.x, center.y - BLOCK_H / 2, shockRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#9bddff");
  gradient.addColorStop(1, "#62b8f2");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  renderWorld();
  renderAtomicBombOverlay();
  drawHoveredOutline();
}

function update(deltaMs) {
  updateIntroOverlay(deltaMs);
  updateTutorialOverlay(deltaMs);

  if (!gameWon && !gameLost) {
    gameTimer += 1;
    updatePlayer();
    updateAtomicBomb();
  }

  updateScreenEffects();

  if (!gameWon && !gameLost) {
    triggerPhaseEvents();
    updateAnomalies();
  }

  if (!gameWon && !gameLost && !isMovementPressed()) {
    worldAnger -= 0.015;
    clampWorldAnger();
  }

  if (!gameWon && !gameLost) {
    if (worldAnger >= maxWorldAnger) {
      maxAngerTimer += 1;
    } else {
      maxAngerTimer = 0;
    }

    if (!finalMadnessUnlocked && maxAngerTimer >= maxAngerThresholdFrames) {
      finalMadnessUnlocked = true;
      finalMadnessActive = true;
      showWorldMessage("Reality has given up", 220);
      triggerScreenShake(14, 120);
      triggerDrift(320);
      activeEffects.debugCorruptionTimer = Math.max(activeEffects.debugCorruptionTimer, 560);
      activeEffects.liarHotbarTimer = Math.max(activeEffects.liarHotbarTimer, 620);
    }
  }

  if (messageTimer > 0) {
    messageTimer -= 1;
  }

  if (!gameWon && !gameLost) {
    updateWorldPhase();
  }
  updateHoveredBlock();
  updateGameState();
  updateUI();
  updateDebugOverlay();
}

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

canvas.addEventListener("mousedown", (e) => {
  if (gameWon || gameLost || hoveredBlock === null) {
    return;
  }

  if (e.button === 0) {
    const brokenBlock = getBlock(hoveredBlock.x, hoveredBlock.y, hoveredBlock.z);
    setBlock(hoveredBlock.x, hoveredBlock.y, hoveredBlock.z, BLOCK_AIR);
    handleBrokenBlock(brokenBlock);
    saveWorld();
  }

  if (e.button === 2) {
    const px = hoveredBlock.x;
    const py = hoveredBlock.y + 1;
    const pz = hoveredBlock.z;

    if (inBounds(px, py, pz) && getBlock(px, py, pz) === BLOCK_AIR) {
      setBlock(px, py, pz, hotbarBlocks[selectedBlockIndex]);
      addWorldAnger(0.5);
      saveWorld();
    }
  }
});

function loop() {
  frameCount += 1;
  const now = performance.now();
  const deltaMs = Math.min(100, now - lastLoopTime);
  lastLoopTime = now;

  if (now - fpsLastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    fpsLastTime = now;
  }

  update(deltaMs);
  render();
  requestAnimationFrame(loop);
}

if (!loadWorld()) {
  generateWorld();
  saveWorld();
}

updateHotbar();
updateUI();
scanParasitePressure();
updateChaosUI();
updateCollapseUI();
showIntroOverlay();
showTutorialOverlay();
loop();
