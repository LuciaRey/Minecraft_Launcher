const fs = require('fs');
const ipc = require('electron').ipcRenderer;

fs.stat("./profile.txt", function (error, stats) {
    fs.open("./profile.txt", "r", function (error, fd) {
        var buffer = new Buffer.alloc(stats.size);
        fs.read(fd, buffer, 0, buffer.length,
            null, function (error, bytesRead, buffer) {
                var data = buffer.toString("utf8");
                const p = document.getElementById("p");
                p.innerHTML += data;
            });
    });
});

function changeName() {
    ipc.send('changeName', '');
}

window.onload = document.getElementById("javaargs").onkeyup = function(e) 
{   
    getValue();
    writeValue();
};

let javaargs = '';

function getValue() {
    javaargs = document.getElementById("javaargs");
}

function writeValue(){
    fs.writeFile('./javaargs.txt', javaargs.value, err => {
        if (err) {
            console.log('Cant write to file');
        } else {
            console.log('File was changed');
        }
    });
}
