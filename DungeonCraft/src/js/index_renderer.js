function settings() {
  window.electronAPI.settings();
}

function launch() {
  window.electronAPI.launch();
}

window.onbeforeunload = () => {
  window.electronAPI.closeApp();
};

async function refreshToken() {
  let tokens = await window.electronAPI.getSettings("tokens");

  fetch("https://authserver.ely.by/auth/refresh", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(tokens),
  })
    .then((response) => response.json())
    .then((data) => {
      tokens.accessToken = data.accessToken;
      window.electronAPI.changeSettings(tokens);
    });
}

refreshToken();
