const fs = require('fs');
const ipc = require('electron').ipcRenderer;

window.onload = document.getElementById("name").onkeyup = function(e) 
{   
    if (e.key !== 'Enter'){
        getValue();
        writeValue();
    }
    else{
        closeWindow()
    }
};

let nickname = '';

function getValue() {
    nickname = document.getElementById("name");
}

function writeValue(){
    fs.writeFile('./profile.txt', nickname.value, err => {
        if (err) {
            console.log('Cant write to file');
        } else {
            console.log('File was created')
        }
    });
}

function closeWindow()
{
    window.close()
}