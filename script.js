if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const WEDDING_ISO = "2026-06-20T12:00:00+01:00";
const MARQUEE_SPEED = 0.5;

/* COUNTDOWN */

const cdDays = document.getElementById("cdDays");
const cdHours = document.getElementById("cdHours");
const cdMinutes = document.getElementById("cdMinutes");
const cdSeconds = document.getElementById("cdSeconds");

function pad(n) {
  return String(n).padStart(2, "0");
}

const music = document.getElementById("bgMusic");
const toggleBtn = document.getElementById("musicToggle");

let isPlaying = false;

toggleBtn.addEventListener("click", () => {
  if (isPlaying) {
    music.pause();
    toggleBtn.textContent = "Reproduzir música";
  } else {
    music.play();
    toggleBtn.textContent = "Pausar música";
  }

  isPlaying = !isPlaying;
});

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

/* INTRO VIDEO + MUSIC */

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname);
  }

  window.scrollTo(0, 0);

  const overlay = document.getElementById("introOverlay");
  const trigger = document.getElementById("openInvite");
  const video = document.getElementById("introVideo");
  const music = document.getElementById("bgMusic");

  if (!overlay || !trigger || !video) return;

  let started = false;

  function unlockSite() {
    overlay.classList.add("is-hidden");
    document.body.classList.add("invite-open");
    document.body.style.overflow = "auto";
    window.scrollTo(0, 0);
  }

  function startMusicWithFade() {
    if (!music) return;

    try {
      music.currentTime = 0;
    } catch (e) {}

    try {
      music.volume = 0.01;
    } catch (e) {}

    const playPromise = music.play();

    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          let current = 0.01;
          const target = 0.6;
          const step = 0.04;

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
          }, 180);
        })
        .catch((err) => {
          console.error("Erro ao iniciar música:", err);
        });
    }
  }

  video.addEventListener("loadeddata", () => {
    try {
      video.currentTime = 0.01;
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
});
