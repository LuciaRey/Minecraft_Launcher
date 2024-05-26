import { app, BrowserWindow } from 'electron';

const fs = require('fs');
const extract = require('extract-zip');
const ipcMain = require('electron').ipcMain;
const { nativeTheme } = require('electron')
const { DownloaderHelper } = require('node-downloader-helper');

var appdata_path = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
var minecraft_path = appdata_path + "/.dungeoncraft/dungeoncraft";
var base_path = appdata_path + "/.dungeoncraft/";
var java_path = base_path + "/meta/java";

let meta_is_ready = false;
let java_is_ready = false;
let files_are_ready = false;
let game_is_ready = false;

nativeTheme.themeSource = 'dark';

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
    frame: false,
    //resizable: false,
    enableRemoteModule: true,
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

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
      frame: false,
      //resizable: false,
      enableRemoteModule: true,
      webPreferences: {
        nodeIntegration: true
      }
    });
  
    windowName.loadURL(url);
  
    windowName.webContents.openDevTools();
  
    windowName.hide();
  };

const createWindows = () =>{
    let settingsWindow = 'settingsWindow';

    createNewWindow(settingsWindow, 710, 400, `file://${__dirname}/settings.html`);

    let authWindow = 'authWindow';

    createNewWindow(authWindow, 400, 300, `file://${__dirname}/auth.html`);

    let errorNickWindow = 'errorNickWindow';

    createNewWindow(errorNickWindow, 400, 300, `file://${__dirname}/error_nick.html`);

    let errorPassWindow = 'errorPassWindow';

    createNewWindow(errorPassWindow, 400, 300, `file://${__dirname}/error_pass.html`);

    let loadingWindow = 'loadingWindow';

    createNewWindow(loadingWindow, 710, 400, `file://${__dirname}/loading.html`);
}

app.on('ready', createWindows);


function createLauncherDir() {
  if (!fs.existsSync(appdata_path + "/.dungeoncraft")) {
    fs.mkdirSync(appdata_path + "/.dungeoncraft");
  }
  
  if (!fs.existsSync(minecraft_path)) {
    fs.mkdirSync(minecraft_path);
  }

  if (!fs.existsSync(minecraft_path + "/natives")) {
    fs.mkdirSync(minecraft_path + "/natives");
  }
  
  if (!fs.existsSync(base_path + "/meta")) {
    fs.mkdirSync(base_path + "/meta");
  }
  
  if (!fs.existsSync(java_path)) {
    fs.mkdirSync(java_path);
  }  
}

createLauncherDir();

const authorization = () =>
  {
    BrowserWindow.fromId(3).show();
  }
  
const isAuthorized = () => {
  if (fs.existsSync("./launcher_data")){
    fs.readFile('./launcher_data', 'utf8', function(err, buffer){
      if(err) { 
        console.log('Cant read profile'); 
        }else { 
          if (buffer === '') {
            authorization();
          } 
        } 
    });
  }
  else
  {
    authorization();
  }  
}

app.on('ready', isAuthorized);

function handleTitleBarActions(args) {

  if (args === 3)
    BrowserWindow.fromId(2).reload();

  if (args === 1)
      app.quit();
  else
    BrowserWindow.fromId(args).hide();
}

function errorActions(args) {
  if (args === 'ник') {
    BrowserWindow.fromId(4).show();
  } else
    BrowserWindow.fromId(5).show();
}

ipcMain.on('settings', (event, arg) => {
  BrowserWindow.fromId(2).show()
});

ipcMain.on('changeName', (event, arg) => {
  authorization();
});

ipcMain.on('error', (event, arg) => {
  errorActions(arg)
});

ipcMain.on('close_window', (event, args) => {
  handleTitleBarActions(args);
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
    if (!(b.toString().includes(x))) {
      res.push(x);
    }
  }
  return res;
}

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
      let downloaded_files = [];

      if (res.length !== 0) {
        for (var x of res)
          {
            let y = x.split('/');
            y.shift();
            createDir(y, dest_path);
  
            if (y.length > 1) {
              y.pop();
              if (y.length > 1) {
                y = '/' + y.join('/');
              }
              else { y = '/' + y; }
            }
            else { y = ''; }

            //sleep(5);
  
            const dl = new DownloaderHelper(server_url + x, dest_path + y);
  
            console.log("Downloading file " + x);
  
            dl.on('end', () => {
              downloaded_files.push(x);
              console.log('Downloaded file ' + downloaded_files.length + " of " + res.length);
              if (downloaded_files.length === res.length) {
                  console.log('Files downloading complete!');
                  files_are_ready = true;
                  console.log('files are ok');
              }
            });
  
            dl.on('error', (err) => console.log('Download Failed' + server_url+x, err));
            dl.start().catch(err => {
              console.error(err)
              console.log('Download error' + server_url+x)
            });
          }
      } else
      {
        console.log('files are ok');
        files_are_ready = true;
      }
    } 

    let serverMods = [];
    for (var x of filesOnServer) {
      if (x.includes('mods')) { serverMods.push(x) }
    }

    dest_path += "/mods";

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
    } else
    console.log('mods are ok');
  });
}

