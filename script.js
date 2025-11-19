const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const API_KEY = "rl4raGRK85cElw7CtZQI";
const MODEL_ID = "my-first-project-lmqc4/5";

// Start camera
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

// Call Roboflow API
async function detectFrame() {
  const response = await fetch(
    `https://detect.roboflow.com/${MODEL_ID}?api_key=${API_KEY}`,
    {
      method: "POST",
      body: video
    }
  );

  const result = await response.json();

  // Clear previous
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw boxes
  result.predictions.forEach(pred => {
    const { x, y, width, height, class: label } = pred;

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);

    ctx.fillStyle = "lime";
    ctx.font = "18px Arial";
    ctx.fillText(label, x - width / 2, y - height / 2 - 5);
  });

  requestAnimationFrame(detectFrame);
}

// Run
startCamera().then(() => {
  video.addEventListener("playing", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    detectFrame();
  });
});
