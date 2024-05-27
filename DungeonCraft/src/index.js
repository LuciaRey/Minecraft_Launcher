const fs = require("fs");
const { shell } = require("electron");
const { app, BrowserWindow } = require("electron");
const extract = require("extract-zip");
const ipcMain = require("electron").ipcMain;
const { nativeTheme } = require("electron");
const childProcess = require("child_process");
const { DownloaderHelper } = require("node-downloader-helper");

var appdata_path =
  process.env.APPDATA ||
  (process.platform == "darwin"
    ? process.env.HOME + "/Library/Preferences"
    : process.env.HOME + "/.local/share");
var minecraft_path = appdata_path + "/.dungeoncraft/dungeoncraft";
var base_path = appdata_path + "/.dungeoncraft/";
var java_path = base_path + "meta/java";

let meta_is_ready = false;
let java_is_ready = false;
let files_are_ready = false;
let game_is_ready = false;

nativeTheme.themeSource = "dark";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = "mainWindow";

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
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const createNewWindow = (windowName, windWidth, windHeight, url) => {
  windowName = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    width: windWidth,
    height: windHeight,
    frame: false,
    //resizable: false,
    enableRemoteModule: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  windowName.loadURL(url);

  windowName.webContents.openDevTools();

  windowName.hide();
};

const createWindows = () => {
  let settingsWindow = "settingsWindow";

  createNewWindow(
    settingsWindow,
    710,
    400,
    `file://${__dirname}/settings.html`
  );

  let authWindow = "authWindow";

  createNewWindow(authWindow, 400, 300, `file://${__dirname}/auth.html`);

  let errorNickWindow = "errorNickWindow";

  createNewWindow(
    errorNickWindow,
    400,
    300,
    `file://${__dirname}/error_nick.html`
  );

  let errorPassWindow = "errorPassWindow";

  createNewWindow(
    errorPassWindow,
    400,
    300,
    `file://${__dirname}/error_pass.html`
  );

  let loadingWindow = "loadingWindow";

  createNewWindow(loadingWindow, 710, 400, `file://${__dirname}/loading.html`);
};

app.on("ready", createWindows);

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

const authorization = () => {
  BrowserWindow.fromId(3).show();
};

const isAuthorized = () => {
  if (fs.existsSync("./launcher_data")) {
    fs.readFile("./launcher_data", "utf8", function (err, buffer) {
      if (err) {
        console.log("Cant read launcher_data");
      } else {
        if (buffer === "") {
          authorization();
        }
      }
    });
  } else {
    authorization();
  }
};

app.on("ready", isAuthorized);

function checkJavaArgs() {
  if (!fs.existsSync("./java_args")) {
    console.log("java_args is missing | created java_args");
    fs.writeFileSync("./java_args", "-Xms2048M -Xmx8192M");
  } else {
    fs.readFile("./java_args", "utf8", function (err, buffer) {
      if (err) {
        console.log("Cant read launcher_data");
      } else {
        console.log(buffer);
        if (buffer === "") {
          console.log("java_args is empty | created java_args");
          fs.writeFileSync("./java_args", "-Xms2048M -Xmx8192M");
        }
      }
    });
  }
}

app.on("ready", checkJavaArgs);

function handleTitleBarActions(args) {
  if (args === 3) BrowserWindow.fromId(2).reload();

  if (args === 1) app.quit();
  else BrowserWindow.fromId(args).hide();
}

function errorActions(args) {
  if (args === "ник") {
    BrowserWindow.fromId(4).show();
  } else BrowserWindow.fromId(5).show();
}

ipcMain.on("settings", (event, arg) => {
  BrowserWindow.fromId(2).show();
});

ipcMain.on("changeName", (event, arg) => {
  authorization();
});

ipcMain.on("error", (event, arg) => {
  errorActions(arg);
});

ipcMain.on("close_window", (event, args) => {
  handleTitleBarActions(args);
});

function giveMeFiles(dir, basedir, files) {
  files = files || [];
  var allFiles = fs.readdirSync(dir);
  for (var i = 0; i < allFiles.length; i++) {
    var name = dir + "/" + allFiles[i];
    var filename = basedir + allFiles[i];
    if (fs.statSync(name).isDirectory()) {
      giveMeFiles(name, basedir + allFiles[i] + "/", files);
    } else {
      files.push(filename);
    }
  }
  return files;
}

