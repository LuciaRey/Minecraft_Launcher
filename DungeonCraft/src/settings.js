const fs = require("fs");
const ipc = require("electron").ipcRenderer;

fs.stat("./launcher_data", function (error, stats) {
  fs.readFile("./launcher_data", "utf8", function (err, buffer) {
    if (err) {
      console.log("Cant read launcher_data");
    } else {
      buffer = buffer.split(" ");
      var data = buffer[2].toString("utf8");
      const p = document.getElementById("p");
      p.innerHTML += data;
    }
  });
});

fs.stat("./java_args", function (error, stats) {
  fs.open("./java_args", "r", function (error, fd) {
    var buffer = new Buffer.alloc(stats.size);
    fs.read(
      fd,
      buffer,
      0,
      buffer.length,
      null,
      function (error, bytesRead, buffer) {
        var data = buffer.toString("utf8");
        const input = document.getElementById("javaargs");
        input.value = data;
      }
    );
  });
});

function changeName() {
  ipc.send("changeName", "");
}

window.onclick = document.getElementById("javaargs").onkeyup = function (e) {
  getValue();
  writeValue();
};

let javaargs = "";

function getValue() {
  javaargs = document.getElementById("javaargs");
}

function writeValue() {
  fs.writeFile("./java_args", javaargs.value, (err) => {
    if (err) {
      console.log("Cant write to file");
    } else {
      console.log("File was changed");
    }
  });
}

document.getElementById("close-button").addEventListener("click", (event) => {
  ipc.send("window_actions", ["close", 2]);
});
