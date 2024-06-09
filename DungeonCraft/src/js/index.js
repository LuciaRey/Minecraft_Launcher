const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const fsPromise = require("node:fs/promises");
const { nativeTheme } = require("electron");
const childProcess = require("child_process");
const { DownloaderHelper } = require("node-downloader-helper");
const unpacker = require("unpacker-with-progress");
const log = require("electron-log/main");
const { updateElectronApp } = require("update-electron-app");
const { pseudoRandomBytes } = require("node:crypto");
updateElectronApp();

if (require("electron-squirrel-startup")) {
  app.quit();
}

nativeTheme.themeSource = "dark";

fs.unlink("./logs/main.log", (err) => {});
log.transports.file.resolvePathFn = () => "./logs/main.log";

let game_path =
  process.env.APPDATA ||
  (process.platform === "darwin"
    ? process.env.HOME + "\\Library\\minercraft"
    : process.env.HOME + "\\minecraft");

let java_path = game_path + "\\.dungeoncraft\\java";
let minecraft_path = game_path + "\\.dungeoncraft\\dungeoncraft";

async function createDir(path) {
  const dirCreation = await fsPromise.mkdir(path, { recursive: true });
  return dirCreation;
}

async function readJson(path) {
  let json = await fsPromise.readFile(path);
  json = JSON.parse(json);
  return json;
}

let mainWindow = "mainWindow";
let loadingWindow = "loadingWindow";
let settingsWindow = "settingsWindow";

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 730,
    height: 400,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#1F1F2D",
      symbolColor: "#c4c3f4",
      height: 32,
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../html+css/index.html"));
};

const createNewWindow = (
  winName,
  winWidth,
  winHeight,
  winPath,
  winModal,
  winParent
) => {
  winName = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    modal: winModal,
    parent: winParent,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#1F1F2D",
      symbolColor: "#c4c3f4",
      height: 32,
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  winName.loadFile(path.join(__dirname, winPath));
};

async function settings() {
  try {
    let json = await readJson("./launcher_settings.json").catch(() => {});
    if (json.hasOwnProperty("game_path")) {
      game_path = json.game_path;
      minecraft_path = game_path + "\\.dungeoncraft\\dungeoncraft";
    }
    if (json.hasOwnProperty("java_path")) java_path = json.java_path;
    else java_path = game_path + "\\.dungeoncraft\\java";
    if (!json.hasOwnProperty("clientToken")) {
      let rnd = "";
      while (rnd.length < 30) {
        rnd += Math.random().toString(36).substring(2);
      }
      json.clientToken = rnd;
      fs.writeFile(
        "./launcher_settings.json",
        JSON.stringify(json, "", 2),
        () => {}
      );
    }
  } catch (err) {
    let rnd = "";
    while (rnd.length < 30) rnd += Math.random().toString(36).substring(2);
    let settings = {
      clientToken: rnd,
    };
    fs.writeFile(
      "./launcher_settings.json",
      JSON.stringify(settings, "", 2),
      () => {}
    );
    log.info("Created launcher_settings");
  }

  createDir(minecraft_path + "\\natives").catch(console.error);
  createDir(java_path).catch(console.error);

  checkJavaArgs();
}

async function checkJavaArgs() {
  let json = await readJson("./launcher_settings.json").catch(() => {});
  if (!json.hasOwnProperty("java_args")) {
    if (process.platform === "win32") {
      json.java_args =
        "-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump -Xms2048M -Xmx8192M";
    } else if (process.platform === "darwin") {
      json.java_args = "-XstartOnFirstThread -Xms2048M -Xmx8192M";
    } else json.java_args = "-Xms2048M -Xmx8192M";
  }
  fs.writeFile(
    "./launcher_settings.json",
    JSON.stringify(json, "", 2),
    console.error
  );
}

const authorization = (parent) => {
  let authWindow;
  createNewWindow(authWindow, 512, 512, "../html+css/auth.html", true, parent);
};

async function isAuthorized() {
  await settings();
  log.silly("Релиз - Завтра");

  let json = await readJson("./launcher_settings.json").catch(() => {});
  if (
    !json.hasOwnProperty("uuid") ||
    !json.hasOwnProperty("accessToken") ||
    !json.hasOwnProperty("nickname")
  ) {
    authorization(mainWindow);
  }
}

