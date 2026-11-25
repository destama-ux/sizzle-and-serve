// shots.js — the screenshot scenes. Each one arranges a real world by hand
// (the same state the game itself plays in) and lets render.js draw it, so
// the screenshots in screenshots/ are honest renders of the game's own code:
//   ?shot=cover    the kitchen at the start of a rush, tickets up
//   ?shot=assembly a dish mid-assembly at the plating counter
//   ?shot=cooking  both woks working, one batch in its golden window
//   ?shot=serve    a finished plate at the hatch, money at the till

import { RECIPES } from "./config.js";

function ticket(world, recipeId, patienceFrac) {
  const patienceMax = 70;
  world.orders.push({
    id: world.nextOrderId++,
    recipeId,
    patience: patienceMax * patienceFrac,
    patienceMax,
  });
}

function baseScene(world) {
  world.mode = "playing";
  world.elapsed = 30;
  world.dayLeft = 96;
  world.coins = 86;
  world.served = 2;
}

export function setupShot(world, name, seed) {
  world.rng = () => 0.5; // scenes are arranged by hand; keep spawns frozen
  baseScene(world);
  switch (name) {
    case "cover": {
      ticket(world, "sunriseRice", 0.85);
      ticket(world, "emberVeggie", 0.6);
      world.chef.x = 560;
      world.tray = [
        { ingredient: "rice", stage: "chopped" },
        { ingredient: "egg", stage: "chopped" },
        { ingredient: "chili", stage: "raw" },
      ];
      world.woks[0].batch = ["greens", "chili", "tomato"];
      world.woks[0].t = 3.4;
      for (let i = 0; i < 7; i++) {
        world.steam.push({ x: 912 + (i % 3) * 12, y: 470 - i * 9, t: i * 0.13, drift: 3 });
      }
      world.hint = "E: take it out in the golden ring — then plate it.";
      break;
    }
    case "assembly": {
      ticket(world, "gardenNoodle", 0.8);
      ticket(world, "sunriseRice", 0.55);
      ticket(world, "tomatoEgg", 0.35);
      world.chef.x = 1104;
      world.carrying = { items: [...RECIPES.gardenNoodle.needs], perfect: true };
      world.tray = [{ ingredient: "tomato", stage: "raw" }];
      world.boardProgress = 0.55;
      world.woks[1].batch = ["tomato", "egg", "rice"];
      world.woks[1].t = 2.2;
      world.dayLeft = 81;
      world.coins = 132;
      world.served = 3;
      break;
    }
    case "cooking": {
      ticket(world, "sunriseRice", 0.7);
      ticket(world, "gardenNoodle", 0.45);
      world.chef.x = 968;
      world.woks[0].batch = ["rice", "egg", "chili", "chicken"];
      world.woks[0].t = 4.4;
      world.woks[1].batch = ["greens", "chili", "tomato"];
      world.woks[1].t = 6.9;
      world.woks[1].dinged = true;
      world.tray = [
        { ingredient: "noodle", stage: "chopped" },
        { ingredient: "greens", stage: "chopped" },
      ];
      for (let i = 0; i < 9; i++) {
        world.steam.push({ x: 908 + (i % 4) * 11, y: 478 - i * 10, t: i * 0.11, drift: -2 });
        world.steam.push({ x: 1004 + (i % 3) * 10, y: 486 - i * 8, t: i * 0.09, drift: 2 });
      }
      world.dayLeft = 64;
      world.coins = 178;
      world.served = 4;
      break;
    }
    case "serve": {
      ticket(world, "emberVeggie", 0.75);
      ticket(world, "tomatoEgg", 0.5);
      world.chef.x = 1152;
      world.plate = { recipeId: "sunriseRice", orderId: 99, perfect: true };
      world.popups.push({ x: 1120, y: 430, text: "+$52 perfect!", t: 0.25, color: "#a7e8a1" });
      world.dayLeft = 43;
      world.coins = 246;
      world.served = 6;
      break;
    }
    default: {
      ticket(world, "sunriseRice", 0.85);
      world.chef.x = 640;
    }
  }
}
