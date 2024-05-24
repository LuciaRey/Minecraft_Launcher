const ipc = require('electron').ipcRenderer;

window.addEventListener('load', function () {
    var preloader = document.getElementById('preloader');
    preloader.style.display = 'none';
  });

function settings () {
    ipc.send('settings', '');
}

function launch () {
    ipc.send('launch', '');
}

