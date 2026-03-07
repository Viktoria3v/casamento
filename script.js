const track=document.getElementById("marqueeTrack")
let offset=0

track.innerHTML+=track.innerHTML

function animate(){

offset-=0.5

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

video.addEventListener("loadeddata",()=>{

try{
video.currentTime=0.01
}catch{}

})

trigger.addEventListener("click",async()=>{

overlay.classList.add("is-playing")

try{
await video.play()
}catch{
overlay.classList.add("is-hidden")
document.body.style.overflow="auto"
}

})

video.addEventListener("ended",()=>{

overlay.classList.add("is-hidden")
document.body.style.overflow="auto"

})

})
