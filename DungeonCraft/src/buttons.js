const ipc = require('electron').ipcRenderer;

window.addEventListener('load', function () {
    var preloader = document.getElementById('preloader');
    preloader.style.display = 'none';
  });

document.getElementById('close-button').addEventListener("click", event => {
    ipc.send('close_window', 1)
});


function settings () {
    ipc.send('settings', '');
}

function launch () {
    ipc.send('launch', '');
}

