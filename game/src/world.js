// world.js — the game itself: the chef, the tray, the chopping board, the
// two woks, the plate and the order board. Pure state and rules; render.js
// draws what is here and input.js feeds it, so the same world can be set up
// by hand for a screenshot scene.

import { RECIPES, RECIPE_ORDER, STATIONS, TIMING } from "./config.js";
import { mulberry32, pick } from "./random.js";
import { sfx } from "./audio.js";

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

export function nearestStation(world) {
  let best = null;
  let bestDist = Infinity;
  for (const station of STATIONS) {
    const dist = Math.abs(station.x - world.chef.x);
    if (dist < bestDist) {
      bestDist = dist;
      best = station;
    }
  }
  return bestDist <= 48 ? best : null;
}

export function wokPhase(wok) {
  if (!wok.batch) return "empty";
  if (wok.t < TIMING.cookSeconds) return "cooking";
  if (wok.t < TIMING.cookSeconds + TIMING.perfectSeconds) return "perfect";
  if (wok.t < TIMING.cookSeconds + TIMING.perfectSeconds + TIMING.burnSeconds) return "burning";
  return "burnt";
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const item of a) counts.set(item, (counts.get(item) ?? 0) + 1);
  for (const item of b) {
    const left = (counts.get(item) ?? 0) - 1;
    if (left < 0) return false;
    counts.set(item, left);
  }
  return true;
}

export function createWorld(seed = 1) {
  return {
    mode: "title", // title | playing | over
    rng: mulberry32(seed),
    elapsed: 0,
    dayLeft: TIMING.dayLength,
    chef: { x: 640, walkTarget: null, facing: 1, pendingStation: null },
    tray: [],        // [{ ingredient, stage: "raw" | "chopped" }]
    carrying: null,  // { items: [ingredientId], perfect: boolean }
    plate: null,     // { recipeId, orderId }
    boardProgress: 0,
    woks: [{ batch: null, t: 0, dinged: false }, { batch: null, t: 0, dinged: false }],
    orders: [],      // [{ id, recipeId, patience, patienceMax }]
    nextOrderId: 1,
    spawnIn: TIMING.firstOrderAt,
    coins: 0,
    score: 0,
    served: 0,
    lost: 0,
    popups: [],      // [{ x, y, text, t, color }]
    steam: [],       // [{ x, y, t, drift }]
    hint: "Walk with A/D or the arrow keys. E or Space uses a station.",
  };
}

export function startDay(world, seed) {
  const fresh = createWorld(seed ?? Math.floor(Math.random() * 1e9));
  Object.assign(world, fresh, { mode: "playing" });
  world.hint = "A ticket! Gather its ingredients from the bins on the left.";
}

function popup(world, x, y, text, color = "#fff3d6") {
  world.popups.push({ x, y, text, t: 0, color });
}

function spawnOrder(world) {
  const progress = 1 - world.dayLeft / TIMING.dayLength;
  const patience = TIMING.patienceEarly + (TIMING.patienceLate - TIMING.patienceEarly) * progress;
  const recipeId = pick(world.rng, RECIPE_ORDER);
  world.orders.push({
    id: world.nextOrderId++,
    recipeId,
    patience,
    patienceMax: patience,
  });
  sfx.pop();
}

