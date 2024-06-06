const fs = require("fs");
const extract = require("extract-zip");
const ipcMain = require("electron").ipcMain;
const { nativeTheme } = require("electron");
const childProcess = require("child_process");
const { app, BrowserWindow } = require("electron");
const unpacker = require("unpacker-with-progress");
const { DownloaderHelper } = require("node-downloader-helper");
import log from "electron-log/main";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

var appdata_path =
  process.env.APPDATA ||
  (process.platform === "darwin"
    ? process.env.HOME + "/Library/minercraft"
    : process.env.HOME + "/minecraft");
var minecraft_path = appdata_path + "/.dungeoncraft/dungeoncraft";
var base_path = appdata_path + "/.dungeoncraft/";
var java_path = base_path + "meta/java";

let assets_are_ready = false;
let java_is_ready = false;
let files_are_ready = false;
let game_is_ready = false;

nativeTheme.themeSource = "dark";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = "mainWindow";

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 710,
    height: 400,
    frame: false,
    resizable: false,
    enableRemoteModule: true,
    icon: "./images/icon.ico",
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

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
    resizable: false,
    enableRemoteModule: true,
    icon: "./images/icon.ico",
    webPreferences: {
      nodeIntegration: true,
    },
  });

  windowName.loadURL(url);

  //windowName.webContents.openDevTools();

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

  createNewWindow(authWindow, 512, 512, `file://${__dirname}/auth.html`);

  let errorNickWindow = "errorNickWindow";

  createNewWindow(
    errorNickWindow,
    512,
    544,
    `file://${__dirname}/error_nick.html`
  );

  let errorPassWindow = "errorPassWindow";

  createNewWindow(
    errorPassWindow,
    512,
    544,
    `file://${__dirname}/error_pass.html`
  );

  let loadingWindow = "loadingWindow";

  createNewWindow(loadingWindow, 512, 544, `file://${__dirname}/loading.html`);

  let errorWindow = "errorWindow";

  createNewWindow(errorWindow, 512, 534, `file://${__dirname}/error.html`);
};

app.on("ready", createWindows);

if (fs.existsSync("./logs/main.log")) {
  fs.unlinkSync("./logs/main.log");
}

log.transports.file.resolvePathFn = () => "./logs/main.log";

log.info(`This platform is ` + process.platform);

function createLauncherDir() {
  if (!fs.existsSync(appdata_path)) {
    fs.mkdirSync(appdata_path);
  }

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
  log.silly("Релиз - Завтра");
};