async function unzipFiles(dest_path, fileName)
{
  try {
    console.log('Extracting ' + fileName);
    await extract(dest_path + "/" + fileName, { dir: dest_path })
    console.log('Extraction ' + fileName + ' complete');
    if (fileName.includes('jdk')) {
      console.log('java is ok');
      java_is_ready = true;
    } else if (fileName.includes('meta')) {
      console.log('meta is ok');
      meta_is_ready = true;
    }
    fs.unlinkSync(dest_path + "/" + fileName);
  } catch (err) {
    // handle any errors
  }

}

//Создание server.txt
/*
let serversrc_path = "D:/Documents/GitHub/LuciaRey.github.io/dungeoncraft/dungeoncraft";

if (fs.existsSync('D:/Documents/GitHub/LuciaRey.github.io/dungeoncraft/dungeoncraft/server.txt'))
  fs.unlinkSync('D:/Documents/GitHub/LuciaRey.github.io/dungeoncraft/dungeoncraft/server.txt');

let files = giveMeFiles(serversrc_path, '/');

let serverfiles = [];

for (var x of files)
  {
    if ((x.includes('profile.json') || x.includes('datapacks') || x.includes('mods') || x.includes('dungeoncraft'))) 
      {
        serverfiles.push(x);
      }
  }
fs.writeFileSync("D:/Documents/GitHub/LuciaRey.github.io/dungeoncraft/dungeoncraft/server.txt", serverfiles);
console.log('server.txt was created in D:/Documents/GitHub/LuciaRey.github.io/dungeoncraft/dungeoncraft/');
*/


function verifyJava(){
  if (!fs.existsSync(java_path + "/jdk-17.0.11")) {
    if(!fs.existsSync(java_path + "/jdk-17_windows-x64_bin.zip")) {
      console.log('java is missing | downloading java');
  
      const dl = new DownloaderHelper("https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.zip", java_path);
    
      dl.on('end', () => {
        console.log('Download jdk-17_windows-x64_bin.zip complete');
        unzipFiles(java_path, 'jdk-17_windows-x64_bin.zip');
      });
    
      dl.on('error', (err) => console.log('Download jdk-17_windows-x64_bin.zip Failed' , err));
      dl.start().catch(err => console.error(err));
    } else {
      unzipFiles(java_path, 'jdk-17_windows-x64_bin.zip');
    }
  } else {
    console.log('java is ok');
    java_is_ready = true;
  }
}

function verifyMeta() {
  if (!fs.existsSync(base_path + "/meta/assets") || !fs.existsSync(base_path + "/meta/libraries")) {
    if(!fs.existsSync(base_path + "/meta/meta.zip")) {
      console.log('meta is missing | downloading meta');
  
      const dl = new DownloaderHelper("https://drive.usercontent.google.com/download?id=13ocAxDoZ1jgEioVG9w8hOoDVwjpyrSB_&confirm=t&uuid=48907295-b2bc-4eb7-9636-74f617e16fc7&at=APZUnTWStq7EHkiEobQ-6swQRsSv%3A1716762136742", base_path + "/meta");
    
      dl.on('end', () => {
        console.log('Download meta.zip complete');
        unzipFiles(base_path + "/meta", "meta.zip");
      });
    
      dl.on('error', (err) => console.log('Download meta.zip Failed' , err));
      dl.start().catch(err => console.error(err));
    } else {
      unzipFiles(base_path + "/meta", 'meta.zip');
    }
  } else {
    console.log('meta is ok');
    meta_is_ready = true;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function isGameReady() {
  while (!game_is_ready) {
    if (java_is_ready && meta_is_ready && files_are_ready) {
      console.log('launching game');
      //Запускаю игру... Ну типа
      game_is_ready = true;
    }
    await sleep(2000);
  }
}


ipcMain.on('launch', (event, arg) => {
    BrowserWindow.fromId(6).show();
    console.log('Launching minecraft');

    verifyJava();
    verifyMeta();

    let server_url = "https://luciarey.github.io/dungeoncraft/dungeoncraft";

    if (fs.existsSync(minecraft_path + "/server.txt")) { fs.unlinkSync(minecraft_path + "/server.txt"); }

    const dl = new DownloaderHelper(server_url + "/server.txt", minecraft_path);

    dl.on('end', () => {
  
      let servertxt_path = minecraft_path + '/server.txt';
      verifyFiles(servertxt_path, minecraft_path, server_url);
    });

    dl.on('error', (err) => console.log('Download server.txt Failed' , err));
    dl.start().catch(err => console.error(err));

    isGameReady();
});


//  https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.zip  <-- java 17 installation
