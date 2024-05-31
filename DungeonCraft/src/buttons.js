const ipc = require("electron").ipcRenderer;
const fs = require("fs");

document.getElementById("close-button").addEventListener("click", (event) => {
  ipc.send("window_actions", ["close", 1]);
});

document.getElementById("min-button").addEventListener("click", (event) => {
  ipc.send("window_actions", ["minimize", 1]);
});

function settings() {
  ipc.send("settings", "");
}

function launch() {
  ipc.send("launch", "");
}

function writeValue(file, data) {
  fs.writeFile("./" + file, data, (err) => {
    if (err) {
      console.log("Cant write to file");
    } else {
      console.log("File was created");
    }
  });
}

function refreshToken() {
  if (fs.existsSync("./launcher_data")) {
    fs.readFile("./launcher_data", "utf8", function (err, buffer) {
      if (err) {
        console.log("Cant read profile");
      } else {
        if (buffer !== "") {
          buffer = buffer.split(" ");
          let user = {
            accessToken: buffer[1],
            clientToken: "UeNGguZrQNAnpJPXkTVyHifTyncOUv",
          };

          fetch("https://authserver.ely.by/auth/refresh", {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            // Тело запроса в JSON-формате
            body: JSON.stringify(user),
          })
            .then((response) => response.json())
            .then((data) => {
              buffer[1] = data.accessToken;
              buffer = buffer.join(" ");
              writeValue("launcher_data", buffer);
            });
        }
      }
    });
  }
}

refreshToken();
