const ipc = require('electron').ipcRenderer;

function settings () {
    ipc.send('settings', '');
}