const isAuthorized = () => {
  if (fs.existsSync("./launcher_data")) {
    fs.readFile("./launcher_data", "utf8", function (err, buffer) {
      if (err) {
        log.error("Cant read launcher_data");
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
    log.info("java_args is missing | created java_args");
    let args = "-Xms2048M -Xmx8192M";
    if (process.platform === "win32") {
      args =
        "-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump -Xms2048M -Xmx8192M";
    } else if (process.platform === "darwin") {
      args = "-XstartOnFirstThread -Xms2048M -Xmx8192M";
    }
    fs.writeFileSync("./java_args", args);
  } else {
    fs.readFile("./java_args", "utf8", function (err, buffer) {
      if (err) {
        log.error("Cant read launcher_data");
      } else {
        log.info(buffer);
        if (buffer === "") {
          log.info("java_args is empty | created java_args");
          let args = "-Xms2048M -Xmx8192M";
          if (process.platform === "win32") {
            args =
              "-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump -Xms2048M -Xmx8192M";
          } else if (process.platform === "darwin") {
            args = "-XstartOnFirstThread -Xms2048M -Xmx8192M";
          }
          fs.writeFileSync("./java_args", args);
        }
      }
    });
  }
}

app.on("ready", checkJavaArgs);

function handleTitleBarActions(args) {
  if (args[0] === "close") {
    if (args[1] === 3) BrowserWindow.fromId(2).reload();
    if (args[1] === 1 || args[1] === 6 || args[1] === 7) app.quit();
    else BrowserWindow.fromId(args[1]).hide();
  } else if (args[0] === "minimize") {
    BrowserWindow.fromId(args[1]).minimize();
  }
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

ipcMain.on("window_actions", (event, args) => {
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
      log.error(err);
      return;
    }
    filesOnServer = filesOnServer.split(",");
    let filesOnClient = giveMeFiles(dest_path, "/", "");
    let filesForMyPlatform = [];
    for (var x of filesOnServer) {
      if (x.includes("windows")) {
        if (
          (process.platform === "win32" && x.includes("windows.jar")) ||
          x.includes("mods")
        ) {
          filesForMyPlatform.push(x);
        }
      } else if (x.includes("linux")) {
        if (
          (process.platform === "linux" && x.includes("linux.jar")) ||
          x.includes("mods")
        ) {
          filesForMyPlatform.push(x);
        }
      } else if (x.includes("macos")) {
        if (
          (process.platform === "darwin" && x.includes("macos-arm64.jar")) ||
          x.includes("mods")
        ) {
          filesForMyPlatform.push(x);
        }
      } else filesForMyPlatform.push(x);
    }

    if (filesForMyPlatform !== filesOnClient) {
      let res = getUncommonElements(filesForMyPlatform, filesOnClient);
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

          const dl = new DownloaderHelper(server_url + x, dest_path + y);

          log.info("Downloading file " + x);

          dl.on("end", () => {
            downloaded_files.push(x);
            log.info(
              "Downloaded file " + downloaded_files.length + " of " + res.length
            );
            if (downloaded_files.length === res.length) {
              log.info("Files downloading complete!");
              files_are_ready = true;
              fs.unlinkSync(minecraft_path + "/server.txt");
              log.info("files are ok");
            }
          });

          dl.on("error", (err) =>
            log.error("Download Failed" + server_url + x, err)
          );
          dl.start().catch((err) => {
            log.error(err);
            log.error("Download error" + server_url + x);
          });
        }
      } else {
        fs.unlinkSync(minecraft_path + "/server.txt");
        log.info("files are ok");
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
        log.info(x + " was deleted");
      }
    } else log.info("mods are ok");
  });
}

async function unzipFiles(dest_path, fileName) {
  function unpack() {
    let prevProgress = 0;
    return Promise.all([
      unpacker(dest_path + "/" + fileName, dest_path, {
        onprogress(progress) {
          let progr = progress.percent.toString().slice(2, 4);
          if (progr !== prevProgress && progr !== "") {
            log.info("Unpacking " + fileName + " " + progr + "%");
            prevProgress = progr;
          }
        },
      }),
    ]);
  }

  unpack().then((stats) => {
    log.info("done");
    if (fileName.includes("jdk")) {
      log.info("java is ok");
      java_is_ready = true;
    } else if (fileName.includes("assets")) {
      log.info("assets are ok");
      assets_are_ready = true;
    }
    fs.unlinkSync(dest_path + "/" + fileName);
  });
}

function verifyJava() {
  if (!fs.existsSync(java_path + "/jdk-17.0.11")) {
    let java = "jdk-17_windows-x64_bin.zip";
    if (process.platform === "linux") {
      java = "jdk-17_linux-x64_bin.tar.gz";
    }
    if (!fs.existsSync(java_path + "/" + java)) {
      log.info("java is missing | downloading java");

      let link = "https://download.oracle.com/java/17/latest/" + java;

      const dl = new DownloaderHelper(link, java_path);

      dl.on("end", () => {
        log.info("Download " + java + " complete");
        unzipFiles(java_path, java);
      });

      dl.on("error", (err) => log.error("Download " + java + " Failed", err));
      dl.start().catch((err) => log.error(err));
    } else {
      unzipFiles(java_path, java);
    }
  } else {
    log.info("java is ok");
    java_is_ready = true;
  }
}