function getUncommonElements(a, b) {
  var res = [];

  for (var x of a) {
    if (!b.toString().includes(x)) {
      res.push(x);
    }
  }
  return res;
}

function createDir(x, dest_path) {
  let basedir = "/";

  if (x.length > 1) {
    for (let i = 0; i <= x.length - 2; i++) {
      if (!fs.existsSync(dest_path + basedir + x[i])) {
        fs.mkdirSync(dest_path + basedir + x[i]);
      }
      basedir += x[i] + "/";
    }
  }
}

function verifyFiles(src_path, dest_path, server_url) {
  fs.readFile(src_path, "utf8", (err, filesOnServer) => {
    if (err) {
      console.error(err);
      return;
    }
    filesOnServer = filesOnServer.split(",");
    let filesOnClient = giveMeFiles(dest_path, "/", "");

    if (filesOnServer !== filesOnClient) {
      let res = getUncommonElements(filesOnServer, filesOnClient);
      let downloaded_files = [];

      if (res.length !== 0) {
        for (var x of res) {
          let y = x.split("/");
          y.shift();
          createDir(y, dest_path);

          if (y.length > 1) {
            y.pop();
            if (y.length > 1) {
              y = "/" + y.join("/");
            } else {
              y = "/" + y;
            }
          } else {
            y = "";
          }

          //sleep(5);

          const dl = new DownloaderHelper(server_url + x, dest_path + y);

          console.log("Downloading file " + x);

          dl.on("end", () => {
            downloaded_files.push(x);
            console.log(
              "Downloaded file " + downloaded_files.length + " of " + res.length
            );
            if (downloaded_files.length === res.length) {
              console.log("Files downloading complete!");
              files_are_ready = true;
              console.log("files are ok");
            }
          });

          dl.on("error", (err) =>
            console.log("Download Failed" + server_url + x, err)
          );
          dl.start().catch((err) => {
            console.error(err);
            console.log("Download error" + server_url + x);
          });
        }
      } else {
        console.log("files are ok");
        files_are_ready = true;
      }
    }

    let serverMods = [];
    for (var x of filesOnServer) {
      if (x.includes("mods")) {
        serverMods.push(x);
      }
    }

    dest_path += "/mods";

    filesOnClient = giveMeFiles(dest_path, "");
    if (serverMods != filesOnClient) {
      let res = getUncommonElements(filesOnClient, serverMods);
      for (var x of res) {
        let y = x.split("/");
        y.shift();
        fs.unlink(dest_path + "/" + x, (err) => {
          if (err) throw err;
        });
        console.log(x + " was deleted");
      }
    } else console.log("mods are ok");
  });
}

