/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const WEDDING_ISO = "2026-06-20T12:00:00+01:00";
const ADDRESS_TEXT = "Quinta do Pateo, Dois Portos - Torres Vedras";

// velocidade do marquee (px por frame)
const MARQUEE_SPEED = 0.55;


/* =========================================================
   COUNTDOWN
========================================================= */

const cdDays = document.getElementById("cdDays");
const cdHours = document.getElementById("cdHours");
const cdMinutes = document.getElementById("cdMinutes");
const cdSeconds = document.getElementById("cdSeconds");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function updateCountdown() {
  const target = new Date(WEDDING_ISO).getTime();
  const now = Date.now();
  let diff = target - now;

  if (diff <= 0) {
    cdDays.textContent = "0";
    cdHours.textContent = "00";
    cdMinutes.textContent = "00";
    cdSeconds.textContent = "00";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  cdDays.textContent = days;
  cdHours.textContent = pad2(hours);
  cdMinutes.textContent = pad2(minutes);
  cdSeconds.textContent = pad2(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);


/* =========================================================
   MARQUEE HERO (movimento contínuo)
========================================================= */

const track = document.getElementById("marqueeTrack");
let offset = 0;

// duplicar conteúdo para loop infinito
track.innerHTML += track.innerHTML;

function animateMarquee() {
  offset -= MARQUEE_SPEED;

  // quando passa metade, reinicia sem salto
  if (Math.abs(offset) >= track.scrollWidth / 2) {
    offset = 0;
  }

  track.style.transform = `translateX(${offset}px)`;
  requestAnimationFrame(animateMarquee);
}

animateMarquee();


/* =========================================================
   COPIAR MORADA
========================================================= */

const copyBtn = document.getElementById("copyAddress");
const copyHint = document.getElementById("copyHint");

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(ADDRESS_TEXT);
      copyHint.textContent = "Morada copiada ✅";
    } catch {
      const ta = document.createElement("textarea");
      ta.value = ADDRESS_TEXT;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      copyHint.textContent = "Morada copiada ✅";
    }

    setTimeout(() => {
      copyHint.textContent = "";
    }, 2500);
  });
}


/* =========================================================
   ADICIONAR AO CALENDÁRIO (.ics)
========================================================= */

const addToCalendarBtn = document.getElementById("addToCalendar");

function toICSDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) + "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) + "Z"
  );
}

if (addToCalendarBtn) {
  addToCalendarBtn.addEventListener("click", () => {
    const start = new Date(WEDDING_ISO);
    const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);

    const uid = `dmytro-viktoriya-${Date.now()}@invite`;

    const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DmytroViktoriya//Wedding Invite//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${toICSDate(new Date())}
DTSTART:${toICSDate(start)}
DTEND:${toICSDate(end)}
SUMMARY:Casamento — Dmytro & Viktoriya
LOCATION:${ADDRESS_TEXT}
DESCRIPTION:Quinta do Pateo, Dois Portos - Torres Vedras
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Dmytro-Viktoriya-Casamento.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  });
}
/* =========================
   INTRO ENVELOPE
========================= */

const openInvite = document.getElementById("openInvite");
const introOverlay = document.getElementById("introOverlay");
const envelope = document.querySelector(".envelope");

if (openInvite) {
  openInvite.addEventListener("click", () => {
    envelope.classList.add("open");

    setTimeout(() => {
      introOverlay.classList.add("is-hidden");
      document.body.style.overflow = "auto";
    }, 1400);
  });
}

