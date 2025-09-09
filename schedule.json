<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OXO Scheduler Dual Countdown</title>
  <style>
    body { margin: 0; background: black; font-family: monospace; }
    video { width: 100vw; height: 100vh; object-fit: cover; display: none; }

    #countdownHappy {
      position: absolute;
      top: 15px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 4vw;
      font-weight: bold;
      color: #FFFFFF;
      display: none;
    }

    #countdownFootball {
      position: absolute;
      top: 70px;
      right: 5%;
      font-size: 4vw;
      font-weight: bold;
      color: #FFD700;
      display: none;
    }

    #debug {
      position: absolute;
      bottom: 10px;
      left: 10px;
      color: white;
      font-size: 1em;
      white-space: pre-line;
      display: none;
    }

    #overlayFade {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: black;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.8s ease-in-out; /* come il tuo */
      z-index: 10;
    }
  </style>
</head>
<body>

<div id="overlayFade"></div>

<!-- FRONT video (visibile) -->
<video id="video" autoplay muted playsinline></video>
<!-- BACK video (nuovo, nascosto): precarica il prossimo clip -->
<video id="videoNext" autoplay muted playsinline style="display:none"></video>

<!-- Logo/idle -->
<video id="logoVideo" autoplay muted loop playsinline style="display: none;">
  <source src="TV/logo.mp4" type="video/mp4">
</video>

<div id="countdownHappy"></div>
<div id="countdownFootball"></div>
<div id="debug"></div>

<script>
/* ========= RIFERIMENTI DOM ========= */
const videoFront = document.getElementById('video');       // video visibile
const videoBack  = document.getElementById('videoNext');   // video nascosto (preload)
let front = videoFront, back = videoBack;                  // puntatori correnti
const logoVideo = document.getElementById('logoVideo');
const countdownHappy = document.getElementById('countdownHappy');
const countdownFootball = document.getElementById('countdownFootball');
const debug = document.getElementById('debug');
const overlay = document.getElementById("overlayFade");

/* ========= COSTANTI/STATE ========= */
const versione = "TV";
let dateStr = new Date().toISOString().split("T")[0];

let schedule = null;    // caricato da schedule.json (obbligatorio)
let videoMap = {};
const base = "TV/";

/* ========== FUNZIONI IDENTICHE A LOGICA ESISTENTE (orari, debug, countdown) ========== */
function getDayAndSection() {
  const now = new Date();
  let day = now.getDay();
  if (day === 0) day = 7;

  const h = now.getHours(), m = now.getMinutes();
  const min = h * 60 + m;

  if (min < 300) {
    day -= 1;
    if (day < 1) day = 7;
  }

  let section = "Closed";
  if (min >= 1110 && min < 1260) section = "Happy_Hour";
  else if (min >= 1260 && min < 1320) section = "Standard_1";
  else if (min >= 1320 || min < 120) section = "DJ";
  else if (min >= 120 && min < 300) section = "Standard_2";
  else if (min >= 300 && min < 1110) section = "Closed";

  return { day, min, section };
}

let current = 0;
let playlist = [];
let countdownTimer = null;

function updateDebug(day, section, name) {
  let dayLabel;
  if (schedule[dateStr]) {
    dayLabel = `Specific ${dateStr}`;
  } else if (schedule[day] && Object.values(schedule[day]).some(arr => arr.length > 0)) {
    dayLabel = `Day ${day}`;
  } else {
    dayLabel = `Day ${day} Default`;
  }

  debug.style.display = "block";
  debug.innerText =
    `🕒 Time: ${new Date().toLocaleTimeString()}\n` +
    `📅 Sheduled day: ${dayLabel}\n` +
    `🎯 Sheduled Section: ${section}\n` +
    `🎞️ Video clip: ${name}\n` +
    `📦 Version: ${versione}`;
}

function updateCountdown(element, targetHour) {
  const now = new Date();
  const target = new Date();
  target.setHours(targetHour, 0, 0, 0);
  if (now > target) target.setDate(target.getDate() + 1);

  const diff = target - now;
  const h = Math.floor(diff / 1000 / 60 / 60);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);

  element.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function isHappyCountdownActive(min) { return min >= 1140 && min < 1260; } // 19:00–21:00
function isFootballCountdownActive(min, currentDateStr) {
  return currentDateStr === "2025-07-13" && (min >= 1140 || min < 120); // 19:00–02:00 solo 13/07/2025
}

/* ========= MOTORE SEAMLESS (nuovo) ========= */
function rebuildVideoMap() {
  videoMap = {};
  Object.values(schedule).forEach(day => {
    Object.values(day).flat().forEach(name => { videoMap[name] = base + name; });
  });
}

/* seleziona prossima sorgente in base al tuo schedule */
function pickNextSrcAndName() {
  const { day, min, section } = getDayAndSection();
  const active = !(section === "Closed");

  if (!active) return { active:false, section, min, name:null, src:null, day };

  const today = schedule[dateStr] || schedule[day] || schedule["default"];
  playlist = today[section];
  if (!playlist || playlist.length === 0) playlist = schedule["default"][section] || [];
  if (!playlist || playlist.length === 0) return { active:true, section, min, name:null, src:null, day };

  const name = playlist[current % playlist.length];
  const src  = videoMap[name] || (base + name);
  return { active:true, section, min, name, src, day };
}