function verifyAssets() {
  if (!fs.existsSync(minecraft_path + "/assets/indexes")) {
    if (!fs.existsSync(minecraft_path + "/assets" + "/assets.zip")) {
      log.info("assets are missing | downloading assets");

      fs.mkdirSync(minecraft_path + "/assets");

      const dl = new DownloaderHelper(
        "https://drive.usercontent.google.com/download?id=1NKCw1p4v3ZiNZKqpQ3ruu3q2BOpmIlvo&export=download&authuser=0&confirm=t&uuid=24f21176-93eb-4bce-b176-7834831e5cde&at=APZUnTUDhrYnoMIk1fUNVIEGUDV_:1717157136458",
        minecraft_path + "/assets"
      );

      dl.on("end", () => {
        log.info("Download assets.zip complete");
        unzipFiles(minecraft_path + "/assets", "assets.zip");
      });

      dl.on("error", (err) => log.error("Download assets.zip Failed", err));
      dl.start().catch((err) => log.error(err));
    } else {
      unzipFiles(minecraft_path + "/assets", "assets.zip");
    }
  } else {
    log.info("assets are ok");
    assets_are_ready = true;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function isGameReady() {
  while (!game_is_ready) {
    if (java_is_ready && assets_are_ready && files_are_ready) {
      log.info("launching game");
      log.silly("привет от V");
      launchingGame();
      game_is_ready = true;
    }
    await sleep(2000);
  }
}

function launchingGame() {
  let platformSep = ";";
  if (process.platform !== "win32") {
    platformSep = ":";
  }

  log.silly("<3");

  fs.readFile("./launcher_data", "utf8", function (err, buffer) {
    if (err) {
      log.error("Cant read launcher_data");
    } else {
      buffer = buffer.split(" ");
      let accessToken = buffer[1];
      let uuid = buffer[0];
      let nickname = buffer[2];

      fs.readFile("./java_args", "utf8", function (err, data) {
        if (err) {
          log.error("Cant read java_args");
        } else {
          let java_args = data;
          java_path += "/jdk-17.0.11";

          let filename = "" + java_path + "/bin/javaw.exe";
          if (process.platform == "linux") {
            filename = "" + java_path + "/bin/java";
          }

          filename = filename.toString().replace(/\\/g, "/");

          java_args = java_args.toString().replace(/ /g, " ");

          fs.readFile(
            minecraft_path +
              "/versions/1.19.2-forge-43.3.13/1.19.2-forge-43.3.13.json",
            "utf8",
            function (err, json_forge) {
              if (err) {
                log.error("Cant read 1.19.2-forge-43.3.13.json");
              } else {
                let cp2 = [];

                json_forge = JSON.parse(json_forge);
                for (let i = 0; i < json_forge["libraries"].length; i++) {
                  cp2.push(
                    minecraft_path +
                      "/libraries/" +
                      json_forge["libraries"][i]["downloads"]["artifact"][
                        "path"
                      ] +
                      platformSep
                  );
                }

                fs.readFile(
                  minecraft_path + "/versions/1.19.2/1.19.2.json",
                  "utf8",
                  function (err, json_1_19_2) {
                    let cp1 = [];

                    json_1_19_2 = JSON.parse(json_1_19_2);
                    for (let i = 0; i < json_1_19_2["libraries"].length; i++) {
                      let path =
                        minecraft_path +
                        "/libraries/" +
                        json_1_19_2["libraries"][i]["downloads"]["artifact"][
                          "path"
                        ];

                      if (json_1_19_2["libraries"][i].hasOwnProperty("rules")) {
                        let platform =
                          json_1_19_2["libraries"][i]["rules"][0]["os"]["name"];
                        if (process.platform === "win32") {
                          if (platform === "windows") {
                            cp1.push(path + platformSep);
                          }
                        } else if (process.platform === "linux") {
                          if (platform === process.platform) {
                            cp1.push(path + platformSep);
                          }
                        } else if (process.platform === "darwin") {
                          if (platform === "osx") {
                            cp1.push(path + platformSep);
                          }
                        }
                      } else cp1.push(path + platformSep);
                    }

                    let cp = cp1.concat(cp2);
                    cp = cp.toString().replace(/\\/g, "/");
                    cp = cp.toString().replace(/,/g, "");

                    let command =
                      "-javaagent:" +
                      minecraft_path +
                      "/libraries/com/mojang/authlib/3.11.49/authlib-injector-1.2.5.jar=ely.by -XX:+UnlockExperimentalVMOptions " +
                      java_args +
                      " -Djava.library.path=" +
                      minecraft_path +
                      "/natives -Dminecraft.launcher.brand=dungeoncraft -Dminecraft.launcher.version=1.2.3 -cp " +
                      cp +
                      minecraft_path +
                      "/versions/1.19.2/1.19.2.jar -Djava.net.preferIPv6Addresses=system -DignoreList=bootstraplauncher,securejarhandler,asm-commons,asm-util,asm-analysis,asm-tree,asm,JarJarFileSystems,client-extra,fmlcore,javafmllanguage,lowcodelanguage,mclanguage,forge-,1.19.2.jar " +
                      "-DmergeModules=jna-5.10.0.jar,jna-platform-5.10.0.jar -DlibraryDirectory=" +
                      minecraft_path +
                      "/libraries -p " +
                      minecraft_path +
                      "/libraries/cpw/mods/bootstraplauncher/1.1.2/bootstraplauncher-1.1.2.jar" +
                      platformSep +
                      minecraft_path +
                      "/libraries/cpw/mods/securejarhandler/2.1.4/securejarhandler-2.1.4.jar" +
                      platformSep +
                      minecraft_path +
                      "/libraries/org/ow2/asm/asm-commons/9.7/asm-commons-9.7.jar" +
                      platformSep +
                      minecraft_path +
                      "/libraries/org/ow2/asm/asm-util/9.7/asm-util-9.7.jar" +
                      platformSep +
                      minecraft_path +
                      "/libraries/org/ow2/asm/asm-analysis/9.7/asm-analysis-9.7.jar" +
                      platformSep +
                      minecraft_path +
                      "/libraries/org/ow2/asm/asm-tree/9.7/asm-tree-9.7.jar" +
                      platformSep +
                      minecraft_path +
                      "/libraries/org/ow2/asm/asm/9.7/asm-9.7.jar" +
                      platformSep +
                      minecraft_path +
                      "/libraries/net/minecraftforge/JarJarFileSystems/0.3.16/JarJarFileSystems-0.3.16.jar --add-modules ALL-MODULE-PATH " +
                      "--add-opens java.base/java.util.jar=cpw.mods.securejarhandler --add-opens java.base/java.lang.invoke=cpw.mods.securejarhandler --add-exports java.base/sun.security.util=cpw.mods.securejarhandler --add-exports jdk.naming.dns/com.sun.jndi.dns=java.naming cpw.mods.bootstraplauncher.BootstrapLauncher " +
                      "--username " +
                      nickname +
                      " --version forge-1.19.2 --gameDir " +
                      minecraft_path +
                      "/ --assetsDir " +
                      minecraft_path +
                      "/assets --assetIndex 1.19 --uuid " +
                      uuid +
                      " --accessToken " +
                      accessToken +
                      ' --clientId "" --xuid "" --userType legacy --versionType modified --width 925 --height 530 --launchTarget forgeclient --fml.forgeVersion 43.3.13 --fml.mcVersion 1.19.2 --fml.forgeGroup net.minecraftforge --fml.mcpVersion 20220805.130853';
                    command = command.toString().replace(/\\/g, "/");

                    log.info("launching minecraft with options " + command);

                    command = command.split(" ");

                    const launch = childProcess.spawn(filename, command);

                    launch.stdout.on("data", (data) => {
                      if (data.includes("Stopping!")) {
                        app.quit();
                      }
                      if (data.includes("Setting user:")) {
                        BrowserWindow.fromId(6).hide();
                      }
                      log.info(data.toString());
                    });

                    launch.stderr.on("data", (data) => {
                      log.info(data.toString());
                    });
                  }
                );
              }
            }
          );
        }
      });
    }
  });
}

ipcMain.on("launch", (event, arg) => {
  log.info("Launching minecraft");

  BrowserWindow.fromId(1).hide();
  BrowserWindow.fromId(6).show();

  verifyJava();
  verifyAssets();

  let server_url = "https://luciarey.github.io/dungeoncraft/dungeoncraft";

  if (fs.existsSync(minecraft_path + "/server.txt")) {
    fs.unlinkSync(minecraft_path + "/server.txt");
  }

  const dl = new DownloaderHelper(server_url + "/server.txt", minecraft_path);

  dl.on("end", () => {
    let servertxt_path = minecraft_path + "/server.txt";
    verifyFiles(servertxt_path, minecraft_path, server_url);
  });

  dl.on("error", (err) => {
    log.error("Download server.txt Failed", err);
    BrowserWindow.fromId(7).show();
  });
  dl.start().catch((err) => log.error(err));

  isGameReady();
});

//  https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.zip  <-- java 17 installation
