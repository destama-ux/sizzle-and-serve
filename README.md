# sizzle-and-serve

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/destama-ux/sizzle-and-serve/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/destama-ux/sizzle-and-serve/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve — Little Wok Kitchen.** A complete cooking game for the
desktop browser, drawn entirely in code: no image files, no network requests,
just static files under `game/`.

Tickets land on the order board — Sunrise Fried Rice, Garden Noodle Wok,
Ember Veggie Stir-Fry, Tomato Egg Skillet. Run the counter left to right:
gather each ticket's ingredients from the bins, chop them on the board, wok
them together and pull the batch out inside the golden ring, plate it, and
serve it at the hatch before the ticket's patience bar runs dry. Two woks,
four-ingredient recipes and a lunch rush that keeps speeding up make the
route worth planning.

## Play

Open `game/index.html` in a desktop browser (or serve the folder with any
static server). 

- **A/D or ←/→** — walk the kitchen lane
- **E / Space** — use the station in front of you (hold E at the board to chop)
- **Mouse** — click a station and the chef walks there and uses it
- **R** — start another day when service ends

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` with the vendored library
- `vendor/makefun-game.ts` — the make.fun game library, as shipped in the kit
- `game/index.html` — the page; `game/src/` holds the game, one job per file:
  `config.js` (recipes, stations, timings), `world.js` (rules and state),
  `render.js` (all drawing), `input.js`, `audio.js` (synthesised sounds),
  `random.js` (seeded deals), `shots.js` (the screenshot scenes), `main.js`
- `screenshots/` — renders of the game itself, taken with `shots.json`'s
  scenes

## License

MIT — see `LICENSE`.
