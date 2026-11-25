// config.js — every number and name the game is tuned by: the ingredients on
// the counter, the recipes on the order board, where each station stands and
// how long chopping, cooking and a customer's patience take.

export const VIEW = { width: 1280, height: 800 };

// The counter runs along y = 560; the chef walks the lane in front of it.
export const COUNTER_Y = 560;
export const CHEF_LANE_Y = 668;

export const INGREDIENTS = {
  rice:    { name: "Rice",    color: "#f5efe0", edge: "#d8cdb2" },
  noodle:  { name: "Noodle",  color: "#f2c14e", edge: "#c7942a" },
  egg:     { name: "Egg",     color: "#ffd94d", edge: "#e0a81c" },
  chicken: { name: "Chicken", color: "#f2a65a", edge: "#c97a33" },
  chili:   { name: "Chili",   color: "#e23b2e", edge: "#a91f14" },
  greens:  { name: "Greens",  color: "#57b24a", edge: "#35702a" },
  tomato:  { name: "Tomato",  color: "#ef5d60", edge: "#b23234" },
};

export const INGREDIENT_ORDER = [
  "rice", "noodle", "egg", "chicken", "chili", "greens", "tomato",
];

// A recipe is a set of ingredients: gather them all, chop them, wok them
// together, plate and serve. Prices pay for the longer shopping lists.
export const RECIPES = {
  sunriseRice: {
    name: "Sunrise Fried Rice",
    needs: ["rice", "egg", "chili", "chicken"],
    price: 46,
    plate: "#e2572b",
  },
  gardenNoodle: {
    name: "Garden Noodle Wok",
    needs: ["noodle", "greens", "egg", "chicken"],
    price: 44,
    plate: "#3f9142",
  },
  emberVeggie: {
    name: "Ember Veggie Stir-Fry",
    needs: ["greens", "chili", "tomato"],
    price: 32,
    plate: "#c93b30",
  },
  tomatoEgg: {
    name: "Tomato Egg Skillet",
    needs: ["tomato", "egg", "rice"],
    price: 30,
    plate: "#e8a13a",
  },
};

export const RECIPE_ORDER = ["sunriseRice", "gardenNoodle", "emberVeggie", "tomatoEgg"];

// Stations along the counter, left to right. Bins hold one ingredient each;
// then the board, two woks, the plating counter, the serving hatch and the
// trash, so a good route flows left to right and back.
export const STATIONS = [
  { id: "bin-rice",    kind: "bin",    ingredient: "rice",    x: 92 },
  { id: "bin-noodle",  kind: "bin",    ingredient: "noodle",  x: 196 },
  { id: "bin-egg",     kind: "bin",    ingredient: "egg",     x: 300 },
  { id: "bin-chicken", kind: "bin",    ingredient: "chicken", x: 404 },
  { id: "bin-chili",   kind: "bin",    ingredient: "chili",   x: 508 },
  { id: "bin-greens",  kind: "bin",    ingredient: "greens",  x: 612 },
  { id: "bin-tomato",  kind: "bin",    ingredient: "tomato",  x: 716 },
  { id: "board",       kind: "board",  x: 824 },
  { id: "wok-a",       kind: "wok",    wokIndex: 0, x: 924 },
  { id: "wok-b",       kind: "wok",    wokIndex: 1, x: 1016 },
  { id: "plating",     kind: "plating", x: 1104 },
  { id: "hatch",       kind: "hatch",  x: 1180 },
  { id: "trash",       kind: "trash",  x: 40 },
];

export const TIMING = {
  dayLength: 150,        // seconds of service
  chopSeconds: 1.1,      // per ingredient on the board
  cookSeconds: 6,        // a batch in the wok
  perfectSeconds: 2.5,   // the golden window after cooking finishes
  burnSeconds: 5,        // after the window, the batch burns
  firstOrderAt: 1.2,     // seconds before the first ticket prints
  orderEveryEarly: 11,   // spawn gap while the day is young
  orderEveryLate: 6.5,   // spawn gap in the rush
  patienceEarly: 75,     // seconds a customer waits, early
  patienceLate: 48,      // and late, when the board is full
  maxOrders: 3,
  traySize: 4,
};
