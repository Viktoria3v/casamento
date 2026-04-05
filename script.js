if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const WEDDING_ISO = "2026-06-20T12:00:00+01:00";
const MARQUEE_SPEED = 0.78;

/* COUNTDOWN */

const cdDays = document.getElementById("cdDays");
const cdHours = document.getElementById("cdHours");
const cdMinutes = document.getElementById("cdMinutes");
const cdSeconds = document.getElementById("cdSeconds");

function pad(n) {
  return String(n).padStart(2, "0");
}

function updateCountdown() {
  if (!cdDays || !cdHours || !cdMinutes || !cdSeconds) return;

  const target = new Date(WEDDING_ISO).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    cdDays.textContent = "0";
    cdHours.textContent = "00";
    cdMinutes.textContent = "00";
    cdSeconds.textContent = "00";
    return;
  }

  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  cdDays.textContent = d;
  cdHours.textContent = pad(h);
  cdMinutes.textContent = pad(m);
  cdSeconds.textContent = pad(sec);
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* AUDIO CONTROL */

const music = document.getElementById("bgMusic");
const toggleBtn = document.getElementById("musicToggle");

let isPlaying = false;

function setMusicButtonState() {
  if (!toggleBtn) return;
  toggleBtn.innerHTML = isPlaying ? "&#10074;&#10074;" : "&#9654;";
}

function playMusic() {
  if (!music) return Promise.reject(new Error("Audio não encontrado"));

  const playPromise = music.play();

  if (playPromise && typeof playPromise.then === "function") {
    return playPromise.then(() => {
      isPlaying = true;
      setMusicButtonState();
    });
  }

  isPlaying = true;
  setMusicButtonState();
  return Promise.resolve();
}

function pauseMusic() {
  if (!music) return;
  music.pause();
  isPlaying = false;
  setMusicButtonState();
}

setMusicButtonState();

if (toggleBtn && music) {
  toggleBtn.addEventListener("click", () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic().catch((err) => {
        console.error("Erro ao reproduzir música:", err);
      });
    }
  });
}

/* MARQUEE */

const track = document.getElementById("marqueeTrack");
let offset = 0;

if (track) {
  track.innerHTML += track.innerHTML;

  function animate() {
    offset -= MARQUEE_SPEED;

    if (Math.abs(offset) >= track.scrollWidth / 2) {
      offset = 0;
    }

    track.style.transform = `translateX(${offset}px)`;
    requestAnimationFrame(animate);
  }

  animate();
}

/* AGENDA HEART FOLLOWING THE CURVE */

const agendaFlow = document.getElementById("agendaFlow");
const agendaPath = document.getElementById("agendaPath");
const agendaHeart = document.getElementById("agendaHeart");

function setupAgendaPath() {
  if (!agendaFlow || !agendaPath || !agendaHeart) return;

  const totalLength = agendaPath.getTotalLength();
  const svg = agendaPath.ownerSVGElement;
  const viewBoxHeight =
    svg && svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.height
      ? svg.viewBox.baseVal.height
      : 620;

  agendaPath.style.strokeDasharray = `${totalLength}`;
  agendaPath.style.strokeDashoffset = `${totalLength}`;

  function updateAgendaScrollAnimation() {
    const rect = agendaFlow.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const start = viewportHeight * 0.82;
    const end = -rect.height * 0.18;

    let progress = (start - rect.top) / (start - end);
    progress = Math.max(0, Math.min(1, progress));

    const draw = totalLength * (1 - progress);
    agendaPath.style.strokeDashoffset = `${draw}`;

    const point = agendaPath.getPointAtLength(totalLength * progress);
    agendaHeart.style.left = `${point.x}%`;
    agendaHeart.style.top = `${(point.y / viewBoxHeight) * 100}%`;
    agendaHeart.style.opacity = progress > 0.03 ? "1" : "0";
  }

  updateAgendaScrollAnimation();
  window.addEventListener("scroll", updateAgendaScrollAnimation, { passive: true });
  window.addEventListener("resize", updateAgendaScrollAnimation);
}

/* INTRO VIDEO + MUSIC + AOS */

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname);
  }

  window.scrollTo(0, 0);

  const overlay = document.getElementById("introOverlay");
  const trigger = document.getElementById("openInvite");
  const video = document.getElementById("introVideo");

  if (!overlay || !trigger || !video) return;

  let started = false;

  if (music) {
    try {
      music.load();
      music.volume = 0.18;
    } catch (e) {}
  }

  function unlockSite() {
    overlay.classList.add("is-hidden");
    document.body.classList.add("invite-open");
    document.body.style.overflow = "auto";
    window.scrollTo(0, 0);

    if (window.AOS) {
      AOS.refreshHard();
    }
  }

  function startMusicWithFade() {
    if (!music) return;

    try {
      music.currentTime = 0;
      music.volume = 0.18;
    } catch (e) {}

    const playPromise = music.play();

    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          isPlaying = true;
          setMusicButtonState();

          let current = 0.18;
          const target = 0.6;
          const step = 0.06;

          const fade = setInterval(() => {
            try {
              current = Math.min(current + step, target);
              music.volume = current;

              if (current >= target) {
                clearInterval(fade);
              }
            } catch (e) {
              clearInterval(fade);
            }
          }, 120);
        })
        .catch((err) => {
          console.error("Erro ao iniciar música:", err);
          isPlaying = false;
          setMusicButtonState();
        });
    }
  }

  video.addEventListener("loadedmetadata", () => {
    try {
      video.currentTime = 0;
    } catch (e) {}
  });

  async function startIntro() {
    if (started) return;
    started = true;

    overlay.classList.add("is-playing");
    startMusicWithFade();

    try {
      video.currentTime = 0;
    } catch (e) {}

    try {
      await video.play();
    } catch (e) {
      console.error("Erro ao iniciar vídeo:", e);
      unlockSite();
    }
  }

  trigger.addEventListener("click", startIntro);

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startIntro();
    }
  });

  video.addEventListener("ended", unlockSite);
  video.addEventListener("error", unlockSite);

  if (window.AOS) {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
      mirror: false
    });
  }

  setupAgendaPath();
});
