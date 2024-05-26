const fs = require('fs');
const ipc = require('electron').ipcRenderer;

window.onclick = document.getElementById("name").onkeyup = function(e) 
{   
    getValue();
};

window.onclick = document.getElementById("password").onkeyup = function(e) 
{   
    if (e.key !== 'Enter'){
        getValue();
    }
    else{
        auth();
    }
};

let nickname = '';
let password = '';
function getValue() {
    nickname = document.getElementById("name");
    password = document.getElementById("password");
}

function auth() {
    fetch('https://authserver.ely.by/api/users/profiles/minecraft/' + nickname.value)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log('Request succeeded with JSON response', data);

            let user = {
                username: (nickname.value).toString(),
                password: (password.value).toString(),
                clientToken: "UeNGguZrQNAnpJPXkTVyHifTyncOUv",
              };

            fetch('https://authserver.ely.by/auth/authenticate', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                  },
                body: JSON.stringify(user),
            })
            .then((response) => response.json())
            .then((data) => {
                    writeValue('launcher_data', data.selectedProfile.id + ' ' + data.accessToken);
                    writeValue('profile.txt', nickname.value);
                    closeWindow();
                }
            )
            .catch(function(error) {
                console.log('Request failed', error);
                ipc.send('error', 'пароль');
            });
        })
        .catch(function(error) {
            console.log('Request failed', error);
            ipc.send('error', 'ник');
        });

        
}

function writeValue(file, data){
    fs.writeFile('./' + file, data, err => {
        if (err) {
            console.log('Cant write to file');
        } else {
            console.log('File was created');
        }
    });
}

function closeWindow()
{
    if (nickname.value !== ''){
        ipc.send('close_window', 3)
    }
}