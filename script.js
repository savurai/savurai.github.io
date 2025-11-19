// ----------------------------
// VisionAI Web Detector
// Using Roboflow Hosted Web Inference
// ----------------------------

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const infoBox = document.getElementById("component-info");

// Your model details
const API_KEY = "rl4raGRK85cElw7CtZQI";
const MODEL_ID = "my-first-project-lmqc4/5";

// Mapping classes → descriptions
const componentDescriptions = {
  "resistor": "A resistor limits the flow of electrical current in a circuit.",
  "LED": "A Light Emitting Diode that glows when current passes through it.",
  "capacitor": "A capacitor stores and releases electrical energy.",
  "electrolytic-capacitor": "A polarized capacitor used for higher-capacitance applications.",
  "microprocessor": "A miniature CPU used to execute instructions and process data.",
  "microchip": "A small semiconductor device containing integrated circuits.",
  "memory-chip": "Used to store digital data temporarily or permanently.",
  "transistor": "A transistor amplifies or switches electronic signals.",
  "junction-transistor": "A transistor that uses a PN junction for switching or amplification.",
  "PNP-transistor": "A bipolar transistor used for switching and amplification.",
  "semiconductor-diode": "A diode allows current to flow in only one direction.",
  "electric-relay": "An electromechanical switch used to control circuits.",
  "heat-sink": "A component that dissipates heat from electronics.",
  "pulse-generator": "Produces electronic pulses for timing and control.",
  "attenuator": "Reduces signal strength without distortion.",
  "induction-coil": "Generates high-voltage pulses from low-voltage sources."
};

// ----------------------------
// Start Webcam
// ----------------------------
async function startWebcam() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  });

  video.srcObject = stream;

  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    detectLoop();
  };
}

startWebcam();

// ----------------------------
// Roboflow Inference Function
// ----------------------------
async function inferFrame() {
  const img = canvas.toDataURL("image/jpeg");

  const response = await fetch(
    `https://detect.roboflow.com/${MODEL_ID}?api_key=${API_KEY}`,
    {
      method: "POST",
      body: img.replace("data:image/jpeg;base64,", ""),
    }
  );

  return response.json();
}

// ----------------------------
// Detection Loop
// ----------------------------
async function detectLoop() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    const predictions = await inferFrame();
    drawBoxes(predictions.predictions);
    updateInfo(predictions.predictions);
  } catch (err) {
    console.error("Error:", err);
  }

  requestAnimationFrame(detectLoop);
}

// ----------------------------
// Draw Bounding Boxes
// ----------------------------
function drawBoxes(preds) {
  preds.forEach((p) => {
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);

    ctx.fillStyle = "#00ffcc";
    ctx.font = "18px Poppins";
    ctx.fillText(
      `${p.class} (${(p.confidence * 100).toFixed(1)}%)`,
      p.x - p.width / 2,
      p.y - p.height / 2 - 5
    );
  });
}

// ----------------------------
// Update Component Info
// ----------------------------
function updateInfo(preds) {
  if (preds.length === 0) {
    infoBox.innerHTML = "<p>No component detected.</p>";
    return;
  }

  const top = preds[0];
  const desc = componentDescriptions[top.class] || "No description available.";

  infoBox.innerHTML = `
    <h2>Detected Component: ${top.class}</h2>
    <p><strong>Confidence:</strong> ${(top.confidence * 100).toFixed(1)}%</p>
    <p>${desc}</p>
  `;
}
