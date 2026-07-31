/**
 * Smart School - Electron Main Process
 *
 * Starts the embedded Next.js server and opens a desktop window.
 * Handles:
 * - Starting/stopping the Next.js standalone server
 * - Creating the application window
 * - Managing the SQLite database in the user's app data directory
 * - Running Prisma schema push on first launch
 * - App lifecycle (quit, single instance)
 */

const { app, BrowserWindow, shell, dialog } = require("electron");
const { spawn, spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

let mainWindow = null;
let nextServer = null;
let serverPort = 3000;
let splashWindow = null;

// ========================================
// Database Setup - Store in user data dir
// ========================================
function setupDatabase() {
  const userDataPath = app.getPath("userData");
  const dbDir = path.join(userDataPath, "database");
  const dbPath = path.join(dbDir, "custom.db");

  // Create database directory
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Set environment variables for the Next.js app
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.ELECTRON_USER_DATA = userDataPath;

  console.log("Database path:", dbPath);

  // Check if database exists - if not, mark for schema push
  const dbExists = fs.existsSync(dbPath);
  if (!dbExists) {
    console.log("Database does not exist. Will run schema setup...");
  }

  return { dbPath, dbExists, dbDir, userDataPath };
}

// ========================================
// Run Prisma DB Push (create tables)
// ========================================
function runDbPush(appResourcesPath) {
  try {
    // Try to find prisma in the app resources
    const prismaCliPath = path.join(appResourcesPath, "node_modules", "prisma", "index.js");
    const schemaPath = path.join(appResourcesPath, "prisma", "schema.prisma");

    if (fs.existsSync(schemaPath)) {
      console.log("Running prisma db push to create database tables...");
      const result = spawnSync("node", [prismaCliPath, "db", "push", "--accept-data-loss"], {
        cwd: appResourcesPath,
        env: { ...process.env },
        stdio: "pipe",
        encoding: "utf8",
      });

      if (result.status === 0) {
        console.log("Database schema created successfully.");
      } else {
        console.error("Schema push failed:", result.stderr);
      }
    }
  } catch (e) {
    console.error("Error running db push:", e.message);
  }
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
function waitForServer(port, maxRetries = 60) {
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
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error("Server failed to start within timeout"));
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

  if (isDev) {
    // Development: run next dev
    console.log("Starting Next.js dev server on port", port, "...");
    const projectRoot = path.resolve(__dirname, "..");
    nextServer = spawn("npx", ["next", "dev", "-p", String(port)], {
      cwd: projectRoot,
      stdio: "pipe",
      shell: true,
      env: { ...process.env, PORT: String(port) },
    });
  } else {
    // Production: run the bundled standalone server
    console.log("Starting Next.js production server on port", port, "...");

    // In packaged app, resources are in process.resourcesPath
    const resourcesPath = process.resourcesPath;
    const serverPath = path.join(resourcesPath, "app", ".next", "standalone", "server.js");

    // Try multiple possible locations
    let actualServerPath = serverPath;
    if (!fs.existsSync(actualServerPath)) {
      const altPath = path.join(resourcesPath, ".next", "standalone", "server.js");
      if (fs.existsSync(altPath)) {
        actualServerPath = altPath;
      }
    }

    if (!fs.existsSync(actualServerPath)) {
      console.error("Server file not found at:", actualServerPath);
      dialog.showErrorBox(
        "Startup Error",
        "Could not find the application server files. Please reinstall Smart School."
      );
      app.quit();
      return;
    }

    console.log("Server file:", actualServerPath);

    // Run database schema setup if needed
    const { dbExists } = setupDatabase();
    if (!dbExists) {
      const appRoot = path.dirname(actualServerPath);
      runDbPush(appRoot);
    }

    // Start the server
    nextServer = spawn("node", [actualServerPath], {
      stdio: "pipe",
      env: {
        ...process.env,
        PORT: String(port),
        HOSTNAME: "127.0.0.1",
      },
    });
  }

  nextServer.stdout.on("data", (data) => {
    console.log(`[Next.js] ${data.toString().trim()}`);
  });
  nextServer.stderr.on("data", (data) => {
    console.error(`[Next.js] ${data.toString().trim()}`);
  });

  nextServer.on("error", (err) => {
    console.error("Failed to start server process:", err);
  });

  // Wait for server to be ready
  try {
    await waitForServer(port);
    console.log(`Server is ready on port ${port}`);
    return true;
  } catch (e) {
    console.error("Failed to start server:", e.message);
    dialog.showErrorBox(
      "Startup Error",
      "Smart School could not start its internal server. Please try restarting the application."
    );
    return false;
  }
}

// ========================================
// Create Splash Screen
// ========================================
function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 350,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    center: true,
    show: true,
  });

  // Create a simple splash HTML
  const splashHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Arial, sans-serif;
        background: linear-gradient(135deg, #059669, #0d9488);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        color: white;
        border-radius: 12px;
        overflow: hidden;
      }
      .icon {
        font-size: 64px;
        margin-bottom: 20px;
      }
      h1 { margin: 0 0 8px 0; font-size: 28px; font-weight: 700; }
      p { margin: 0; opacity: 0.9; font-size: 14px; }
      .spinner {
        margin-top: 30px;
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .footer {
        position: absolute;
        bottom: 20px;
        font-size: 11px;
        opacity: 0.7;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="icon">🎓</div>
    <h1>Smart School</h1>
    <p>Version 4.0.0</p>
    <p style="margin-top:5px;opacity:0.8;">Starting application...</p>
    <div class="spinner"></div>
    <div class="footer">Sisi Technology Ltd, Jos Plateau State, Nigeria</div>
  </body>
  </html>`;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

// ========================================
// Create Main Window
// ========================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Smart School v4.0.0",
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#f8fafc",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Load the Next.js app
  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
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
    // Show splash screen
    createSplashScreen();

    // Setup database (in dev mode, setup is handled by scripts/setup.js)
    if (app.isPackaged) {
      setupDatabase();
    }

    // Start the Next.js server
    const serverStarted = await startNextServer();

    if (serverStarted) {
      createWindow();
    } else {
      if (splashWindow) splashWindow.close();
      app.quit();
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (nextServer) {
    try { nextServer.kill(); } catch {}
    nextServer = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextServer) {
    try { nextServer.kill(); } catch {}
    nextServer = null;
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
