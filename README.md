VisionAI is a browser-based real-time object detection system built using HTML, CSS, JavaScript, Roboflow, and YOLO11.
It uses your webcam to detect electronic components such as resistors, capacitors, LEDs, transistors, microprocessors, heat sinks, memory chips, and more—directly in the browser, without installing any software.

This project demonstrates the integration of machine learning, computer vision, and web technologies to create a responsive, interactive, and user-friendly detection system.

Project Structure:

│── index.html          # Home page
│── detect.html         # Live detection page
│── about.html          # About & methodology page
│── style.css           # Full website styling
│── script.js           # Webcam + Roboflow inference logic
│── README.md           # You're reading this :)

| Technology     | Purpose                      |
| -------------- | ---------------------------- |
| **HTML5**      | Web structure                |
| **CSS3**       | UI styling & responsiveness  |
| **JavaScript** | Core logic + API integration |
| **WebRTC**     | Webcam streaming             |
| **Roboflow**   | ML model hosting & inference |
| **YOLO11**     | Object detection algorithm   |

 How It Works:

User opens the Detect page.

Browser requests webcam access (WebRTC).

Every frame is captured and sent to the Roboflow Inference API.

YOLO11 returns predictions:

class name

bounding box

confidence


👤 Author

Mohammed Suhaan Ahmed
Biomedical Engineering
Osmania University
Results are drawn on a canvas over the video feed.

Component info is rendered below the detection screen.
