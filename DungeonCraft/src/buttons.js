const ipc = require('electron').ipcRenderer;

function settings () {
    ipc.send('settings', '');
}

function launch () {
    ipc.send('launch', '');
}

