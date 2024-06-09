window.onclick = document.getElementById("name").onkeyup = function (e) {
  getValue();
};

window.onclick = document.getElementById("password").onkeyup = function (e) {
  if (e.key !== "Enter") {
    getValue();
  } else {
    auth();
  }
};

let nickname = "";
let password = "";
function getValue() {
  nickname = document.getElementById("name");
  password = document.getElementById("password");
}

async function auth() {
  let tokens = await window.electronAPI.getSettings("tokens");
  fetch(
    "https://authserver.ely.by/api/users/profiles/minecraft/" + nickname.value
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      console.log("Request succeeded with JSON response", data);

      let user = {
        username: nickname.value.toString(),
        password: password.value.toString(),
        clientToken: tokens.clientToken,
      };

      fetch("https://authserver.ely.by/auth/authenticate", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(user),
      })
        .then((response) => response.json())
        .then((data) => {
          let user = {
            uuid: data.selectedProfile.id,
            accessToken: data.accessToken,
            nickname: nickname.value,
          };
          window.electronAPI.changeSettings(user);
          window.electronAPI.closeWindow();
        })
        .catch(function (error) {
          console.log("Request failed", error);
          window.electronAPI.error("password");
        });
    })
    .catch(function (error) {
      console.log("Request failed", error);
      window.electronAPI.error("nickname");
    });
}
