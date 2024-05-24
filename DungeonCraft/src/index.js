import { app, BrowserWindow } from 'electron';

const fs = require('fs');
const extract = require('extract-zip');
const ipcMain = require('electron').ipcMain;
const { DownloaderHelper } = require('node-downloader-helper');


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = 'mainWindow';

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 710,
    height: 400,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
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
      titleBarStyle: 'hidden',
      webPreferences: {
        nodeIntegration: true
      }
    });
  
    windowName.loadURL(url);
  
    //windowName.webContents.openDevTools();
  
    windowName.show()
  };

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
  
if (fs.existsSync("./profile.txt")){
  fs.readFile('./profile.txt', 'utf8', function(err, data){
    if(err) { 
      console.log('Cant read profile'); 
      }else { 
        //console.log(data);
      } 
  });
}
else
{
  authorization();
}

ipcMain.on('settings', (event, arg) => {
  let settingsWindow = 'settingsWindow';
  mainWindow.onload = createNewWindow(settingsWindow, 710, 403, `file://${__dirname}/settings.html`);
});

ipcMain.on('changeName', (event, arg) => {
  authorization();
});

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

  var res = [];

  for (var x of a) {
    if (!(b.toString().includes(x)) && (x.toString().includes("mods") || x.toString().includes("profile.json")))  {
      res.push(x);
    }
  }
  
  return res;
}

function callback(err) {
  if (err) throw err;
}

var appdata_path = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
var minecraft_path = appdata_path + "/.dungeoncraft/dungeoncraft";
var java_path = appdata_path + "/.dungeoncraft/java";

function createDir(x, dest_path) 
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

function verifyFiles(src_path, dest_path, server_url){

  fs.readFile(src_path, 'utf8', (err, filesOnServer) => {
    if (err) {
      console.error(err);
      return;
    }
    
    
    filesOnServer = filesOnServer.split(',');
    let filesOnClient = giveMeFiles (dest_path, "/", '');

    if (filesOnServer !== filesOnClient) 
    {
      let res = getUncommonElements(filesOnServer, filesOnClient);

      if (res.length !== 0) {
        for (var x of res)
          {
            let y = x.split('/');
            y.shift();
            createDir(y, dest_path);
  
            if (y.length > 1) {
              console.log(y);
              y.pop();
              console.log(y + "\t" + y.length);
              if (y.length > 1) {
                y = '/' + y.join('/');
              }
              else { y = '/' + y; }
            }
            else { y = ''; }
  
            const dl = new DownloaderHelper(server_url + x, dest_path + y);
  
            console.log("Скачивание файла " + x);
  
            dl.on('end', () => {
              });
  
            dl.on('error', (err) => console.log('Download Failed' + x, err));
            dl.start().catch(err => {
              console.error(err)
              console.log('Download error' + x)
            });
          }
      }
    };   
  
    let serverMods = [];
    for (var x of filesOnServer) {
      if (x.includes('mods')) { serverMods.push(x) }
    }

    dest_path += "/mods";

    //a = giveMeFiles (src_path, '');
    filesOnClient = giveMeFiles (dest_path, '');
    if (serverMods != filesOnClient){
      let res = getUncommonElements(filesOnClient, serverMods);
      for (var x of res) {
        let y = x.split('/');
        y.shift();
        fs.unlink(dest_path + "/" + x, (err) => {
          if (err) throw err;
        }); 
        console.log(x + ' was deleted');
      }
    }
  });
}

async function unzipFiles(dest_path)
{
  try {
    await extract(dest_path + "/jdk-17_windows-x64_bin.zip", { dir: dest_path })
    console.log('Extraction jdk-17_windows-x64_bin.zip complete');
    fs.unlinkSync(dest_path + "/jdk-17_windows-x64_bin.zip");
  } catch (err) {
    // handle any errors
  }

}

if (!fs.existsSync(appdata_path + "/.dungeoncraft")) {
  fs.mkdirSync(appdata_path + "/.dungeoncraft");
}

if (!fs.existsSync(minecraft_path)) {
  fs.mkdirSync(minecraft_path);
}

if (!fs.existsSync(java_path)) {
  fs.mkdirSync(java_path);
}

if (!fs.existsSync(java_path + "/jdk-17.0.11")) {
  if(!fs.existsSync(java_path + "/jdk-17_windows-x64_bin.zip")) {
    const dl = new DownloaderHelper("https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.zip", java_path);
  
    dl.on('end', () => {
      console.log('Download jdk-17_windows-x64_bin.zip complete');
      unzipFiles(java_path);
  
    });
  
    dl.on('error', (err) => console.log('Download jdk-17_windows-x64_bin.zip Failed' , err));
    dl.start().catch(err => console.error(err));
  } else {
    unzipFiles(java_path);
  }
}

/*
Создание server.txt

let serversrc_path = "D:/Documents/GitHub/LuciaRey.github.io/dungeoncraft";

let files = giveMeFiles(serversrc_path, '/');

let serverfiles = [];

for (var x of files)
  {
    if (x.includes('profile.json') || x.includes('datapacks') || x.includes('mods')) 
      {
        serverfiles.push(x);
      }
  }

fs.writeFileSync("D:/Documents/GitHub/LuciaRey.github.io/dungeoncraft/server.txt", files);
*/

ipcMain.on('launch', (event, arg) => {
  const launch = () => {
    let server_url = "https://luciarey.github.io/dungeoncraft";

    if (fs.existsSync(minecraft_path + "/server.txt")) { fs.unlinkSync(minecraft_path + "/server.txt"); }

    const dl = new DownloaderHelper(server_url + "/server.txt", minecraft_path);

    dl.on('end', () => {
  
      let servertxt_path = minecraft_path + '/server.txt';
      verifyFiles(servertxt_path, minecraft_path, server_url);
    });

    dl.on('error', (err) => console.log('Download server.txt Failed' , err));
    dl.start().catch(err => console.error(err));
  }
});


//  https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.zip  <-- java 17 installation

