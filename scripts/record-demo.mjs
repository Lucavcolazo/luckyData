#!/usr/bin/env node
/**
 * Records the README demo like a screen-recording app would edit it: a visible cursor glides to the
 * search box, the camera zooms in while the profile is typed, pulls back when it searches, pushes in
 * on the verdict, then scrolls through the stats. Needs the app running (npm run dev).
 *
 *   node scripts/record-demo.mjs [--url <steam profile>] [--base http://localhost:3000] [--out docs/demo]
 *
 * How: Playwright records the page with an injected cursor and logs where the camera should look and
 * when. ffmpeg then applies that camera path (zoompan) and exports <out>.mp4 and <out>.gif.
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const BASE = arg("base", "http://localhost:3000");
const PROFILE = arg("url", "https://steamcommunity.com/id/colitoo69/");
const OUT = resolve(arg("out", "docs/demo"));

const VIEWPORT = { width: 1440, height: 900 };
// Playwright records at the viewport's CSS size whatever the deviceScaleFactor (a bigger video size
// just pads the frame), so the camera works in viewport pixels and zooms stay moderate to keep detail.
const VIDEO = VIEWPORT;
const FPS = 30;
const ZOOM_TYPING = 1.6;
const ZOOM_VERDICT = 1.3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/** Fake cursor + click ripple, injected into every page: headless recordings don't show the real one. */
function installCursor() {
  const install = () => {
    if (document.getElementById("__demo_cursor")) return;
    const cursor = document.createElement("div");
    cursor.id = "__demo_cursor";
    cursor.innerHTML =
      '<svg width="30" height="30" viewBox="0 0 30 30"><path d="M5 3l19 11.5-8.4 2 5.2 9.3-4 2.1-5.2-9.4L6 24.8z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(cursor.style, {
      position: "fixed",
      left: "0",
      top: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
      transform: "translate(-200px,-200px)",
      transition: "scale 120ms ease-out",
      filter: "drop-shadow(0 3px 4px rgba(0,0,0,.45))",
    });
    document.documentElement.appendChild(cursor);

    addEventListener(
      "mousemove",
      (e) => {
        cursor.style.transform = `translate(${e.clientX - 5}px,${e.clientY - 3}px)`;
      },
      { capture: true, passive: true },
    );
    addEventListener(
      "mousedown",
      (e) => {
        cursor.style.scale = "0.85";
        const ring = document.createElement("div");
        Object.assign(ring.style, {
          position: "fixed",
          left: `${e.clientX - 18}px`,
          top: `${e.clientY - 18}px`,
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "3px solid #e9d6b8",
          zIndex: "2147483646",
          pointerEvents: "none",
        });
        document.documentElement.appendChild(ring);
        ring
          .animate(
            [
              { transform: "scale(0.3)", opacity: 1 },
              { transform: "scale(1.8)", opacity: 0 },
            ],
            { duration: 550, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
          )
          .finished.then(() => ring.remove());
      },
      true,
    );
    addEventListener("mouseup", () => (cursor.style.scale = "1"), true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
}

async function record() {
  const tmpDir = resolve(dirname(OUT), ".demo-tmp");
  mkdirSync(tmpDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: "dark",
    recordVideo: { dir: tmpDir, size: VIDEO },
  });
  await context.addInitScript(installCursor);
  const recordingStart = Date.now();
  const page = await context.newPage();

  const now = () => (Date.now() - recordingStart) / 1000;
  let mouse = { x: VIEWPORT.width * 0.78, y: VIEWPORT.height * 0.86 };

  /** Eased glide from the current position, in CSS pixels. */
  async function glide(x, y, ms) {
    const from = { ...mouse };
    const steps = Math.max(1, Math.round(ms / 16));
    for (let i = 1; i <= steps; i++) {
      const e = easeInOut(i / steps);
      await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
      await sleep(16);
    }
    mouse = { x, y };
  }

  async function wheel(pixels, ms) {
    const steps = Math.round(ms / 16);
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, pixels / steps);
      await sleep(16);
    }
  }

  /** Centre of an element in viewport (= video) pixels. */
  async function centerOf(selector) {
    const box = await page.locator(selector).first().boundingBox();
    if (!box) return { cx: VIDEO.width / 2, cy: VIDEO.height / 2 };
    return { cx: box.x + box.width / 2, cy: box.y + box.height / 2 };
  }

  // Camera keyframes: between two keys the camera eases from one framing to the next.
  const wide = { z: 1, cx: VIDEO.width / 2, cy: VIDEO.height / 2 };
  const keys = [];
  const key = (t, frame) => keys.push({ t, ...frame });

  try {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.mouse.move(mouse.x, mouse.y);
    await sleep(1600); // title entrance
    const trimStart = Math.max(0, now() - 1.2);
    key(trimStart, wide);

    // 1. Glide to the search box while the camera pushes in on the form.
    const form = await centerOf("form");
    const input = await page.locator("#profile-search").boundingBox();
    const t1 = now();
    key(t1 + 0.2, wide);
    await glide(input.x + 60, input.y + input.height / 2, 1100);
    const typing = { z: ZOOM_TYPING, ...form };
    key(now() + 0.3, typing);
    await sleep(300);
    await page.mouse.down();
    await page.mouse.up();
    await sleep(250);

    // 2. Type the profile, close up.
    await page.keyboard.type(PROFILE, { delay: 45 });
    await sleep(350);

    // 3. Over to "Buscar", click, and pull back as the app scrolls to the results.
    const button = await page.locator('form button[type="submit"]').boundingBox();
    await glide(button.x + button.width / 2, button.y + button.height / 2, 650);
    await sleep(150);
    key(now(), typing);
    await page.mouse.down();
    await page.mouse.up();
    key(now() + 0.9, wide);

    // 4. Wait for the verdict (Leetify + FACEIT), then push in on it.
    await page.waitForSelector("#verdict-title", { state: "attached", timeout: 45_000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await sleep(700);
    const verdict = await centerOf("#verdict-title");
    // A clean profile has no flag chips; only aim the cursor at one if it exists.
    const chips = page.locator('[aria-label="Métricas fuera de lo común"] button');
    const chip = (await chips.count()) > 0 ? await chips.first().boundingBox() : null;
    const tv = now();
    key(tv, wide);
    key(tv + 0.9, { z: ZOOM_VERDICT, ...verdict });
    if (chip) await glide(chip.x + chip.width / 2, chip.y + chip.height / 2, 900);
    else await sleep(900);
    await sleep(2200);
    key(now(), { z: ZOOM_VERDICT, ...verdict });
    key(now() + 0.9, wide);
    await sleep(900);

    // 5. Scroll through the stats, wide.
    await glide(VIEWPORT.width * 0.86, VIEWPORT.height * 0.55, 600);
    await wheel(900, 3200);
    await sleep(1100);
    await wheel(900, 3200);
    await sleep(1400);
    key(now(), wide);

    const video = page.video();
    await context.close();
    const raw = await video.path();
    mkdirSync(dirname(OUT), { recursive: true });
    renameSync(raw, `${OUT}.webm`);
    return { trimStart, keys };
  } finally {
    await browser.close();
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * ffmpeg expression for one camera value over time: holds the first/last key outside the range and
 * eases (cubic in-out) between consecutive keys. `it` is the input timestamp in zoompan.
 */
function trackExpr(keys, field) {
  let expr = String(keys[keys.length - 1][field]);
  for (let i = keys.length - 2; i >= 0; i--) {
    const a = keys[i];
    const b = keys[i + 1];
    const span = Math.max(0.001, b.t - a.t).toFixed(3);
    const p = `clip((it-${a.t.toFixed(3)})/${span},0,1)`;
    const eased = `if(lt(${p},0.5),4*pow(${p},3),1-pow(-2*${p}+2,3)/2)`;
    const seg = `(${a[field].toFixed(2)}+(${(b[field] - a[field]).toFixed(2)})*${eased})`;
    expr = `if(lt(it,${b.t.toFixed(3)}),${seg},${expr})`;
  }
  return `if(lt(it,${keys[0].t.toFixed(3)}),${keys[0][field].toFixed(2)},${expr})`;
}

function convert({ trimStart, keys }) {
  const hasFfmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
  if (!hasFfmpeg) {
    console.log("ffmpeg no está instalado: quedó solo el .webm, sin zooms.");
    return;
  }
  // -ss before -i resets timestamps to 0 at the trim point, so shift every key by the trim.
  const shifted = keys.map((k) => ({ ...k, t: Math.max(0, k.t - trimStart) }));
  const z = trackExpr(shifted, "z");
  const cx = trackExpr(shifted, "cx");
  const cy = trackExpr(shifted, "cy");
  const camera =
    `fps=${FPS},zoompan=z='${z}':x='clip(${cx}-iw/zoom/2,0,iw-iw/zoom)':y='clip(${cy}-ih/zoom/2,0,ih-ih/zoom)'` +
    `:d=1:s=${VIEWPORT.width}x${VIEWPORT.height}:fps=${FPS}`;

  const run = (args) => spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" }).status === 0;

  const ok = run([
    "-ss", trimStart.toFixed(2), "-i", `${OUT}.webm`,
    "-vf", `${camera},scale=1280:-2:flags=lanczos`,
    "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-pix_fmt", "yuv420p", "-an", `${OUT}.mp4`,
  ]);
  if (!ok) return;
  // GIF from the edited MP4. Palette pass keeps gradients clean; 640px, 10fps and 96 colours keep the
  // ~30s clip (zooms add a lot of changing pixels) near 8.5 MB, under GitHub's 10 MB README limit.
  run([
    "-i", `${OUT}.mp4`,
    "-vf",
    "fps=10,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
    `${OUT}.gif`,
  ]);
}

console.log(`Grabando ${PROFILE} en ${BASE}…`);
const result = await record().catch((error) => {
  console.error("No se pudo grabar:", error.message);
  console.error("¿Está corriendo la app? (npm run dev)");
  process.exit(1);
});
console.log("Editando (cursor, zooms, recorte)…");
convert(result);
console.log(`Listo: ${OUT}.mp4 y ${OUT}.gif`);
