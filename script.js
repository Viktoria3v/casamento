/* =========================
   CONFIG
========================= */

// Data do casamento (Portugal: fuso de Lisboa).
// Se quiseres contar para uma hora específica, troca 12:00 por a hora real.
const WEDDING_ISO = "2026-06-20T12:00:00+01:00";

// Morada (para copiar)
const ADDRESS_TEXT = "Quinta do Pateo, Dois Portos - Torres Vedras";

// Lista de imagens do hero (mete estes ficheiros em /assets)
const HERO_IMAGES = [
  "assets/hero-1.jpg",
  "assets/hero-2.jpg",
  "assets/hero-3.jpg",
  "assets/hero-4.jpg",
];

/* =========================
   NAV MOBILE
========================= */
const navToggle = document.getElementById("navToggle");
const mobileNav = document.getElementById("mobileNav");

navToggle?.addEventListener("click", () => {
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  mobileNav.hidden = expanded;
});

// Fechar menu ao clicar num link
mobileNav?.addEventListener("click", (e) => {
  if (e.target?.tagName === "A") {
    navToggle.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
  }
});

/* =========================
   COUNTDOWN
========================= */
const cdDays = document.getElementById("cdDays");
const cdHours = document.getElementById("cdHours");
const cdMinutes = document.getElementById("cdMinutes");
const cdSeconds = document.getElementById("cdSeconds");

function pad2(n){ return String(n).padStart(2, "0"); }

function updateCountdown(){
  const target = new Date(WEDDING_ISO).getTime();
  const now = Date.now();
  let diff = target - now;

  if (diff <= 0){
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

  cdDays.textContent = String(days);
  cdHours.textContent = pad2(hours);
  cdMinutes.textContent = pad2(minutes);
  cdSeconds.textContent = pad2(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* =========================
   HERO SLIDER (slide lateral)
========================= */
const track = document.getElementById("sliderTrack");
const dotsWrap = document.getElementById("dots");
const prevBtn = document.getElementById("prevSlide");
const nextBtn = document.getElementById("nextSlide");

let idx = 0;
let autoTimer = null;

function buildSlides(){
  track.innerHTML = "";
  dotsWrap.innerHTML = "";

  HERO_IMAGES.forEach((src, i) => {
    const slide = document.createElement("div");
    slide.className = "slide";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `Fotografia ${i+1}`;
    img.loading = i === 0 ? "eager" : "lazy";

    slide.appendChild(img);
    track.appendChild(slide);

    const dot = document.createElement("button");
    dot.className = "dot" + (i === 0 ? " is-active" : "");
    dot.type = "button";
    dot.setAttribute("aria-label", `Ir para foto ${i+1}`);
    dot.addEventListener("click", () => goTo(i, true));
    dotsWrap.appendChild(dot);
  });
}

function render(){
  track.style.transform = `translateX(-${idx * 100}%)`;
  [...dotsWrap.children].forEach((d, i) => {
    d.classList.toggle("is-active", i === idx);
  });
}

function goTo(nextIndex, userAction=false){
  const max = HERO_IMAGES.length - 1;
  idx = Math.max(0, Math.min(max, nextIndex));
  render();

  if (userAction) restartAuto();
}

function prev(){ goTo((idx - 1 + HERO_IMAGES.length) % HERO_IMAGES.length, true); }
function next(){ goTo((idx + 1) % HERO_IMAGES.length, true); }

prevBtn?.addEventListener("click", prev);
nextBtn?.addEventListener("click", next);

// Auto-play suave
function startAuto(){
  stopAuto();
  autoTimer = setInterval(() => {
    idx = (idx + 1) % HERO_IMAGES.length;
    render();
  }, 4500);
}
function stopAuto(){
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = null;
}
function restartAuto(){
  startAuto();
}

// Swipe no telemóvel
let startX = null;
track?.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
}, {passive:true});

track?.addEventListener("touchend", (e) => {
  if (startX === null) return;
  const endX = e.changedTouches[0].clientX;
  const delta = endX - startX;
  startX = null;

  if (Math.abs(delta) > 40){
    if (delta > 0) prev();
    else next();
  }
}, {passive:true});

// Pausar auto ao passar rato
const slider = document.getElementById("slider");
slider?.addEventListener("mouseenter", stopAuto);
slider?.addEventListener("mouseleave", startAuto);

buildSlides();
render();
if (HERO_IMAGES.length > 1) startAuto();

/* =========================
   COPY ADDRESS
========================= */
const copyBtn = document.getElementById("copyAddress");
const copyHint = document.getElementById("copyHint");

copyBtn?.addEventListener("click", async () => {
  try{
    await navigator.clipboard.writeText(ADDRESS_TEXT);
    copyHint.textContent = "Morada copiada ✅";
  }catch{
    // fallback simples
    const ta = document.createElement("textarea");
    ta.value = ADDRESS_TEXT;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    copyHint.textContent = "Morada copiada ✅";
  }
  setTimeout(() => copyHint.textContent = "", 2500);
});

/* =========================
   ADD TO CALENDAR (.ics)
========================= */
const addToCalendarBtn = document.getElementById("addToCalendar");

function toICSDate(d){
  // UTC format: YYYYMMDDTHHMMSSZ
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth()+1) +
    pad(d.getUTCDate()) + "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) + "Z"
  );
}

addToCalendarBtn?.addEventListener("click", () => {
  const start = new Date(WEDDING_ISO);
  // duração default 8h (ajusta quando souberem horários)
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

  const blob = new Blob([ics], {type:"text/calendar;charset=utf-8"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "Dmytro-Viktoriya-Casamento.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
});
