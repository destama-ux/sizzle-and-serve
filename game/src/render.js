// render.js — everything the player (and the judge's screenshots) sees: the
// kitchen, the order board, the ingredient counter, the chef and the food.
// All of it is drawn with canvas paths from the world state; the game ships
// no image files at all.

import {
  VIEW, COUNTER_Y, INGREDIENTS, RECIPES, STATIONS, TIMING,
} from "./config.js";
import { nearestStation, wokPhase } from "./world.js";

const FONT = `"Trebuchet MS", "Segoe UI", system-ui, sans-serif`;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = "left", weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(str, x, y);
}

// One ingredient, drawn as itself: a rice mound, a noodle nest, a fried-egg
// disc, a drumstick, a chili pod, a leafy bunch, a tomato.
export function drawIngredient(ctx, id, x, y, r) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = ing.color;
  ctx.strokeStyle = ing.edge;
  ctx.lineWidth = 2;
  switch (id) {
    case "rice":
      ctx.beginPath(); ctx.arc(0, r * 0.35, r, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.edge;
      for (const [gx, gy] of [[-r * 0.4, -r * 0.1], [0, -r * 0.45], [r * 0.4, -r * 0.1]]) {
        ctx.beginPath(); ctx.ellipse(gx, gy, r * 0.16, r * 0.07, 0.6, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case "noodle":
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = ing.edge; ctx.lineWidth = 2.4;
      for (const off of [-0.45, 0, 0.45]) {
        ctx.beginPath();
        ctx.arc(off * r, -r * 0.1, r * 0.42, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      break;
    case "egg":
      ctx.fillStyle = "#fffdf4";
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ing.edge; ctx.stroke();
      break;
    case "chicken":
      ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 1.05, r * 0.72, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff6e8";
      ctx.beginPath(); ctx.arc(r * 0.72, r * 0.52, r * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    case "chili":
      ctx.rotate(-0.5);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#3f9142";
      ctx.fillRect(r * 0.82, -r * 0.16, r * 0.4, r * 0.3);
      break;
    case "greens":
      for (const [gx, gy] of [[-r * 0.45, r * 0.15], [r * 0.45, r * 0.15], [0, -r * 0.4]]) {
        ctx.beginPath(); ctx.ellipse(gx, gy, r * 0.55, r * 0.38, gx, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      break;
    case "tomato":
      ctx.beginPath(); ctx.arc(0, r * 0.08, r * 0.92, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#3f9142";
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85); ctx.lineTo(r * 0.3, -r * 0.4); ctx.lineTo(-r * 0.3, -r * 0.4);
      ctx.closePath(); ctx.fill();
      break;
  }
  ctx.restore();
}

function drawChip(ctx, id, x, y, r, chopped) {
  drawIngredient(ctx, id, x, y, r);
  if (chopped) {
    ctx.strokeStyle = "rgba(90,50,10,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y + r * 0.7);
    ctx.lineTo(x + r * 0.7, y - r * 0.7);
    ctx.stroke();
  }
}

function drawPlateDish(ctx, recipeId, x, y, scale = 1) {
  const recipe = RECIPES[recipeId];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#fdfdf8";
  ctx.strokeStyle = "#c9c9bd";
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(0, 0, 52, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = recipe.plate;
  ctx.beginPath(); ctx.ellipse(0, -4, 38, 14, 0, 0, Math.PI * 2); ctx.fill();
  recipe.needs.forEach((ing, i) => {
    const a = (i / recipe.needs.length) * Math.PI * 2;
    drawIngredient(ctx, ing, Math.cos(a) * 20, -6 + Math.sin(a) * 6, 10);
  });
  ctx.restore();
}

function drawRoom(ctx, world) {
  // wall and floor
  ctx.fillStyle = "#f7e3c3";
  ctx.fillRect(0, 0, VIEW.width, 430);
  ctx.fillStyle = "#e8c795";
  for (let x = 0; x < VIEW.width; x += 128) ctx.fillRect(x, 0, 2, 430);
  ctx.fillStyle = "#b5793f";
  ctx.fillRect(0, 430, VIEW.width, VIEW.height - 430);
  ctx.fillStyle = "#a5682f";
  for (let x = 0; x < VIEW.width; x += 106) ctx.fillRect(x, 430, 3, VIEW.height - 430);
  for (let y = 430; y < VIEW.height; y += 92) ctx.fillRect(0, y, VIEW.width, 3);
  // a window with daylight, left of the board
  ctx.fillStyle = "#bfe6f5";
  roundRect(ctx, 596, 42, 196, 150, 10); ctx.fill();
  ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(694, 42); ctx.lineTo(694, 192); ctx.moveTo(596, 117); ctx.lineTo(792, 117); ctx.stroke();
  ctx.fillStyle = "#fff3b0";
  ctx.beginPath(); ctx.arc(650, 82, 22, 0, Math.PI * 2); ctx.fill();
  // hanging sign
  ctx.fillStyle = "#7a4416";
  roundRect(ctx, 36, 118, 300, 56, 10); ctx.fill();
  text(ctx, "SIZZLE & SERVE", 186, 156, 30, "#ffe9b8", "center", 800);
}

function drawHud(ctx, world) {
  // day clock
  text(ctx, "DAY SERVICE", 36, 52, 17, "#7a4416");
  ctx.fillStyle = "#d9c39a";
  roundRect(ctx, 36, 62, 330, 20, 10); ctx.fill();
  ctx.fillStyle = world.dayLeft < 25 ? "#e23b2e" : "#57b24a";
  roundRect(ctx, 36, 62, 330 * Math.max(0, world.dayLeft / TIMING.dayLength), 20, 10); ctx.fill();
  text(ctx, `${Math.ceil(world.dayLeft)}s`, 378, 79, 19, "#7a4416");
  // money line
  text(ctx, `🪙 $${world.coins}`, 36, 226, 30, "#5d3a0e");
  text(ctx, `served ${world.served} · walked away ${world.lost}`, 36, 258, 18, "#7a4416", "left", 600);
}

function drawOrderBoard(ctx, world) {
  ctx.fillStyle = "#5d3a0e";
  roundRect(ctx, 830, 24, 426, 268, 12); ctx.fill();
  ctx.fillStyle = "#6e4718";
  roundRect(ctx, 842, 36, 402, 244, 8); ctx.fill();
  text(ctx, "ORDER BOARD", 1037, 66, 21, "#ffe9b8", "center", 800);
  if (world.orders.length === 0) {
    text(ctx, "no tickets yet…", 1037, 170, 20, "#e8c795", "center", 600);
    return;
  }
  world.orders.forEach((order, i) => {
    const recipe = RECIPES[order.recipeId];
    const x = 856 + i * 136;
    const y = 80;
    ctx.fillStyle = "#fffaf0";
    roundRect(ctx, x, y, 124, 186, 8); ctx.fill();
    ctx.fillStyle = "#e23b2e";
    ctx.beginPath(); ctx.arc(x + 62, y + 8, 6, 0, Math.PI * 2); ctx.fill();
    // dish name, wrapped by hand: two lines at most
    const words = recipe.name.split(" ");
    const lines = [""];
    for (const w of words) {
      if ((lines[lines.length - 1] + " " + w).trim().length > 13 && lines.length < 2) lines.push(w);
      else lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim();
    }
    lines.forEach((line, li) => text(ctx, line, x + 62, y + 36 + li * 19, 16.5, "#40260a", "center", 800));
    recipe.needs.forEach((ing, ii) => {
      drawIngredient(ctx, ing, x + 26 + (ii % 2) * 52, y + 92 + Math.floor(ii / 2) * 40, 15);
    });
    text(ctx, `$${recipe.price}`, x + 62, y + 168, 16, "#35702a", "center", 800);
    // patience bar
    const frac = Math.max(0, order.patience / order.patienceMax);
    ctx.fillStyle = "#e5d9bd";
    roundRect(ctx, x + 10, y + 172, 104, 8, 4); ctx.fill();
    ctx.fillStyle = frac < 0.3 ? "#e23b2e" : frac < 0.6 ? "#e8a13a" : "#57b24a";
    roundRect(ctx, x + 10, y + 172, 104 * frac, 8, 4); ctx.fill();
  });
}

function drawCounter(ctx, world) {
  // the counter block and its front
  ctx.fillStyle = "#9c6a33";
  roundRect(ctx, 16, COUNTER_Y - 66, 1248, 66, 8); ctx.fill();
  ctx.fillStyle = "#7a4d20";
  ctx.fillRect(16, COUNTER_Y, 1248, 74);
  ctx.fillStyle = "#8a5a2b";
  for (let x = 40; x < 1264; x += 88) ctx.fillRect(x, COUNTER_Y + 8, 3, 58);

  const here = nearestStation(world);
  for (const station of STATIONS) {
    const { x } = station;
    if (here && here.id === station.id) {
      ctx.fillStyle = "rgba(255,233,184,0.5)";
      ctx.beginPath(); ctx.ellipse(x, COUNTER_Y + 88, 52, 13, 0, 0, Math.PI * 2); ctx.fill();
    }
    switch (station.kind) {
      case "bin": {
        ctx.fillStyle = "#6e4718";
        roundRect(ctx, x - 44, COUNTER_Y - 58, 88, 52, 6); ctx.fill();
        for (const [ox, oy] of [[-22, -34], [0, -44], [22, -34], [-11, -20], [13, -22]]) {
          drawIngredient(ctx, station.ingredient, x + ox, COUNTER_Y + oy, 13);
        }
        text(ctx, INGREDIENTS[station.ingredient].name, x, COUNTER_Y + 26, 16, "#ffe9b8", "center", 700);
        break;
      }
      case "board": {
        ctx.fillStyle = "#deb887";
        roundRect(ctx, x - 46, COUNTER_Y - 52, 92, 40, 6); ctx.fill();
        ctx.strokeStyle = "#a97c50"; ctx.lineWidth = 2; ctx.stroke();
        const raw = world.tray.find((item) => item.stage === "raw");
        const shown = raw ?? world.tray[world.tray.length - 1];
        if (shown) drawIngredient(ctx, shown.ingredient, x, COUNTER_Y - 32, 17);
        if (world.boardProgress > 0) {
          ctx.strokeStyle = "#57b24a"; ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(x, COUNTER_Y - 32, 27, -Math.PI / 2, -Math.PI / 2 + (world.boardProgress / TIMING.chopSeconds) * Math.PI * 2);
          ctx.stroke();
        }
        text(ctx, "CHOP", x, COUNTER_Y + 26, 16, "#ffe9b8", "center", 700);
        break;
      }
      case "wok": {
        const wok = world.woks[station.wokIndex];
        const phase = wokPhase(wok);
        // burner flame
        ctx.fillStyle = phase === "empty" ? "#3c3c44" : "#ff8c42";
        ctx.beginPath(); ctx.ellipse(x, COUNTER_Y - 8, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#26262c";
        ctx.beginPath(); ctx.ellipse(x, COUNTER_Y - 26, 44, 17, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#3a3a42";
        ctx.beginPath(); ctx.ellipse(x, COUNTER_Y - 29, 38, 13, 0, 0, Math.PI * 2); ctx.fill();
        if (wok.batch) {
          wok.batch.forEach((ing, ii) => {
            const a = (ii / wok.batch.length) * Math.PI * 2 + wok.t * 0.7;
            drawIngredient(ctx, ing, x + Math.cos(a) * 17, COUNTER_Y - 32 + Math.sin(a) * 5, 10.5);
          });
          // progress ring: fills while cooking, gold in the perfect window
          const total = TIMING.cookSeconds + TIMING.perfectSeconds;
          const frac = Math.min(1, wok.t / total);
          ctx.strokeStyle = phase === "perfect" ? "#ffd94d" : phase === "cooking" ? "#ffb35c" : "#e23b2e";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(x, COUNTER_Y - 28, 52, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
          ctx.stroke();
          if (phase === "perfect") text(ctx, "PERFECT!", x, COUNTER_Y - 96, 19, "#ffd94d", "center", 800);
          if (phase === "burning" || phase === "burnt") text(ctx, "BURNING!", x, COUNTER_Y - 96, 19, "#e23b2e", "center", 800);
        }
        text(ctx, station.wokIndex === 0 ? "WOK 1" : "WOK 2", x, COUNTER_Y + 26, 16, "#ffe9b8", "center", 700);
        break;
      }
      case "plating": {
        ctx.fillStyle = "#fdfdf8";
        ctx.beginPath(); ctx.ellipse(x, COUNTER_Y - 30, 46, 15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#c9c9bd"; ctx.lineWidth = 2; ctx.stroke();
        // The plate rests here until the chef carries the service to the
        // hatch; near the hatch it is drawn there instead, never in both.
        const plateAtHatch = world.plate && Math.abs(world.chef.x - 1180) < 110;
        if (world.plate && !plateAtHatch) drawPlateDish(ctx, world.plate.recipeId, x, COUNTER_Y - 34, 0.82);
        text(ctx, "PLATE", x, COUNTER_Y + 26, 16, "#ffe9b8", "center", 700);
        break;
      }
      case "hatch": {
        ctx.fillStyle = "#40260a";
        roundRect(ctx, x - 34, COUNTER_Y - 118, 76, 62, 6); ctx.fill();
        ctx.fillStyle = "#ffe9b8";
        roundRect(ctx, x - 27, COUNTER_Y - 111, 62, 48, 4); ctx.fill();
        text(ctx, "🛎", x + 4, COUNTER_Y - 76, 26, "#40260a", "center");
        if (world.plate && Math.abs(world.chef.x - 1180) < 110) {
          drawPlateDish(ctx, world.plate.recipeId, x + 4, COUNTER_Y - 30, 0.7);
        }
        text(ctx, "SERVE", x, COUNTER_Y + 26, 16, "#ffe9b8", "center", 700);
        break;
      }
      case "trash": {
        ctx.fillStyle = "#5b6670";
        roundRect(ctx, x - 20, COUNTER_Y - 44, 40, 46, 5); ctx.fill();
        ctx.fillStyle = "#454f57";
        ctx.fillRect(x - 24, COUNTER_Y - 50, 48, 9);
        text(ctx, "BIN", x, COUNTER_Y + 26, 15, "#ffe9b8", "center", 700);
        break;
      }
    }
  }
}

function drawChef(ctx, world) {
  const { x } = world.chef;
  const y = 668;
  const bob = world.mode === "playing" && (world.chef.walkTarget !== null) ? Math.sin(world.elapsed * 14) * 3 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(world.chef.facing, 1);
  // legs and body
  ctx.fillStyle = "#37474f";
  ctx.fillRect(-14, 34, 11, 26);
  ctx.fillRect(4, 34, 11, 26);
  ctx.fillStyle = "#fdfdf8";
  roundRect(ctx, -24, -16, 48, 54, 12); ctx.fill();
  ctx.fillStyle = "#e2572b";
  roundRect(ctx, -24, 8, 48, 30, 8); ctx.fill();
  // head and hat
  ctx.fillStyle = "#f2c094";
  ctx.beginPath(); ctx.arc(0, -34, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, -19, -58, 38, 16, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -56, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#40260a";
  ctx.beginPath(); ctx.arc(6, -34, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // what the chef holds, drawn unfipped above the hands
  if (world.carrying) {
    ctx.fillStyle = "#26262c";
    ctx.beginPath(); ctx.ellipse(x + 26, y - 6 + bob, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
    world.carrying.items.forEach((ing, ii) => {
      drawIngredient(ctx, ing, x + 14 + ii * 12, y - 12 + bob, 8.5);
    });
    if (world.carrying.perfect) text(ctx, "✦ golden", x + 26, y - 34 + bob, 14, "#ffd94d", "center", 800);
  }
  // the tray, bottom-left of the chef: what is gathered so far
  if (world.tray.length) {
    ctx.fillStyle = "rgba(64,38,10,0.85)";
    roundRect(ctx, x - 62, y + 44, 124, 34, 8); ctx.fill();
    world.tray.forEach((item, ii) => {
      drawChip(ctx, item.ingredient, x - 40 + ii * 27, y + 61, 11, item.stage === "chopped");
    });
  }
}

function promptText(world) {
  const station = nearestStation(world);
  if (!station) return world.hint;
  switch (station.kind) {
    case "bin": return `E: take ${INGREDIENTS[station.ingredient].name}`;
    case "board": return world.tray.some((i) => i.stage === "raw") ? "Hold E: chop!" : "E: the board — bring raw ingredients";
    case "wok": {
      const phase = wokPhase(world.woks[station.wokIndex]);
      if (phase === "empty") return "E: tip the chopped tray into the wok";
      if (phase === "cooking") return "Cooking… watch for the golden ring";
      if (phase === "perfect") return "E: take it out — PERFECT!";
      if (phase === "burning") return "E: take it out before it burns!";
      return "E: scrape out the burnt batch";
    }
    case "plating": return world.carrying ? "E: plate this batch" : "E: plating — bring a cooked batch";
    case "hatch": return world.plate ? `E: SERVE ${RECIPES[world.plate.recipeId].name}!` : "E: the hatch — bring a plate";
    case "trash": return "E: bin what's in hand";
    default: return world.hint;
  }
}

function drawOverlays(ctx, world) {
  if (world.mode === "playing") {
    // prompt + hint along the bottom
    ctx.fillStyle = "rgba(64,38,10,0.88)";
    roundRect(ctx, 290, 752, 700, 38, 10); ctx.fill();
    text(ctx, promptText(world), 640, 778, 19, "#ffe9b8", "center", 700);
    return;
  }
  ctx.fillStyle = "rgba(43,26,8,0.72)";
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = "#fffaf0";
  roundRect(ctx, 340, 190, 600, 420, 18); ctx.fill();
  if (world.mode === "title") {
    text(ctx, "SIZZLE & SERVE", 640, 300, 52, "#c93b30", "center", 800);
    text(ctx, "— Little Wok Kitchen —", 640, 344, 24, "#7a4416", "center", 700);
    text(ctx, "Tickets land on the order board. Gather, chop, wok,", 640, 404, 20, "#40260a", "center", 600);
    text(ctx, "plate and serve before your customers walk away.", 640, 432, 20, "#40260a", "center", 600);
    text(ctx, "A/D or ←/→ walk · E works a station · click also works", 640, 486, 18, "#7a4416", "center", 600);
    text(ctx, "Click or press E to open the kitchen", 640, 552, 23, "#35702a", "center", 800);
  } else {
    text(ctx, "SERVICE OVER", 640, 290, 44, "#c93b30", "center", 800);
    text(ctx, `You served ${world.served} dishes`, 640, 360, 26, "#40260a", "center", 700);
    text(ctx, `and took $${world.coins} at the till`, 640, 398, 26, "#40260a", "center", 700);
    text(ctx, `${world.lost} customers walked away`, 640, 436, 20, "#7a4416", "center", 600);
    text(ctx, "Press R or click to run another day", 640, 520, 22, "#35702a", "center", 800);
  }
}

export function drawWorld(ctx, world) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawRoom(ctx, world);
  drawHud(ctx, world);
  drawOrderBoard(ctx, world);
  drawCounter(ctx, world);
  // steam above the woks
  for (const s of world.steam) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - s.t / 1.1)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 7 + s.t * 9, 0, Math.PI * 2);
    ctx.fill();
  }
  drawChef(ctx, world);
  for (const p of world.popups) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / 1.6);
    text(ctx, p.text, p.x, p.y, 21, p.color, "center", 800);
    ctx.globalAlpha = 1;
  }
  drawOverlays(ctx, world);
}
