# Simmer & Serve — Warung Rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Arik2779/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Arik2779/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

An original fast-paced cooking game: you run a small warung kitchen through
the dinner rush. Order tickets appear on the order board, each with a
patience timer. Cook the ingredients at the right station, build the dish on
a plate, and serve it before the customer walks out.

Entry for the make.fun bounty **"Make the best cooking game"**:
https://make.fun/bounty/best-cooking-game-20261125-0137

## How to play

- **Goal:** earn 120 coins before the 2:30 shift timer ends. Lose all 3 hearts
  (an expired ticket costs one) or run out of time short of target, and the
  shift is over.
- **Cook:** click an ingredient on the counter to pick it up, click its
  station to cook it (chop 2s, wok 3s, grill 4s, pot 3s), click the station
  again when it is done to collect it. Peanut sauce and kecap go straight on
  the plate.
- **Plate:** click a plate to select it, then click it with a ready ingredient
  to add it. A plate that holds exactly a ticket's ingredients turns green —
  hit **SERVE** (or Space) to serve it. Fast serves earn a tip; serving
  several in a row builds a combo bonus.
- **Plan the route:** the grill is slow, so start it first; chop while it
  cooks; batch ingredients shared by two dishes. Two plates let you build
  one dish while another finishes. At 1:00 left, **rush hour** starts:
  tickets arrive faster and patience shrinks.
- **Pin a ticket:** click a ticket on the order board to see its recipe as
  ghost slots on the plates.

## Menu

| Dish | Ingredients | Coins |
| --- | --- | --- |
| Nasi Goreng Kampung | rice, egg, chili, kecap | 14 |
| Mie Ayam | noodles, chicken, greens | 16 |
| Sate Platter | skewers, peanut sauce, rice cake | 18 |
| Ayam Geprek | chicken, chili, rice | 15 |
| Soto Ayam | noodles, chicken, egg, greens | 20 |
| Gado-Gado | greens, egg, peanut sauce, rice cake | 17 |

## Controls

- **Mouse:** click everything — ingredients, stations, plates, serve, trash.
- **Keyboard:** `1–0` pick an ingredient · `Q/W/E/R` chop / wok / grill / pot ·
  `A/B` select plate 1/2 · `S` or `Space` serve · `T` clear plate ·
  `Esc`/`P` pause · `Enter` start / play again.

## Tech

- Static files under `game/`, no build step, no network requests. Open
  `game/index.html` in a desktop browser, or serve it with `node serve.ts`.
- All art is drawn procedurally on canvas; all sounds are synthesized with
  WebAudio. No images, fonts, or libraries are loaded.
- `?seed=N` fixes the ticket order for replays; `?shot=start|play|rush|end`
  stages a screenshot scene (see `shots.json`).
- Source is split by job: `config.js` (tuning), `recipes.js` (menu),
  `kitchen.js` (rules), `render.js` (drawing), `input.js` (controls),
  `audio.js` (sounds), `shots.js` (screenshot scenes), `main.js` (loop).

## License

MIT — see `LICENSE`.

<sub>Entered on [make.fun](https://make.fun/?ref=808mq1jq&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
