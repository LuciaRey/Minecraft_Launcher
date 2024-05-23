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
  
    windowName.loadURL(url);
  
    windowName.webContents.openDevTools();
  
    windowName.show()
  };

const fs = require('fs');

const authorization = () =>
  {
    let authWindow = 'authWindow';

    createNewWindow(authWindow, 400, 300, `file://${__dirname}/auth.html`)
  }

function writeValue(path, value)
{
  fs.writeFile(path, value, err => {
      if (err) {
        console.log('Cant write to file ' + path);
        throw err;
      } else {
        console.log('File was created')
      }
    });
}
  

fs.readdir('./', (err, files) => {
  if (err) throw err;
  else {
   if (files.includes('profile.txt')) 
    {
      fs.readFile('./profile.txt', 'utf8', function(err, data){
        if(err) { 
          console.log('Cant read profile'); 
          }else { 
            console.log(data);
          } 
      });
    }
    else
    {
      authorization()
    }
    if (files.includes("minecraft_path.txt")) 
      {
        fs.readFile('./minecraft_path.txt', 'utf8', function(err, data){
          if(err) { 
            console.log('Cant read minecraft path'); 
            }else { 
              console.log(data);
            } 
        });
      }
      else 
      {
        var path = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")
 
        writeValue('./minecraft_path.txt', path /*+ "/.dungeoncraft" */);
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


function giveMeFiles (dir, basedir, files){
  files = files || [];
    var allFiles = fs.readdirSync(dir);
    for (var i =0; i<allFiles.length; i++){
        var name = dir + '/' + allFiles[i];
        var filename = basedir + allFiles[i];
        if (fs.statSync(name).isDirectory()){
            giveMeFiles (name, basedir + allFiles[i] + "/", files);
        } else {
            files.push(filename);
        }
    }
    return files;
  };




function getUncommonElements(a, b) {

  var res = []

  for (var x of a) {
    if (!(b.toString().includes(x)))  {
      res.push(x)
    }
  }
  
  return res
}

function callback(err) {
  if (err) throw err;
}

var minecraft_path;

import { copyFile, constants } from 'fs';

function copyDir(x, dest_path) 
{
  let basedir = "/";

  if (x.length > 1)
  {
    for (let i = 0; i <= x.length - 2; i++)
      {
        if (!fs.existsSync(dest_path + basedir  + x[i]))
          {
            fs.mkdirSync(dest_path + basedir  + x[i]);
          }
        basedir += x[i] + "/";
      }
  }
};

fs.stat("./minecraft_path.txt", function (error, stats) {
  fs.open("./minecraft_path.txt", "r", function (error, fd) {
      var buffer = new Buffer.alloc(stats.size);
      fs.read(fd, buffer, 0, buffer.length,
          null, function (error, bytesRead, buffer) {
              minecraft_path = buffer.toString("utf8");
              if (!fs.existsSync(minecraft_path  + "\\.dungeoncraft")){
                fs.mkdirSync(minecraft_path  + "\\.dungeoncraft");
              }

              let server_path = "D:\\Documents\\Github/LuciaRey.github.io";
              let dest_path = minecraft_path + "\\test\\LuciaRey.github.io"

              let a = giveMeFiles (server_path, "/", '');
              let b = giveMeFiles (dest_path, "/", '');

              if (a !== b) 
                {
                  let res = getUncommonElements(a, b);

                  for (var x of res) {
                    let y = x.split('/');
                    y.shift();
                    copyDir(y, dest_path);
                    if (!fs.existsSync(dest_path + x)){
                      copyFile(server_path + x, dest_path + x, callback);
                      console.log(x + ' was copied');
                    }
                  }
                };         

              server_path = "D:\\Documents\\Github/test/.dungeoncraft/mods";
              dest_path = minecraft_path  + "/.dungeoncraft/mods"

              a = giveMeFiles (server_path, '');
              b = giveMeFiles (dest_path, '');
              if (a != b){
                let res = getUncommonElements(b, a);
                for (var x of res) {
                    let y = x.split('/');
                    y.shift();
                    fs.remove(dest_path + x, callback);
                    console.log(x + ' was deleted');
                }
              }   
        });
  });
});