// main.js — boots the game: canvas, input, the frame loop. With a ?shot=
// query it instead sets up one screenshot scene, draws a single frame and
// flags it ready, which is how the screenshots in screenshots/ were taken.

import { VIEW } from "./config.js";
import { createInput } from "./input.js";
import { drawWorld } from "./render.js";
import { setupShot } from "./shots.js";
import { createWorld, startDay, updateWorld } from "./world.js";
import { setMuted, unlockAudio } from "./audio.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get("shot");
const seed = Number(params.get("seed") ?? 1) || 1;

const world = createWorld(seed);
const input = createInput(canvas);

if (shotName) {
  setMuted(true);
  setupShot(world, shotName, seed);
  drawWorld(ctx, world);
  window.__shotReady = true;
} else {
  window.addEventListener("pointerdown", unlockAudio, { once: false });
  window.addEventListener("keydown", unlockAudio, { once: false });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (world.mode === "playing") {
      updateWorld(world, input, dt);
    } else if (input.takeStartPress()) {
      unlockAudio();
      startDay(world);
    }
    drawWorld(ctx, world);
    const status = document.getElementById("status");
    if (status) {
      status.textContent = world.mode === "playing"
        ? `${Math.ceil(world.dayLeft)} seconds left, $${world.coins} earned, ${world.served} dishes served.`
        : "Sizzle and Serve: press E or click to play.";
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
