/* VisionAI script.js
   Uses Roboflow hosted detect api.
   IMPORTANT: This file contains your API key and model id configured below.
*/

const API_KEY = "rl4raGRK85cElw7CtZQI";
const MODEL_ID = "my-first-project-lmqc4/5";

// Component info database (friendly descriptions)
const COMPONENT_INFO = {
  "resistors": {
    title: "Resistor",
    category: "Passive component",
    description: "Limits current flow and divides voltage in circuits. Common in various packages (axial, SMD).",
    usage: "Use to control current and create voltage dividers. Check color bands or code for resistance value.",
    safety: "Power dissipation may generate heat; ensure rating is not exceeded."
  },
  "pulse generators": {
    title: "Pulse Generator",
    category: "Test equipment",
    description: "Generates precise electrical pulses for testing circuits and timing.",
    usage: "Used for signal injection, clock simulation and timing tests.",
    safety: "Avoid connecting to sensitive inputs without proper coupling; observe voltage limits."
  },
  "microprocessors": {
    title: "Microprocessor",
    category: "Integrated circuit",
    description: "Central processing unit for embedded systems and boards.",
    usage: "Used as the main CPU on development boards and custom electronics.",
    safety: "Handle with ESD precautions; ensure correct power sequencing."
  },
  "transistors": {
    title: "Transistor",
    category: "Active semiconductor",
    description: "Functions as a switch or amplifier (BJT, MOSFET types).",
    usage: "Use for switching loads or amplifying signals; check pinout before connecting.",
    safety: "May require heat-sinking at high power; follow polarity."
  },
  "LED": {
    title: "LED (Light Emitting Diode)",
    category: "Optoelectronic",
    description: "Emits light when current passes through. Comes in many colors and sizes.",
    usage: "Indicator lights, displays, optocouplers.",
    safety: "Use current-limiting resistor to prevent damage."
  },
  "capacitors": {
    title: "Capacitor",
    category: "Passive component",
    description: "Stores and releases electrical energy, used in filtering and timing.",
    usage: "Decoupling, filtering, timing circuits. Check polarity for electrolytic types.",
    safety: "Electrolytic capacitors are polarized; observe voltage ratings."
  },
  "heatsink": {
    title: "Heatsink",
    category: "Thermal hardware",
    description: "Dissipates heat from power components (CPU, regulators).",
    usage: "Attach to hot components with thermal paste or pads to improve cooling.",
    safety: "Ensure secure mounting and adequate airflow."
  }
};

// DOM elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const infoCard = document.getElementById("infoCard");
const infoContent = document.getElementById("infoContent");
const thresh = document.getElementById("thresh");
const threshVal = document.getElementById("threshVal");
const toggleBoxes = document.getElementById("toggleBoxes");
const fpsElem = document.getElementById("fps");

// state
let lastTs = performance.now();
let frames = 0;
let lastFPS = "--";
let running = true;
let lastDetections = [];
let inferenceDelay = 250; // ms between requests
let lastRequest = 0;

// set initial UI
thresh.addEventListener("input", () => { threshVal.innerText = parseFloat(thresh.value).toFixed(2); });
threshVal.innerText = parseFloat(thresh.value).toFixed(2);

// start camera
async function startCamera(){
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio:false });
    video.srcObject = stream;
    await new Promise(res => video.onloadedmetadata = res);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    requestAnimationFrame(loop);
  } catch (e) {
    console.error("Camera error:", e);
    infoContent.innerHTML = `<p class="muted">Unable to access camera. Check permissions.</p>`;
  }
}

// convert current video frame to base64 JPEG string (no header)
function frameToBase64(){
  const tmp = document.createElement("canvas");
  tmp.width = video.videoWidth;
  tmp.height = video.videoHeight;
  tmp.getContext("2d").drawImage(video,0,0,tmp.width,tmp.height);
  return tmp.toDataURL("image/jpeg", 0.7).split(",")[1];
}

// draw boxes on canvas and update info panel
function draw(predictions){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(video,0,0,canvas.width,canvas.height);

  if(!predictions || predictions.length===0) return;

  // choose top prediction (highest confidence)
  const threshold = parseFloat(thresh.value);
  const valid = predictions.filter(p => p.confidence >= threshold);

  if(valid.length===0) {
    // show nothing
    updateInfo(null);
    return;
  }

  // sort by confidence
  valid.sort((a,b)=>b.confidence - a.confidence);

  // draw all boxes (if toggled)
  if(toggleBoxes.checked){
    valid.forEach(p=>{
      const left = p.x - p.width/2;
      const top = p.y - p.height/2;
      ctx.beginPath();
      ctx.lineWidth = Math.max(2, canvas.width/320);
      ctx.strokeStyle = "rgba(0,230,168,0.98)";
      ctx.strokeRect(left, top, p.width, p.height);

      // label bg
      const label = `${p.class} ${(p.confidence*100).toFixed(1)}%`;
      ctx.font = `${16 + Math.round(canvas.width/420)}px Inter, Arial`;
      const metrics = ctx.measureText(label);
      const pad = 6;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(left, top - (24), metrics.width + pad*2, 24);

      ctx.fillStyle = "#eafff6";
      ctx.fillText(label, left + pad, top - 18);
    });
  }

  // update info panel with top detection
  updateInfo(valid[0]);
}

// Update the right-hand info card with friendly text
function updateInfo(d){
  if(!d){
    infoContent.innerHTML = `<p class="muted">No component detected above the threshold.</p>`;
    return;
  }
  const key = d.class;
  const info = COMPONENT_INFO[key] || {
    title: key,
    category: "Unknown",
    description: "No extra information available.",
    usage: "",
    safety: ""
  };

  infoContent.innerHTML = `
    <h4 style="margin:6px 0 8px 0">${info.title}</h4>
    <div class="muted small">Category: ${info.category} • Confidence: ${(d.confidence*100).toFixed(1)}%</div>
    <p style="margin-top:12px">${info.description}</p>
    <p><strong>Common use:</strong> ${info.usage || "General component use."}</p>
    <p><strong>Notes:</strong> ${info.safety || "Handle with standard precautions."}</p>
  `;
}

// perform inference (throttled)
async function infer(){
  const now = performance.now();
  if(now - lastRequest < inferenceDelay) return null;
  lastRequest = now;

  // build POST body from frame
  const base64 = frameToBase64();

  try {
    // Roboflow detect endpoint accepts raw base64 body
    const res = await fetch(`https://detect.roboflow.com/${MODEL_ID}?api_key=${API_KEY}`, {
      method: "POST",
      body: base64
    });

    if(!res.ok){
      console.warn("Roboflow response not ok", res.status);
      return null;
    }
    const json = await res.json();
    return json;
  } catch (e) {
    console.error("Inference error", e);
    return null;
  }
}

// main loop: draw video and occasionally request inference
async function loop(ts){
  // FPS counter
  frames++;
  if(ts - lastTs >= 1000){
    lastFPS = frames;
    frames = 0;
    lastTs = ts;
    fpsElem.innerText = `FPS: ${lastFPS}`;
  }

  // always draw current video into canvas background
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(video,0,0,canvas.width,canvas.height);

  // call inference on schedule
  const result = await infer();
  if(result && result.predictions){
    lastDetections = result.predictions;
    draw(result.predictions);
  } else {
    // just draw video (already drawn) and clear info if none
    if(!result) updateInfo(null);
  }

  if(running) requestAnimationFrame(loop);
}

// initialize
startCamera();
