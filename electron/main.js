/**
 * Smart School - Electron Main Process (v3)
 *
 * Fixed startup issues:
 * 1. Uses a pre-built database template (electron/assets/template.db)
 *    copied to userData on first launch — no SQL/CLI needed at runtime
 * 2. Properly locates the standalone server in packaged app
 * 3. Removes .env from standalone (prevents path override)
 * 4. Sets correct CWD and env vars for the server process
 * 5. Comprehensive logging to userData/logs/smart-school.log
 */

const { app, BrowserWindow, shell, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

let mainWindow = null;
let nextServer = null;
let serverPort = 3000;
let splashWindow = null;
let logFile = null;

// ========================================
// Logging
// ========================================
function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  if (logFile) {
    try { logFile.write(line + "\n"); } catch {}
  }
}

function setupLogging() {
  try {
    const userDataPath = app.getPath("userData");
    const logDir = path.join(userDataPath, "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logPath = path.join(logDir, "smart-school.log");
    logFile = fs.createWriteStream(logPath, { flags: "a" });
    log(`\n${"=".repeat(60)}`);
    log(`Smart School starting up...`);
    log(`Version: ${app.getVersion()}`);
    log(`Electron: ${process.versions.electron}, Node: ${process.versions.node}`);
    log(`Platform: ${process.platform}, Arch: ${process.arch}`);
    log(`User data: ${userDataPath}`);
  } catch (e) {
    console.error("Failed to setup logging:", e.message);
  }
}

// ========================================
// Database Setup — Copy template on first launch
// ========================================
function setupDatabase() {
  const userDataPath = app.getPath("userData");
  const dbDir = path.join(userDataPath, "database");
  const dbPath = path.join(dbDir, "custom.db");

  // Create database directory
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // If database doesn't exist, copy from template
  if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size < 1000) {
    log("Database does not exist, copying from template...");

    // Find the template database
    const isDev = !app.isPackaged;
    let templatePath = null;

    if (isDev) {
      // Dev mode: template is in electron/assets/
      templatePath = path.join(__dirname, "assets", "template.db");
    } else {
      // Packaged mode: template is in resources/app/electron/assets/
      const possiblePaths = [
        path.join(process.resourcesPath, "app", "electron", "assets", "template.db"),
        path.join(process.resourcesPath, "electron", "assets", "template.db"),
        path.join(__dirname, "assets", "template.db"),
      ];
      for (const p of possiblePaths) {
        log(`Checking template: ${p} -> ${fs.existsSync(p) ? "EXISTS" : "not found"}`);
        if (fs.existsSync(p)) {
          templatePath = p;
          break;
        }
      }
    }

    if (templatePath && fs.existsSync(templatePath)) {
      log(`Copying template from: ${templatePath}`);
      log(`Copying template to: ${dbPath}`);
      fs.copyFileSync(templatePath, dbPath);
      log("✓ Database template copied successfully");
    } else {
      log("ERROR: Template database not found!");
      // Create empty database file as fallback
      log("Creating empty database file as fallback");
      fs.writeFileSync(dbPath, "");
    }
  } else {
    log("Database already exists");
  }

  // Set environment variables
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.ELECTRON_USER_DATA = userDataPath;

  log(`Database path: ${dbPath}`);
  log(`Database size: ${fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0} bytes`);

  return { dbPath, dbDir, userDataPath };
}

// ========================================
// Find the standalone server file
// ========================================
function findServerFile() {
  const isDev = !app.isPackaged;

  if (isDev) {
    const devServer = path.join(__dirname, "..", ".next", "standalone", "server.js");
    if (fs.existsSync(devServer)) {
      log(`Found dev server: ${devServer}`);
      return devServer;
    }
    log("ERROR: Dev server not found. Run 'bun run build' first.");
    return null;
  }

  // In packaged app, the standalone is in resources/app/.next/standalone/
  const resourcesPath = process.resourcesPath;
  log(`Resources path: ${resourcesPath}`);

  const possiblePaths = [
    path.join(resourcesPath, "app", ".next", "standalone", "server.js"),
    path.join(resourcesPath, ".next", "standalone", "server.js"),
    path.join(__dirname, "..", ".next", "standalone", "server.js"),
  ];

  for (const p of possiblePaths) {
    log(`Checking server: ${p} -> ${fs.existsSync(p) ? "EXISTS" : "not found"}`);
    if (fs.existsSync(p)) {
      log(`Found server at: ${p}`);
      return p;
    }
  }

  // List what's actually in resources for debugging
  if (fs.existsSync(resourcesPath)) {
    log(`Resources contents: ${fs.readdirSync(resourcesPath).join(", ")}`);
    const appDir = path.join(resourcesPath, "app");
    if (fs.existsSync(appDir)) {
      log(`Resources/app contents: ${fs.readdirSync(appDir).join(", ")}`);
    }
  }

  return null;
}

