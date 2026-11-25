[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Vikkry88/sizzle-rush-kitchen/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Vikkry88/sizzle-rush-kitchen/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Sizzle Rush — 3D Kitchen Rush

A fast 3D cooking game built with Three.js. You are the chef on a 3-minute dinner shift: tickets land on the order board, and you run the kitchen — grab ingredients from the counters, chop them on the board, sizzle them on the stove, build each dish on the assembly plate and serve it at the pass before its timer runs out. Serve fast, chain dishes for combos, and do not let a ticket expire.

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests — every file the game loads lives under `game/`.

## Controls

- **WASD / Arrow keys** — move the chef
- **E** — grab, chop, cook, plate, serve (contextual: stand near a station)
- **P** — pause
- **R** — restart the shift
- **Enter** — start / play again

## Features

- **A real 3D kitchen** — ingredient counters, chopping board, two-burner stove with steam, assembly island and serve pass, all in Three.js.
- **6 original recipes** — Ember Burger, Sunset Ramen, Golden Satay, Sizzle Stack, Ember Noodle Bowl and Garden Melt, each combining raw, chopped and cooked ingredients in a different way.
- **Order board** — up to 4 live tickets with per-order timers and ingredient checklists that fill in as you build the dish.
- **Combo scoring** — serve dishes in a row to raise your multiplier up to x3; expired orders reset it.
- **Shift timer** — a 3-minute shift with a game-over screen, dishes served and best combo.
- **Synthesized sound** — chops, sizzles, serves and ticks, all generated with WebAudio; no audio files.
- **Deterministic screenshot scenes** — `?shot=start|play|end&seed=1` stages a fixed scene for screenshots.

## The cooking loop

1. Read the ticket: each dish needs 3–4 ingredients, some chopped, some cooked.
2. Grab an ingredient from its bin on the north counter.
3. Chop it at the west board or cook it on the east stove.
4. Add it to the plate on the centre island — the board shows which ingredients are done.
5. When the plate matches a ticket, run it to the serve pass and press E.
6. Watch the timer: a ticket that expires costs you your combo.

## Layout

- `game/index.html` — page, import map and HUD
- `game/src/config.js` — tuning numbers, palette and station positions
- `game/src/recipes.js` — ingredients and the six dishes
- `game/src/world.js` — the rules: orders, plate, chopping, cooking, score and combo
- `game/src/kitchen.js` — the 3D kitchen, the chef and the ingredient meshes
- `game/src/render.js` — the Three.js renderer and the camera that follows the chef
- `game/src/input.js` — keyboard input
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/hud.js` — the DOM heads-up display and order board
- `game/src/shots.js` — the staged screenshot scenes
- `game/src/main.js` — boot and the game loop
- `game/vendor/three.module.min.js` — vendored Three.js r186

<sub>Entered on [make.fun](https://make.fun/?ref=kt7mwy3x&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
