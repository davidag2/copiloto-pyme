import { spawn } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");
const outputDir = path.join(root, "figma-dashboard-screens");
const port = Number(process.env.FIGMA_CAPTURE_PORT || 3040);
const baseUrl = process.env.FIGMA_CAPTURE_BASE_URL || `http://127.0.0.1:${port}`;

const modules = [
  ["inicio", "Inicio"],
  ["ventas", "Ventas"],
  ["caja", "Caja"],
  ["inventario", "Inventario"],
  ["clientes", "Clientes"],
  ["proyecciones", "Proyecciones"],
  ["equipo", "Equipo"],
  ["datos", "Datos"],
  ["reportes", "Reportes"],
  ["alertas", "Alertas"],
  ["configuracion", "Configuracion"]
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 90_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Wait until Next.js finishes compiling.
    }
    await sleep(1_000);
  }
  throw new Error(`No response from ${url}`);
}

function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);

  return candidates.find(Boolean);
}

async function loadPlaywright() {
  const runtimeNodeModules = "C:\\Users\\david\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
  process.env.NODE_PATH = [
    process.env.NODE_PATH,
    path.join(root, "node_modules"),
    runtimeNodeModules,
    path.join(runtimeNodeModules, ".pnpm", "node_modules")
  ].filter(Boolean).join(";");
  const require = createRequire(import.meta.url);
  require("module").Module._initPaths();
  return require("playwright");
}

async function prepareOutput() {
  await mkdir(outputDir, { recursive: true });
  for (const fileName of await readdir(outputDir)) {
    if (fileName.endsWith(".png")) {
      await rm(path.join(outputDir, fileName));
    }
  }
}

function startServer() {
  if (process.env.FIGMA_CAPTURE_BASE_URL) return null;

  const server = spawn(
    "cmd.exe",
    ["/c", "npm.cmd", "run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    { cwd: root, windowsHide: true, env: { ...process.env } }
  );
  server.stdout.on("data", (data) => process.stdout.write(`[next] ${data}`));
  server.stderr.on("data", (data) => process.stderr.write(`[next-err] ${data}`));
  return server;
}

async function stopServer(server) {
  if (!server) return;

  if (process.platform === "win32" && server.pid) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], { windowsHide: true });
      let timeout;
      const done = () => {
        clearTimeout(timeout);
        resolve();
      };
      timeout = setTimeout(resolve, 2_000);
      killer.on("exit", done);
      killer.on("error", done);
    });
    return;
  }

  server.kill("SIGTERM");
}

async function validateRenderedDashboard(page) {
  await page.waitForSelector(".app-shell", { timeout: 45_000 });
  await page.waitForFunction(() => document.fonts.status === "loaded", null, { timeout: 20_000 });
  await page.waitForFunction(() => {
    const shell = document.querySelector(".app-shell");
    const sidebar = document.querySelector(".sidebar");
    const navItem = document.querySelector(".nav-item");
    if (!shell || !sidebar || !navItem) return false;
    const shellStyle = window.getComputedStyle(shell);
    const sidebarRect = sidebar.getBoundingClientRect();
    const navStyle = window.getComputedStyle(navItem);
    return shellStyle.display === "grid" && sidebarRect.width >= 80 && Number.parseFloat(navStyle.borderRadius) > 0;
  }, null, { timeout: 20_000 });
}

async function main() {
  await prepareOutput();
  const server = startServer();
  try {
    await waitForServer(baseUrl);
    const { chromium } = await loadPlaywright();
    const executablePath = findChromeExecutable();
    const browser = await chromium.launch({
      headless: true,
      executablePath,
      args: ["--font-render-hinting=none"]
    });
    const context = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
      deviceScaleFactor: 1,
      colorScheme: "light"
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);

    for (let index = 0; index < modules.length; index += 1) {
      const [moduleId, label] = modules[index];
      const fileName = `${String(index + 1).padStart(2, "0")}-${moduleId}.png`;
      const url = `${baseUrl}/internal/figma-dashboard-capture?module=${moduleId}`;
      await page.goto(url, { waitUntil: "networkidle" });
      await validateRenderedDashboard(page);
      await page.screenshot({ path: path.join(outputDir, fileName), fullPage: false });
      process.stdout.write(`Captured ${label}: ${fileName}\n`);
    }

    await browser.close();
    process.stdout.write(`\nScreenshots ready: ${outputDir}\n`);
  } finally {
    await stopServer(server);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