// ========================================
// Find an available port
// ========================================
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(startPort, "127.0.0.1", () => {
      server.close(() => resolve(startPort));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// ========================================
// Wait for server to be ready
// ========================================
function waitForServer(port, maxRetries = 90) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/install`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 500) {
          resolve();
        } else {
          retry();
        }
      });
      req.on("error", () => retry());
      req.setTimeout(3000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error(`Server failed to start after ${maxRetries} retries`));
      } else {
        setTimeout(check, 1000);
      }
    };
    check();
  });
}

// ========================================
// Start Next.js Server
// ========================================
async function startNextServer() {
  const isDev = !app.isPackaged;
  const port = await findAvailablePort(3000);
  serverPort = port;
  log(`Using port: ${port}`);

  // Setup database (copies template if needed)
  const { dbPath, userDataPath } = setupDatabase();

  // Find the server file
  const serverPath = findServerFile();

  if (!serverPath) {
    const errorMsg = "Could not find the application server files.\n\n" +
      "This may indicate a corrupted installation.\n" +
      "Please reinstall Smart School.";
    log(`FATAL: ${errorMsg}`);
    dialog.showErrorBox("Smart School - Startup Error", errorMsg);
    return false;
  }

  const serverDir = path.dirname(serverPath);
  log(`Server directory: ${serverDir}`);

  // Remove any .env file in the standalone directory
  // (it may contain machine-specific paths that break on other machines)
  const envFile = path.join(serverDir, ".env");
  if (fs.existsSync(envFile)) {
    log(`Removing .env from standalone directory`);
    try { fs.unlinkSync(envFile); } catch {}
  }

  // Start the server
  if (isDev) {
    log("Starting in DEV mode...");
    const projectRoot = path.resolve(__dirname, "..");
    nextServer = spawn("npx", ["next", "dev", "-p", String(port)], {
      cwd: projectRoot,
      stdio: "pipe",
      shell: true,
      env: { ...process.env, PORT: String(port) },
    });
  } else {
    log("Starting in PRODUCTION mode...");
    log(`Spawning: node ${serverPath}`);
    log(`DATABASE_URL: file:${dbPath}`);
    nextServer = spawn("node", [serverPath], {
      cwd: serverDir,
      stdio: "pipe",
      env: {
        ...process.env,
        PORT: String(port),
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
        DATABASE_URL: `file:${dbPath}`,
        ELECTRON_USER_DATA: userDataPath,
      },
    });
  }

  nextServer.stdout.on("data", (data) => {
    log(`[Server] ${data.toString().trim()}`);
  });
  nextServer.stderr.on("data", (data) => {
    log(`[Server] ${data.toString().trim()}`);
  });
  nextServer.on("error", (err) => {
    log(`Failed to spawn server: ${err.message}`);
  });
  nextServer.on("exit", (code, signal) => {
    log(`Server exited: code=${code}, signal=${signal}`);
  });

  // Wait for server to be ready
  try {
    await waitForServer(port);
    log(`✓ Server is ready on port ${port}!`);
    return true;
  } catch (e) {
    log(`✗ Server startup failed: ${e.message}`);
    dialog.showErrorBox(
      "Smart School - Startup Error",
      "Smart School could not start its internal server.\n\n" +
      "Please try:\n" +
      "1. Run Smart School as Administrator\n" +
      "2. Add Smart School to your antivirus exceptions\n" +
      "3. Restart your computer and try again\n" +
      "4. Reinstall the application\n\n" +
      `Log file: ${path.join(app.getPath("userData"), "logs", "smart-school.log")}`
    );
    return false;
  }
}

// ========================================
// Splash Screen
// ========================================
function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 500, height: 350, frame: false, alwaysOnTop: true,
    resizable: false, center: true, show: true,
  });

  const splashHtml = `<!DOCTYPE html>
<html><head><style>
body{margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(135deg,#059669,#0d9488);display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:white;border-radius:12px;overflow:hidden}
.icon{font-size:64px;margin-bottom:20px}
h1{margin:0 0 8px 0;font-size:28px;font-weight:700}
p{margin:0;opacity:0.9;font-size:14px}
.spinner{margin-top:30px;width:40px;height:40px;border:3px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.8s linear infinite}
.footer{position:absolute;bottom:20px;font-size:11px;opacity:0.7}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body>
<div class="icon">🎓</div>
<h1>Smart School</h1>
<p>Version 4.0.0</p>
<p style="margin-top:5px;opacity:0.8;">Starting application...</p>
<div class="spinner"></div>
<div class="footer">Sisi Technology Ltd, Jos Plateau State, Nigeria</div>
</body></html>`;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
  splashWindow.on("closed", () => { splashWindow = null; });
}

// ========================================
// Main Window
// ========================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1024, minHeight: 700,
    title: "Smart School v4.0.0", show: false, autoHideMenuBar: true,
    backgroundColor: "#f8fafc",
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  mainWindow.once("ready-to-show", () => {
    if (splashWindow) { splashWindow.close(); splashWindow = null; }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

// ========================================
// App Lifecycle
// ========================================
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    setupLogging();
    createSplashScreen();
    const serverStarted = await startNextServer();
    if (serverStarted) {
      createWindow();
    } else {
      if (splashWindow) splashWindow.close();
      app.quit();
    }
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (nextServer) { try { nextServer.kill(); } catch {} nextServer = null; }
  if (logFile) { try { logFile.end(); } catch {} }
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextServer) { try { nextServer.kill(); } catch {} nextServer = null; }
});

process.on("uncaughtException", (error) => {
  log(`Uncaught Exception: ${error.stack || error.message}`);
});
