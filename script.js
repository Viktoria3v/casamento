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
  const overlay = document.getElementById("introOverlay");
  const trigger = document.getElementById("openInvite");
  const video = document.getElementById("introVideo");
  const music = document.getElementById("bgMusic");

  if (!overlay || !trigger || !video) return;

  let started = false;
  let musicStarted = false;

  function fadeInMusic() {
    if (!music || musicStarted) return;
    musicStarted = true;

    try {
      music.currentTime = 0;
      music.volume = 0;

      const playPromise = music.play();

      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            let v = 0;
            const targetVolume = 0.6;
            const step = 0.03;
            const interval = 120;

            const fade = setInterval(() => {
              v += step;
              music.volume = Math.min(v, targetVolume);

              if (v >= targetVolume) {
                clearInterval(fade);
              }
            }, interval);
          })
          .catch(() => {
            // ignore
          });
      }
    } catch (e) {
      // ignore
    }
  }

  function unlockSite() {
    overlay.classList.add("is-hidden");
    document.body.classList.add("invite-open");
    document.body.style.overflow = "auto";
  }

  video.addEventListener("loadeddata", () => {
    try {
      video.currentTime = 0.01;
    } catch (e) {
      // fallback para o poster
    }
  });

  async function startIntro() {
    if (started) return;
    started = true;

    overlay.classList.add("is-playing");

    fadeInMusic();

    try {
      video.currentTime = 0;
      await video.play();
    } catch (e) {
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
