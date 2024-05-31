const ipc = require("electron").ipcRenderer;

document.getElementById("close-button").addEventListener("click", (event) => {
  ipc.send("window_actions", ["close", 6]);
});

const progressBar = document.getElementById("progress-fill");
let currentProgress = 0;
const maxProgress = 100;

// Function to update the progress bar
function updateProgressBar(newProgress) {
  // Limit progress to maxProgress
  currentProgress = Math.min(newProgress, maxProgress);

  progressBar.style.width = `${currentProgress}%`;
}

// Function to start the pulsing animation
function startPulsingAnimation() {
  progressBar.style.animation = "pulse 1.5s ease-in-out infinite";
}

// Function to stop the pulsing animation
function stopPulsingAnimation() {
  progressBar.style.animation = "none";
}

// ... Your download progress tracking code from previous examples ...

// Example using node-downloader-helper:

// Let's assume you have a downloader variable 'dl' from your previous code
// and you are downloading a file 'x'

// Start the pulsing animation when the download starts

startPulsingAnimation();

// Stop pulsing animation and show 100% progress when download is complete
