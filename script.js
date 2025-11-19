const API_KEY = "rl4raGRK85cElw7CtZQI";
const MODEL_ID = "my-first-project-lmqc4/5";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

async function startWebcam() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    detectLoop();
  };
}

async function detectLoop() {
  const inference = await fetch(
    `https://detect.roboflow.com/${MODEL_ID}?api_key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: await imageToBase64(video),
    }
  );

  const result = await inference.json();
  drawBoxes(result);
  requestAnimationFrame(detectLoop);
}

function drawBoxes(result) {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (!result.predictions) return;

  result.predictions.forEach(pred => {
    const x = pred.x - pred.width / 2;
    const y = pred.y - pred.height / 2;

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, pred.width, pred.height);

    ctx.fillStyle = "lime";
    ctx.font = "18px Arial";
    ctx.fillText(`${pred.class} (${(pred.confidence * 100).toFixed(1)}%)`, x, y - 10);
  });
}

function imageToBase64(video) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;

  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(video, 0, 0);

  return tempCanvas.toDataURL("image/jpeg").replace("data:image/jpeg;base64,", "");
}

startWebcam();