/* mostra logo/idle quando Closed */
function showLogo(day, section) {
  // spegni i video
  front.pause(); front.style.display = "none";
  back.pause();  back.style.display  = "none";
  // mostra logo loop
  logoVideo.style.display = "block";
  logoVideo.play();

  updateDebug(day, section, "-");
  countdownHappy.style.display = "none";
  countdownFootball.style.display = "none";

  setTimeout(startOrContinueLoop, 60000); // riprova tra 60s
}

function applyCountdowns(name, min) {
  clearInterval(countdownTimer);
  countdownHappy.style.display = "none";
  countdownFootball.style.display = "none";
  if (!name) return;

  if (name.includes("Happy") && isHappyCountdownActive(min)) {
    countdownHappy.style.display = "block";
    updateCountdown(countdownHappy, 21);
    countdownTimer = setInterval(() => updateCountdown(countdownHappy, 21), 1000);
  } else if (name.includes("Football") && isFootballCountdownActive(min, dateStr)) {
    countdownFootball.style.display = "block";
    updateCountdown(countdownFootball, 2);
    countdownTimer = setInterval(() => updateCountdown(countdownFootball, 2), 1000);
  }
}

function safePlay(v){ const p=v.play(); if (p && p.catch) p.catch(()=>{}); }

function preloadInto(videoEl, src) {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error("no src"));
    const onReady = () => { cleanup(); resolve(); };
    const onErr   = (e) => { cleanup(); reject(e); };
    const cleanup = () => {
      videoEl.removeEventListener('canplay', onReady);
      videoEl.removeEventListener('error', onErr);
    };
    videoEl.addEventListener('canplay', onReady, { once:true });
    videoEl.addEventListener('error', onErr,   { once:true });
    videoEl.preload = 'auto';
    videoEl.src = src;
    videoEl.load();
  });
}

async function startOrContinueLoop() {
  const pick = pickNextSrcAndName();
  if (!pick.active) { showLogo(pick.day, pick.section); return; }
  if (!pick.src) {
    front.style.display = "none";
    updateDebug(pick.day, pick.section, "No video");
    setTimeout(startOrContinueLoop, 60000);
    return;
  }

  // Prima volta o rientro da logo: carica su front e parti
  if (front.style.display === "none") {
    await preloadInto(front, pick.src).catch(()=>{});
    front.style.display = "block";
    safePlay(front);
    updateDebug(pick.day, pick.section, pick.name);
    applyCountdowns(pick.name, pick.min);

    // Precarica subito il prossimo su back
    current++;
    const nextPick = pickNextSrcAndName();
    if (nextPick.active && nextPick.src) {
      await preloadInto(back, nextPick.src).catch(()=>{});
    }
    return;
  }
}

/* Fade nero + swap (usa il tuo overlay e le tue durate) */
let swapping = false;
async function doSwapWithFade() {
  if (swapping) return;
  swapping = true;

  overlay.style.opacity = "1";
  setTimeout(async () => {
    back.currentTime = 0;
    safePlay(back);

    // cut durante il nero
    front.pause();
    front.style.display = "none";
    back.style.display  = "block";

    // swap referenze
    [front, back] = [back, front];

    // refresh debug/countdown sul nuovo clip
    const { day, min, section } = getDayAndSection();
    const playingName = front.currentSrc.split('/').pop();
    updateDebug(day, section, playingName);
    applyCountdowns(playingName, min);

    overlay.style.opacity = "0";

    // Precarica il prossimo nel nuovo back
    current++;
    const nextPick = pickNextSrcAndName();
    if (nextPick.active && nextPick.src) {
      preloadInto(back, nextPick.src).catch(()=>{});
    } else {
      showLogo(day, section);
    }

    swapping = false;
  }, 1000); // 0.8s CSS + margine, come il tuo fadeToNext
}

/* swap anticipato poco prima della fine per evitare overlay TV */
function onFrontTimeUpdate() {
  if (!isFinite(front.duration) || front.duration <= 0) return;
  const remaining = front.duration - front.currentTime;
  if (remaining <= 1.06) { // ~1s: 0.8s fade + ~0.26s margine
    doSwapWithFade();
  }
}

/* fallback */
function onFrontEnded(){ doSwapWithFade(); }

/* Avvio come nel tuo script */
function fadeBootAndStart() {
  overlay.style.opacity = "1";
  setTimeout(() => {
    startOrContinueLoop();
    overlay.style.opacity = "0";
  }, 500);
}

/* ====== SCHEDULE ESTERNO (obbligatorio) ====== */
async function loadScheduleOrFail() {
  const r = await fetch('schedule.json', { cache: 'no-store' });
  if (!r.ok) throw new Error('schedule.json non trovato o non accessibile');
  return r.json();
}

/* ========= BOOT ========= */
window.addEventListener('load', async () => {
  try {
    schedule = await loadScheduleOrFail();
  } catch (e) {
    debug.style.display = "block";
    debug.textContent = 'ERRORE: ' + e.message + '\nAssicurati che "schedule.json" sia nella stessa cartella di index.html.\n';
    return;
  }

  // costruisci mappa sorgenti
  videoMap = {};
  Object.values(schedule).forEach(day => {
    Object.values(day).flat().forEach(name => { videoMap[name] = base + name; });
  });

  // listener sul video front
  front.addEventListener('timeupdate', onFrontTimeUpdate);
  front.addEventListener('ended', onFrontEnded);

  // avvio (come il tuo)
  fadeBootAndStart();
});
</script>

</body>
</html>
