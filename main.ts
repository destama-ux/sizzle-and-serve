// Sizzle & Serve — Little Wok Kitchen: the hand-in program.
//
// The game itself is the static site under game/ (open game/index.html in a
// desktop browser and play; it loads nothing from the network). This program
// is what enters it: it copies game/ and screenshots/ into the output
// directory and writes dossier.json there with buildDossier from the
// vendored make.fun library, exactly as the bounty requires.
//
// Run it the way the grader does, with the output directory standing in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoDir = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, "game"), join(outputDir, "game"), { recursive: true });
mkdirSync(join(outputDir, "screenshots"), { recursive: true });
if (existsSync(join(repoDir, "screenshots"))) {
  cpSync(join(repoDir, "screenshots"), join(outputDir, "screenshots"), {
    recursive: true,
  });
}

// The caps are the scorer's own: at most 4 screenshots of 256 KiB each, at
// most 993 files and 48 MiB under game/, no game path over 1,000 bytes, and
// the dossier text capped at 160 KiB.
writeFileSync(
  join(outputDir, "dossier.json"),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