export function updateWorld(world, input, dt) {
  if (world.mode !== "playing") return;
  world.elapsed += dt;
  world.dayLeft = Math.max(0, world.dayLeft - dt);

  // --- the chef walks: keys first, then a click target -------------------
  const dir = input.axis();
  if (dir !== 0) {
    world.chef.x += dir * 470 * dt;
    world.chef.facing = dir;
    world.chef.walkTarget = null;
    world.chef.pendingStation = null;
  } else if (world.chef.walkTarget !== null) {
    const dx = world.chef.walkTarget - world.chef.x;
    const step = 470 * dt;
    if (Math.abs(dx) <= step) {
      world.chef.x = world.chef.walkTarget;
      world.chef.walkTarget = null;
      if (world.chef.pendingStation) {
        interactAt(world, stationById(world.chef.pendingStation));
        world.chef.pendingStation = null;
      }
    } else {
      world.chef.x += Math.sign(dx) * step;
      world.chef.facing = Math.sign(dx);
    }
  }
  world.chef.x = Math.min(1252, Math.max(28, world.chef.x));

  const clickX = input.takeClick();
  if (clickX !== null) {
    const station = STATIONS.find((s) => Math.abs(s.x - clickX) <= 52);
    if (station) {
      world.chef.walkTarget = station.x;
      world.chef.pendingStation = station.id;
    } else {
      world.chef.walkTarget = clickX;
    }
  }

  // --- orders: spawn, age, walk away --------------------------------------
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.orders.length < TIMING.maxOrders) {
    spawnOrder(world);
    const progress = 1 - world.dayLeft / TIMING.dayLength;
    world.spawnIn = TIMING.orderEveryEarly + (TIMING.orderEveryLate - TIMING.orderEveryEarly) * progress;
  }
  for (const order of [...world.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(world.orders.indexOf(order), 1);
      world.lost += 1;
      popup(world, 1090, 210, "walked away…", "#ff9d8a");
      sfx.sad();
      if (world.plate && world.plate.orderId === order.id) {
        world.plate = null;
        popup(world, 1104, 470, "plate went cold", "#ff9d8a");
      }
    }
  }

  // --- chopping: hold interact at the board --------------------------------
  const here = nearestStation(world);
  const rawIndex = world.tray.findIndex((item) => item.stage === "raw");
  if (here && here.kind === "board" && rawIndex >= 0 && input.interactHeld()) {
    world.boardProgress += dt;
    if (world.boardProgress >= 0.28 && world.boardProgress < TIMING.chopSeconds) sfx.chop();
    if (world.boardProgress >= TIMING.chopSeconds) {
      world.tray[rawIndex].stage = "chopped";
      world.boardProgress = 0;
      sfx.ding();
    }
  } else if (!input.interactHeld()) {
    world.boardProgress = 0;
  }

  if (input.takeInteractPress() && here) interactAt(world, here);

  // --- the woks cook --------------------------------------------------------
  for (const [index, wok] of world.woks.entries()) {
    if (!wok.batch) continue;
    wok.t += dt;
    const phase = wokPhase(wok);
    if (phase === "perfect" && !wok.dinged) {
      wok.dinged = true;
      sfx.ding();
    }
    if (phase === "burnt" && wok.dinged !== "burnt") {
      wok.dinged = "burnt";
      sfx.burn();
    }
    if (phase === "cooking" || phase === "perfect") {
      const station = STATIONS.find((s) => s.kind === "wok" && s.wokIndex === index);
      if (Math.random() < dt * 14) {
        world.steam.push({ x: station.x + (Math.random() - 0.5) * 30, y: 486, t: 0, drift: (Math.random() - 0.5) * 12 });
      }
    }
  }

  // --- popups and steam drift away ------------------------------------------
  for (const p of world.popups) { p.t += dt; p.y -= 26 * dt; }
  world.popups = world.popups.filter((p) => p.t < 1.6);
  for (const s of world.steam) { s.t += dt; s.y -= 34 * dt; s.x += s.drift * dt; }
  world.steam = world.steam.filter((s) => s.t < 1.1);

  if (world.dayLeft <= 0) {
    world.mode = "over";
    sfx.serve();
  }
}

