const ipc = require("electron").ipcRenderer;

document.getElementById("close-button").addEventListener("click", (event) => {
  ipc.send("close_window", 4);
});
