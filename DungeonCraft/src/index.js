import { app, BrowserWindow } from 'electron';


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 710,
    height: 400,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const createNewWindow = (windowName, windWidth, windHeight, url) =>
  {
    windowName = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      width: windWidth,
      height: windHeight,
      webPreferences: {
        nodeIntegration: true
      }
    });
  
    // and load the index.html of the app.
    windowName.loadURL(url);
  
    // Open the DevTools.
    windowName.webContents.openDevTools();
  
    windowName.show()
  };

const fs = require('fs');

const authorization = () =>
  {
    let authWindow = 'authWindow';

    createNewWindow(authWindow, 400, 300, `file://${__dirname}/auth.html`)
  }

fs.readdir('./', (err, files) => {
  if (err) throw err;
  else {
   if (files.includes('profile.txt')) 
    {
      fs.readFile('./profile.txt', 'utf8', function(err, data){
        if(err) { 
          console.log('Cant read file'); 
          }else { 
            console.log(data);
          } 
      });
    }
    else
    {
      authorization()
    }
  }
});

const ipcMain = require('electron').ipcMain;

ipcMain.on('settings', (event, arg) => {
  let settingsWindow = 'settingsWindow';
  mainWindow.onload = createNewWindow(settingsWindow, 710, 403, `file://${__dirname}/settings.html`);
});

ipcMain.on('changeName', (event, arg) => {
  authorization();
});




const launch = () => 
{
  
};
  
