const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const output = document.getElementById("component-output");

// Your Roboflow Model Details
const API_KEY = "rl4raGRK85cElw7CtZQI";
const MODEL_ID = "my-first-project-lmqc4/5";

// Component Information Dictionary
const COMPONENT_DETAILS = {
    "resistor": {
        img: "images/resistor.jpg",
        text: "A resistor limits current flow. It is used to protect circuits, divide voltage, and control signal levels."
    },
    "capacitor": {
        img: "images/capacitor.jpg",
        text: "Capacitors store electrical energy temporarily. Commonly used for filtering, timing, and energy buffering."
    },
    "transistor": {
        img: "images/transistor.jpg",
        text: "A transistor amplifies or switches electronic signals. It’s the fundamental building block of modern electronics."
    },
    "led": {
        img: "images/led.jpg",
        text: "LEDs emit light when current passes through them. They are energy efficient and used in indicators and displays."
    },
    "microprocessor": {
        img: "images/microprocessor.jpg",
        text: "A microprocessor is the brain of a computer system — executing instructions and managing logic operations."
    },
    "pulse_generator": {
        img: "images/pulse_generator.jpg",
        text: "Pulse generators produce electrical waveforms used for testing, clock signals, and triggering events."
    },
    "heatsink": {
        img: "images/heatsink.jpg",
        text: "A heatsink dissipates heat from components like processors and power transistors to prevent overheating."
    }
};

// Start Webcam
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    return new Promise(resolve => {
        video.onloadedmetadata = () => resolve(video);
    });
}

// Call Roboflow API for inference
async function detectFrame() {
    const modelURL = `https://detect.roboflow.com/${MODEL_ID}?api_key=${API_KEY}`;
    
    const offscreen = document.createElement("canvas");
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const offCtx = offscreen.getContext("2d");
    offCtx.drawImage(video, 0, 0);

    const imgData = offscreen.toDataURL("image/jpeg").split(",")[1];

    const response = await fetch(modelURL, {
        method: "POST",
        body: imgData
    });

    const result = await response.json();
    drawDetections(result);
    requestAnimationFrame(detectFrame);
}

// Draw boxes & update info panel
function drawDetections(result) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0);

    if (!result?.predictions?.length) {
        output.innerHTML = "<p>No component detected...</p>";
        return;
    }

    const obj = result.predictions[0];
    const { x, y, width, height, class: label, confidence } = obj;

    // Draw bounding box
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);

    ctx.fillStyle = "#00ff88";
    ctx.font = "18px Poppins";
    ctx.fillText(`${label} (${(confidence * 100).toFixed(1)}%)`, x - width / 2, y - height / 2 - 10);

    // Update information panel
    const info = COMPONENT_DETAILS[label.toLowerCase()];
    if (info) {
        output.innerHTML = `
            <img src="${info.img}" alt="${label}">
            <h3>${label.toUpperCase()}</h3>
            <p><strong>Confidence:</strong> ${(confidence * 100).toFixed(1)}%</p>
            <p>${info.text}</p>
        `;
    } else {
        output.innerHTML = `
            <h3>${label.toUpperCase()}</h3>
            <p>Confidence: ${(confidence * 100).toFixed(1)}%</p>
            <p>No additional information available.</p>
        `;
    }
}

// Start App
setupCamera().then(() => {
    detectFrame();
});
