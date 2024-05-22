const fs = require('fs');

window.onload = document.getElementById("name").onkeyup = function(e) 
{   
    if (e.key !== 'Enter'){
        getValue()
    }
    else{
        writeValue()
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
    closeWindow()
}

function closeWindow()
{
    window.close()
}