app.whenReady().then(() => {
  createWindow();
  isAuthorized();

  ipcMain.on("change-settings", (event, settings) => {
    changeSettings(settings);
  });
  ipcMain.on("settings", () => {
    createNewWindow(
      settingsWindow,
      720,
      660,
      "../html+css/settings.html",
      true,
      mainWindow
    );
  });
  ipcMain.handle("dialog:openFolder", handleFolderOpen);
  ipcMain.handle("get-settings", (event, settings) => {
    return getSettings(settings);
  });
  ipcMain.handle("error", (event, err) => {
    return showError(err);
  });
  ipcMain.on("close-window", (event) => {
    event.sender.getOwnerBrowserWindow().close();
  });
  ipcMain.on("close-app", () => {
    app.quit();
  });
  ipcMain.on("auth", () => {
    authorization(settingsWindow);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

async function changeSettings(settings) {
  let json = await readJson("./launcher_settings.json").catch(() => {});
  let keys = Object.keys(settings);
  if (keys.length !== 0) {
    for (var key of keys) {
      json[key] = settings[key];
    }
  }
  fs.writeFile(
    "./launcher_settings.json",
    JSON.stringify(json, "", 2),
    console.error
  );
}

async function handleFolderOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (!canceled) {
    return filePaths[0];
  }
}

async function getSettings(settings) {
  let json = await readJson("./launcher_settings.json").catch(() => {});
  if (settings === "tokens") {
    let tokens = {
      accessToken: json.accessToken,
      clientToken: json.clientToken,
    };
    return tokens;
  } else {
    return json[settings];
  }
}

let assets_are_ready = false;
let java_is_ready = false;
let files_are_ready = false;
let game_is_ready = false;

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

async function verifyFiles(src_path, dest_path, server_url) {
  let filesOnServer = await fsPromise.readFile(src_path, "utf8");
  filesOnServer = filesOnServer.split(",");
  let filesOnClient = giveMeFiles(dest_path, "/", "");
  let filesForMyPlatform = [];

  for (var x of filesOnServer) {
    if (x.includes("windows")) {
      if (process.platform === "win32" || x.includes("mods")) {
        filesForMyPlatform.push(x);
      }
    } else if (x.includes("linux")) {
      if (process.platform === "linux" || x.includes("mods")) {
        filesForMyPlatform.push(x);
      }
    } else if (x.includes("macos")) {
      if (process.platform === "darwin" || x.includes("mods")) {
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

        if (y.length > 1) {
          y.pop();
          if (y.length > 1) {
            y = "/" + y.join("/");
          } else {
            y = "/" + y;
          }

          await createDir(dest_path + y).catch(console.error);
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
      fs.unlink(minecraft_path + "/server.txt", (err) => {});
      log.info("files are ok");
      files_are_ready = true;
    }
  }
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
    fs.unlink(dest_path + "/" + fileName, (err) => {});
  });
}

async function verifyJava(java_path) {
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

async function verifyAssets(minecraft_path) {
  if (
    !fs.existsSync(minecraft_path + "/assets/indexes") ||
    !fs.existsSync(minecraft_path + "/assets/objects")
  ) {
    if (!fs.existsSync(minecraft_path + "/assets" + "/assets.zip")) {
      log.info("assets are missing | downloading assets");

      fs.mkdir(minecraft_path + "/assets", (err) => {});

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

async function isGameReady(minecraft_path, java_path) {
  while (!game_is_ready) {
    if (java_is_ready && assets_are_ready && files_are_ready) {
      log.info("launching game");
      log.silly("привет от V");
      launchingGame(minecraft_path, java_path);
      game_is_ready = true;
    }
    await sleep(2000);
  }
}

async function prepareLibs(platformSep) {
  log.info("preparing 1.19.2 libraries");

  let json_1_19_2 = await readJson(
    minecraft_path + "/versions/1.19.2/1.19.2.json"
  ).catch(() => {});

  let cp1 = [];

  for (let i = 0; i < json_1_19_2["libraries"].length; i++) {
    let path =
      minecraft_path +
      "/libraries/" +
      json_1_19_2["libraries"][i]["downloads"]["artifact"]["path"];

    if (json_1_19_2["libraries"][i].hasOwnProperty("rules")) {
      let platform = json_1_19_2["libraries"][i]["rules"][0]["os"]["name"];
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

  log.info("preparing forge libraries");
  let cp2 = [];

  let json_forge = await readJson(
    minecraft_path + "/versions/1.19.2-forge-43.3.13/1.19.2-forge-43.3.13.json"
  ).catch(() => {});
  for (let i = 0; i < json_forge["libraries"].length; i++) {
    cp2.push(
      minecraft_path +
        "/libraries/" +
        json_forge["libraries"][i]["downloads"]["artifact"]["path"] +
        platformSep
    );
  }

  let cp = cp1.concat(cp2);
  cp = cp.toString().replace(/\\/g, "/");
  cp = cp.toString().replace(/,/g, "");
  return cp;
}

async function launchingGame(minecraft_path, java_path) {
  let json = await readJson("./launcher_settings.json").catch(() => {});

  let platformSep = ";";
  if (process.platform !== "win32") {
    platformSep = ":";
  }

  createNewWindow(
    loadingWindow,
    512,
    512,
    "../html+css/loading.html",
    false,
    mainWindow
  );

  mainWindow.hide();

  log.silly("<3");

  java_path += "/jdk-17.0.11";
  let command = "" + java_path + "/bin/javaw.exe";
  if (process.platform == "linux") {
    command = "" + java_path + "/bin/java";
  }
  command = command.toString().replace(/\\/g, "/");

  let cp = await prepareLibs(platformSep);

  let args =
    "-javaagent:" +
    minecraft_path +
    "/libraries/com/mojang/authlib/3.11.49/authlib-injector-1.2.5.jar=ely.by -XX:+UnlockExperimentalVMOptions " +
    json.java_args +
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
    json.nickname +
    " --version forge-1.19.2 --gameDir " +
    minecraft_path +
    "/ --assetsDir " +
    minecraft_path +
    "/assets --assetIndex 1.19 --uuid " +
    json.uuid +
    " --accessToken " +
    json.accessToken +
    ' --clientId "" --xuid "" --userType legacy --versionType modified --width 925 --height 530 --launchTarget forgeclient --fml.forgeVersion 43.3.13 --fml.mcVersion 1.19.2 --fml.forgeGroup net.minecraftforge --fml.mcpVersion 20220805.130853';
  args = args.toString().replace(/\\/g, "/");

  log.info("launching minecraft with options " + command + " " + args);

  args = args.split(" ");

  const launch = childProcess.spawn(command, args);

  launch.stdout.on("data", (data) => {
    if (data.includes("Stopping!")) {
      app.quit();
    }
    if (data.includes("Setting user:")) {
      mainWindow.hide();
    }
    log.info(data.toString());
  });

  launch.stderr.on("data", (data) => {
    log.info(data.toString());
  });

  launch.on("exit", () => {
    app.quit();
  });

  game_is_ready = false;
  files_are_ready = false;
  java_is_ready = false;
  assets_are_ready = false;
}

ipcMain.on("launch", (event, arg) => {
  log.info("Launching minecraft");

  fs.readFile("./launcher_settings.json", (err, json) => {
    json = JSON.parse(json);

    if (json.hasOwnProperty("game_path")) game_path = json.game_path;
    else {
      game_path =
        process.env.APPDATA ||
        (process.platform === "darwin"
          ? process.env.HOME + "\\Library\\minercraft"
          : process.env.HOME + "\\minecraft");
    }
    if (json.hasOwnProperty("java_path")) java_path = json.java_path;
    else {
      if (
        game_path[game_path.length - 1] !== "/" &&
        game_path[game_path.length - 1] !== "\\"
      )
        java_path = game_path + "\\.dungeoncraft\\java";
      else java_path = game_path + ".dungeoncraft\\java";
    }
    if (
      game_path[game_path.length - 1] !== "/" &&
      game_path[game_path.length - 1] !== "\\"
    )
      minecraft_path = game_path + "\\.dungeoncraft\\dungeoncraft";
    else minecraft_path = game_path + ".dungeoncraft\\dungeoncraft";
  });

  verifyJava(java_path);
  verifyAssets(minecraft_path);

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
    showError("server-connection");
  });
  dl.start().catch((err) => log.error(err));

  isGameReady(minecraft_path, java_path);
});

let error = "";

async function showError(err) {
  if (err !== "type") {
    let errWindow;
    createNewWindow(
      errWindow,
      512,
      512,
      "../html+css/error.html",
      true,
      mainWindow
    );
    error = err;
  } else return error;
}