// One press of the interact key (or one click's arrival) at a station.
export function interactAt(world, station) {
  if (!station || world.mode !== "playing") return;
  switch (station.kind) {
    case "bin": {
      if (world.tray.length >= TIMING.traySize) {
        popup(world, station.x, 470, "tray is full!", "#ff9d8a");
        sfx.sad();
        return;
      }
      world.tray.push({ ingredient: station.ingredient, stage: "raw" });
      world.hint = "Chop everything on the board, then wok it together.";
      sfx.pickup();
      return;
    }
    case "board": {
      if (!world.tray.some((item) => item.stage === "raw")) {
        popup(world, station.x, 470, world.tray.length ? "all chopped ✓" : "nothing to chop", "#fff3d6");
      }
      return;
    }
    case "wok": {
      const wok = world.woks[station.wokIndex];
      const phase = wokPhase(wok);
      if (!wok.batch) {
        if (world.carrying) {
          popup(world, station.x, 470, "hands full of cooked food", "#ff9d8a");
          return;
        }
        if (world.tray.length === 0) {
          popup(world, station.x, 470, "nothing to cook yet", "#fff3d6");
          return;
        }
        if (world.tray.some((item) => item.stage !== "chopped")) {
          popup(world, station.x, 470, "chop it all first!", "#ff9d8a");
          sfx.sad();
          return;
        }
        wok.batch = world.tray.map((item) => item.ingredient);
        wok.t = 0;
        wok.dinged = false;
        world.tray = [];
        world.hint = "Take it out in the golden ring — then plate it.";
        sfx.load();
        return;
      }
      if (phase === "cooking") {
        popup(world, station.x, 470, "still cooking…", "#fff3d6");
        return;
      }
      if (phase === "perfect" || phase === "burning") {
        if (world.carrying) {
          popup(world, station.x, 470, "hands full!", "#ff9d8a");
          return;
        }
        world.carrying = { items: wok.batch, perfect: phase === "perfect" };
        wok.batch = null;
        wok.t = 0;
        world.hint = "To the plating counter, quick!";
        sfx.pickup();
        return;
      }
      // burnt: scrape it out
      wok.batch = null;
      wok.t = 0;
      popup(world, station.x, 470, "burnt — scraped out", "#ff9d8a");
      sfx.trash();
      return;
    }
    case "plating": {
      if (world.plate) {
        popup(world, station.x, 470, "a plate is waiting!", "#fff3d6");
        return;
      }
      if (!world.carrying) {
        popup(world, station.x, 470, "bring a cooked batch", "#fff3d6");
        return;
      }
      const match = world.orders.find((order) =>
        sameSet(world.carrying.items, RECIPES[order.recipeId].needs));
      if (!match) {
        popup(world, station.x, 470, "no ticket wants this mix", "#ff9d8a");
        sfx.sad();
        return;
      }
      world.plate = { recipeId: match.recipeId, orderId: match.id, perfect: world.carrying.perfect };
      world.carrying = null;
      world.hint = "Serve it at the hatch before the ticket fades!";
      sfx.plate();
      return;
    }
    case "hatch": {
      if (!world.plate) {
        popup(world, station.x, 470, "nothing to serve", "#fff3d6");
        return;
      }
      const order = world.orders.find((o) => o.id === world.plate.orderId);
      const recipe = RECIPES[world.plate.recipeId];
      if (!order) {
        world.plate = null;
        popup(world, station.x, 470, "too late — it went cold", "#ff9d8a");
        return;
      }
      const tip = Math.round(recipe.price * 0.5 * Math.max(0, order.patience / order.patienceMax));
      const bonus = world.plate.perfect ? 8 : 0;
      const pay = recipe.price + tip + bonus;
      world.coins += pay;
      world.score += pay;
      world.served += 1;
      world.orders.splice(world.orders.indexOf(order), 1);
      world.plate = null;
      popup(world, station.x - 30, 440, `+$${pay}${bonus ? " perfect!" : ""}`, "#a7e8a1");
      sfx.serve();
      return;
    }
    case "trash": {
      if (world.plate) { world.plate = null; popup(world, station.x, 470, "plate binned", "#fff3d6"); }
      else if (world.carrying) { world.carrying = null; popup(world, station.x, 470, "batch binned", "#fff3d6"); }
      else if (world.tray.length) { world.tray = []; popup(world, station.x, 470, "tray emptied", "#fff3d6"); }
      else { popup(world, station.x, 470, "nothing to bin", "#fff3d6"); return; }
      sfx.trash();
      return;
    }
  }
}