async function unzipFiles(dest_path, fileName) {
  try {
    console.log("Extracting " + fileName);
    await extract(dest_path + "/" + fileName, { dir: dest_path });
    console.log("Extraction " + fileName + " complete");
    if (fileName.includes("jdk")) {
      console.log("java is ok");
      java_is_ready = true;
    } else if (fileName.includes("meta")) {
      console.log("meta is ok");
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
    if ((x.includes('profile.json') || x.includes('datapacks') || x.includes('mods') || x.includes('dungeoncraft') || x.includes('authlib'))) 
      {
        serverfiles.push(x);
      }
  }
fs.writeFileSync("D:/Documents/GitHub/LuciaRey.github.io/dungeoncraft/dungeoncraft/server.txt", serverfiles);
console.log('server.txt was created in D:/Documents/GitHub/LuciaRey.github.io/dungeoncraft/dungeoncraft/');
*/

function verifyJava() {
  if (!fs.existsSync(java_path + "/jdk-17.0.11")) {
    if (!fs.existsSync(java_path + "/jdk-17_windows-x64_bin.zip")) {
      console.log("java is missing | downloading java");

      const dl = new DownloaderHelper(
        "https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.zip",
        java_path
      );

      dl.on("end", () => {
        console.log("Download jdk-17_windows-x64_bin.zip complete");
        unzipFiles(java_path, "jdk-17_windows-x64_bin.zip");
      });

      dl.on("error", (err) =>
        console.log("Download jdk-17_windows-x64_bin.zip Failed", err)
      );
      dl.start().catch((err) => console.error(err));
    } else {
      unzipFiles(java_path, "jdk-17_windows-x64_bin.zip");
    }
  } else {
    console.log("java is ok");
    java_is_ready = true;
  }
}

function verifyMeta() {
  if (
    !fs.existsSync(base_path + "/meta/assets") ||
    !fs.existsSync(base_path + "/meta/libraries")
  ) {
    if (!fs.existsSync(base_path + "/meta/meta.zip")) {
      console.log("meta is missing | downloading meta");

      const dl = new DownloaderHelper(
        "https://drive.usercontent.google.com/download?id=13ocAxDoZ1jgEioVG9w8hOoDVwjpyrSB_&confirm=t&uuid=48907295-b2bc-4eb7-9636-74f617e16fc7&at=APZUnTWStq7EHkiEobQ-6swQRsSv%3A1716762136742",
        base_path + "/meta"
      );

      dl.on("end", () => {
        console.log("Download meta.zip complete");
        unzipFiles(base_path + "/meta", "meta.zip");
      });

      dl.on("error", (err) => console.log("Download meta.zip Failed", err));
      dl.start().catch((err) => console.error(err));
    } else {
      unzipFiles(base_path + "/meta", "meta.zip");
    }
  } else {
    console.log("meta is ok");
    meta_is_ready = true;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function isGameReady() {
  while (!game_is_ready) {
    if (java_is_ready && meta_is_ready && files_are_ready) {
      console.log("launching game");
      launchingGame();
      game_is_ready = true;
    }
    await sleep(2000);
  }
}

function launchingGame() {
  fs.readFile("./launcher_data", "utf8", function (err, buffer) {
    if (err) {
      console.log("Cant read launcher_data");
    } else {
      buffer = buffer.split(" ");
      let accessToken = buffer[1];
      let uuid = buffer[0];
      let nickname = buffer[2];

      fs.readFile("./java_args", "utf8", function (err, data) {
        if (err) {
          console.log("Cant read java_args");
        } else {
          let java_args = data;
          java_path += "/jdk-17.0.11";

          let filename = "" + java_path + "/bin/javaw.exe";
          filename = filename.toString().replace(/\\/g, "/");

          java_args = java_args.toString().replace(/ /g, " !");

          let command =
            "-XX:+UnlockExperimentalVMOptions !-XX:+UseZGC !-XX:-ZUncommit !-XX:ZCollectionInterval=5 !-XX:ZAllocationSpikeTolerance=2.0 !-XX:+AlwaysPreTouch !-XX:+ParallelRefProcEnabled !-XX:+DisableExplicitGC !" +
            java_args +
            " !-Dfile.encoding=UTF-8 " +
            '!-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump !"-Djava.library.path=' +
            minecraft_path +
            '/natives" !-Dminecraft.launcher.brand=dungeoncraft !-Dminecraft.launcher.version=1.2.3-j !-cp "' +
            base_path +
            "meta/libraries/cpw/mods/securejarhandler/2.1.4/securejarhandler-2.1.4.jar;" +
            base_path +
            "meta/libraries/org/ow2/asm/asm/9.7/asm-9.7.jar;" +
            base_path +
            "meta/libraries/org/ow2/asm/asm-commons/9.7/asm-commons-9.7.jar;" +
            base_path +
            "meta/libraries/org/ow2/asm/asm-tree/9.7/asm-tree-9.7.jar;" +
            base_path +
            "meta/libraries/org/ow2/asm/asm-util/9.7/asm-util-9.7.jar;" +
            base_path +
            "meta/libraries/org/ow2/asm/asm-analysis/9.7/asm-analysis-9.7.jar;" +
            base_path +
            "meta/libraries/net/minecraftforge/accesstransformers/8.0.4/accesstransformers-8.0.4.jar;" +
            base_path +
            "meta/libraries/org/antlr/antlr4-runtime/4.9.1/antlr4-runtime-4.9.1.jar;" +
            base_path +
            "meta/libraries/net/minecraftforge/eventbus/6.0.3/eventbus-6.0.3.jar;" +
            base_path +
            "meta/libraries/net/minecraftforge/forgespi/6.0.0/forgespi-6.0.0.jar;" +
            base_path +
            "meta/libraries/net/minecraftforge/coremods/5.0.1/coremods-5.0.1.jar;" +
            base_path +
            "meta/libraries/cpw/mods/modlauncher/10.0.8/modlauncher-10.0.8.jar;" +
            base_path +
            "meta/libraries/net/minecraftforge/unsafe/0.2.0/unsafe-0.2.0.jar;" +
            base_path +
            "meta/libraries/com/electronwill/night-config/core/3.6.4/core-3.6.4.jar;" +
            base_path +
            "meta/libraries/com/electronwill/night-config/toml/3.6.4/toml-3.6.4.jar;" +
            base_path +
            "meta/libraries/org/apache/maven/maven-artifact/3.8.5/maven-artifact-3.8.5.jar;" +
            base_path +
            "meta/libraries/net/jodah/typetools/0.8.3/typetools-0.8.3.jar;" +
            base_path +
            "meta/libraries/net/minecrell/terminalconsoleappender/1.2.0/terminalconsoleappender-1.2.0.jar;" +
            base_path +
            "meta/libraries/org/jline/jline-reader/3.12.1/jline-reader-3.12.1.jar;" +
            base_path +
            "meta/libraries/org/jline/jline-terminal/3.12.1/jline-terminal-3.12.1.jar;" +
            base_path +
            "meta/libraries/org/spongepowered/mixin/0.8.5/mixin-0.8.5.jar;" +
            base_path +
            "meta/libraries/org/openjdk/nashorn/nashorn-core/15.3/nashorn-core-15.3.jar;" +
            base_path +
            "meta/libraries/net/minecraftforge/JarJarSelector/0.3.16/JarJarSelector-0.3.16.jar;" +
            base_path +
            "meta/libraries/net/minecraftforge/JarJarMetadata/0.3.16/JarJarMetadata-0.3.16.jar;" +
            base_path +
            "meta/libraries/cpw/mods/bootstraplauncher/1.1.2/bootstraplauncher-1.1.2.jar;" +
            base_path +
            "meta/libraries/net/minecraftforge/JarJarFileSystems/0.3.16/JarJarFileSystems-0.3.16.jar;" +
            base_path +
            "meta/libraries/net/minecraftforge/fmlloader/1.19.2-43.3.13/fmlloader-1.19.2-43.3.13.jar;" +
            base_path +
            "meta/libraries/com/mojang/logging/1.0.0/logging-1.0.0.jar;" +
            base_path +
            "meta/libraries/com/mojang/blocklist/1.0.10/blocklist-1.0.10.jar;" +
            base_path +
            "meta/libraries/ru/tln4/empty/0.1/empty-0.1.jar;" +
            base_path +
            "meta/libraries/com/github/oshi/oshi-core/5.8.5/oshi-core-5.8.5.jar;" +
            base_path +
            "meta/libraries/net/java/dev/jna/jna/5.10.0/jna-5.10.0.jar;" +
            base_path +
            "meta/libraries/net/java/dev/jna/jna-platform/5.10.0/jna-platform-5.10.0.jar;" +
            base_path +
            "meta/libraries/org/slf4j/slf4j-api/1.8.0-beta4/slf4j-api-1.8.0-beta4.jar;" +
            base_path +
            "meta/libraries/org/apache/logging/log4j/log4j-slf4j18-impl/2.17.0/log4j-slf4j18-impl-2.17.0.jar;" +
            base_path +
            "meta/libraries/com/ibm/icu/icu4j/70.1/icu4j-70.1.jar;" +
            base_path +
            "meta/libraries/com/mojang/javabridge/1.2.24/javabridge-1.2.24.jar;" +
            base_path +
            "meta/libraries/net/sf/jopt-simple/jopt-simple/5.0.4/jopt-simple-5.0.4.jar;" +
            base_path +
            "meta/libraries/io/netty/netty-common/4.1.77.Final/netty-common-4.1.77.Final.jar;" +
            base_path +
            "meta/libraries/io/netty/netty-buffer/4.1.77.Final/netty-buffer-4.1.77.Final.jar;" +
            base_path +
            "meta/libraries/io/netty/netty-codec/4.1.77.Final/netty-codec-4.1.77.Final.jar;" +
            base_path +
            "meta/libraries/io/netty/netty-handler/4.1.77.Final/netty-handler-4.1.77.Final.jar;" +
            base_path +
            "meta/libraries/io/netty/netty-resolver/4.1.77.Final/netty-resolver-4.1.77.Final.jar;" +
            base_path +
            "meta/libraries/io/netty/netty-transport/4.1.77.Final/netty-transport-4.1.77.Final.jar;" +
            base_path +
            "meta/libraries/io/netty/netty-transport-native-unix-common/4.1.77.Final/netty-transport-native-unix-common-4.1.77.Final.jar;" +
            base_path +
            "meta/libraries/io/netty/netty-transport-classes-epoll/4.1.77.Final/netty-transport-classes-epoll-4.1.77.Final.jar;" +
            base_path +
            "meta/libraries/com/google/guava/failureaccess/1.0.1/failureaccess-1.0.1.jar;" +
            base_path +
            "meta/libraries/com/google/guava/guava/31.0.1-jre/guava-31.0.1-jre.jar;" +
            base_path +
            "meta/libraries/org/apache/commons/commons-lang3/3.12.0/commons-lang3-3.12.0.jar;" +
            base_path +
            "meta/libraries/commons-io/commons-io/2.11.0/commons-io-2.11.0.jar;" +
            base_path +
            "meta/libraries/commons-codec/commons-codec/1.15/commons-codec-1.15.jar;" +
            base_path +
            "meta/libraries/com/mojang/brigadier/1.0.18/brigadier-1.0.18.jar;" +
            base_path +
            "meta/libraries/com/mojang/datafixerupper/5.0.28/datafixerupper-5.0.28.jar;" +
            base_path +
            "meta/libraries/com/google/code/gson/gson/2.8.9/gson-2.8.9.jar;" +
            base_path +
            "meta/libraries/com/mojang/authlib/3.18.38/authlib-3.18.38.jar;" +
            base_path +
            "meta/libraries/org/apache/commons/commons-compress/1.21/commons-compress-1.21.jar;" +
            base_path +
            "meta/libraries/org/apache/httpcomponents/httpclient/4.5.13/httpclient-4.5.13.jar;" +
            base_path +
            "meta/libraries/commons-logging/commons-logging/1.2/commons-logging-1.2.jar;" +
            base_path +
            "meta/libraries/org/apache/httpcomponents/httpcore/4.4.14/httpcore-4.4.14.jar;" +
            base_path +
            "meta/libraries/it/unimi/dsi/fastutil/8.5.6/fastutil-8.5.6.jar;" +
            base_path +
            "meta/libraries/org/apache/logging/log4j/log4j-api/2.17.0/log4j-api-2.17.0.jar;" +
            base_path +
            "meta/libraries/org/apache/logging/log4j/log4j-core/2.17.0/log4j-core-2.17.0.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-windows.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-windows-x86.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-jemalloc/3.3.1/lwjgl-jemalloc-3.3.1.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-jemalloc/3.3.1/lwjgl-jemalloc-3.3.1-natives-windows.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-jemalloc/3.3.1/lwjgl-jemalloc-3.3.1-natives-windows-x86.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-openal/3.3.1/lwjgl-openal-3.3.1.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-openal/3.3.1/lwjgl-openal-3.3.1-natives-windows.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-openal/3.3.1/lwjgl-openal-3.3.1-natives-windows-x86.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-opengl/3.3.1/lwjgl-opengl-3.3.1.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-opengl/3.3.1/lwjgl-opengl-3.3.1-natives-windows.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-opengl/3.3.1/lwjgl-opengl-3.3.1-natives-windows-x86.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-glfw/3.3.1/lwjgl-glfw-3.3.1.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-glfw/3.3.1/lwjgl-glfw-3.3.1-natives-windows.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-glfw/3.3.1/lwjgl-glfw-3.3.1-natives-windows-x86.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-stb/3.3.1/lwjgl-stb-3.3.1.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-stb/3.3.1/lwjgl-stb-3.3.1-natives-windows.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-stb/3.3.1/lwjgl-stb-3.3.1-natives-windows-x86.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-tinyfd/3.3.1/lwjgl-tinyfd-3.3.1.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-tinyfd/3.3.1/lwjgl-tinyfd-3.3.1-natives-windows.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-tinyfd/3.3.1/lwjgl-tinyfd-3.3.1-natives-windows-x86.jar;" +
            base_path +
            "meta/libraries/com/mojang/text2speech/1.16.7/text2speech-1.16.7.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-glfw/3.3.1/lwjgl-glfw-3.3.1-natives-windows-arm64.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-jemalloc/3.3.1/lwjgl-jemalloc-3.3.1-natives-windows-arm64.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-openal/3.3.1/lwjgl-openal-3.3.1-natives-windows-arm64.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-opengl/3.3.1/lwjgl-opengl-3.3.1-natives-windows-arm64.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-stb/3.3.1/lwjgl-stb-3.3.1-natives-windows-arm64.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl-tinyfd/3.3.1/lwjgl-tinyfd-3.3.1-natives-windows-arm64.jar;" +
            base_path +
            "meta/libraries/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-windows-arm64.jar;" +
            minecraft_path +
            '/Forge 1.19.2.jar" !-Djava.net.preferIPv6Addresses=system !"-DignoreList=bootstraplauncher,securejarhandler,asm-commons,asm-util,asm-analysis,asm-tree,asm,JarJarFileSystems,client-extra,fmlcore,javafmllanguage,lowcodelanguage,mclanguage,forge-,dungeoncraft.jar" ' +
            "!-DmergeModules=jna-5.10.0.jar,jna-platform-5.10.0.jar !-DlibraryDirectory=" +
            base_path +
            "meta/libraries !-p " +
            base_path +
            "meta/libraries/cpw/mods/bootstraplauncher/1.1.2/bootstraplauncher-1.1.2.jar;" +
            base_path +
            "meta/libraries/cpw/mods/securejarhandler/2.1.4/securejarhandler-2.1.4.jar;" +
            base_path +
            "meta/libraries/org/ow2/asm/asm-commons/9.7/asm-commons-9.7.jar;" +
            base_path +
            "meta/libraries/org/ow2/asm/asm-util/9.7/asm-util-9.7.jar;" +
            base_path +
            "meta/libraries/org/ow2/asm/asm-analysis/9.7/asm-analysis-9.7.jar;" +
            base_path +
            "meta/libraries/org/ow2/asm/asm-tree/9.7/asm-tree-9.7.jar;" +
            base_path +
            "meta/libraries/org/ow2/asm/asm/9.7/asm-9.7.jar;" +
            base_path +
            "meta/libraries/net/minecraftforge/JarJarFileSystems/0.3.16/JarJarFileSystems-0.3.16.jar !--add-modules ALL-MODULE-PATH " +
            "!--add-opens java.base/java.util.jar=cpw.mods.securejarhandler !--add-opens java.base/java.lang.invoke=cpw.mods.securejarhandler !--add-exports java.base/sun.security.util=cpw.mods.securejarhandler !--add-exports jdk.naming.dns/com.sun.jndi.dns=java.naming " +
            "!-Xss2M cpw.mods.bootstraplauncher.BootstrapLauncher !--username " +
            nickname +
            ' !--version "Forge 1.19.2" !--gameDir ' +
            minecraft_path +
            "/ !--assetsDir " +
            base_path +
            "meta/assets !--assetIndex 1.19 !--uuid " +
            uuid +
            " !--accessToken " +
            accessToken +
            ' !--clientId "" !--xuid "" !--userType legacy !--versionType modified !--width 925 !--height 530 !--launchTarget forgeclient !--fml.forgeVersion 43.3.13 !--fml.mcVersion 1.19.2 !--fml.forgeGroup net.minecraftforge !--fml.mcpVersion 20220805.130853';
          command = command.toString().replace(/\\/g, "/");

          command = command.split(" !");

          console.log(command);

          //loadingWindow.show();

          const launch = childProcess.spawn(filename, command);

          BrowserWindow.fromId(1).webContents.setWindowOpenHandler(
            ({ url }) => {
              if (url.startsWith("https:") || url.startsWith("http:"))
                import_electron.shell.openExternal(url);
              console.log("blocked by openHandler");
              return { action: "deny" };
            }
          );

          launch.stdout.on("data", (data) => {
            BrowserWindow.fromId(1).webContents.send("minecraft-log", data);
          });

          launch.stderr.on("data", (data) => {
            BrowserWindow.fromId(1).webContents.send("minecraft-log", data);
          });

          // In this example, only windows with the `about:blank` url will be created.
          // All other urls will be blocked.
        }
      });
    }
  });
}

ipcMain.on("launch", (event, arg) => {
  console.log("Launching minecraft");

  verifyJava();
  verifyMeta();

  let server_url = "https://luciarey.github.io/dungeoncraft/dungeoncraft";

  if (fs.existsSync(minecraft_path + "/server.txt")) {
    fs.unlinkSync(minecraft_path + "/server.txt");
  }

  const dl = new DownloaderHelper(server_url + "/server.txt", minecraft_path);

  dl.on("end", () => {
    let servertxt_path = minecraft_path + "/server.txt";
    verifyFiles(servertxt_path, minecraft_path, server_url);
  });

  dl.on("error", (err) => console.log("Download server.txt Failed", err));
  dl.start().catch((err) => console.error(err));

  isGameReady();
});

//  https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.zip  <-- java 17 installation
