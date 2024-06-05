const ipc = require("electron").ipcRenderer;

document.getElementById("close-button").addEventListener("click", (event) => {
  ipc.send("window_actions", ["close", 6]);
});

ipc.on("logs", (event, message) => {
  console.log(message);
});
