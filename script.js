const WEDDING_ISO="2026-06-20T12:00:00+01:00"
const MARQUEE_SPEED=.55


/* COUNTDOWN */

const cdDays=document.getElementById("cdDays")
const cdHours=document.getElementById("cdHours")
const cdMinutes=document.getElementById("cdMinutes")
const cdSeconds=document.getElementById("cdSeconds")

function pad(n){return String(n).padStart(2,"0")}

function updateCountdown(){

const target=new Date(WEDDING_ISO).getTime()
const now=Date.now()
let diff=target-now

if(diff<=0)return

const s=Math.floor(diff/1000)

const d=Math.floor(s/86400)
const h=Math.floor((s%86400)/3600)
const m=Math.floor((s%3600)/60)
const sec=s%60

cdDays.textContent=d
cdHours.textContent=pad(h)
cdMinutes.textContent=pad(m)
cdSeconds.textContent=pad(sec)

}

updateCountdown()
setInterval(updateCountdown,1000)


/* MARQUEE */

const track=document.getElementById("marqueeTrack")
let offset=0

track.innerHTML+=track.innerHTML

function animate(){

offset-=MARQUEE_SPEED

if(Math.abs(offset)>=track.scrollWidth/2){
offset=0
}

track.style.transform=`translateX(${offset}px)`

requestAnimationFrame(animate)

}

animate()


/* INTRO VIDEO */

document.addEventListener("DOMContentLoaded",()=>{

const overlay=document.getElementById("introOverlay")
const trigger=document.getElementById("openInvite")
const video=document.getElementById("introVideo")

trigger.addEventListener("click",async()=>{

overlay.classList.add("is-playing")

try{
await video.play()
}catch(e){
overlay.classList.add("is-hidden")
document.body.style.overflow="auto"
}

})

video.addEventListener("ended",()=>{

overlay.classList.add("is-hidden")
document.body.style.overflow="auto"

})

})
