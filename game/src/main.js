// Boot and the one loop: input is read every frame, the kitchen advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens: title,
// play, paused and shift over.
//
// ?seed=N fixes the ticket order. ?shot=start|play|rush|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import {
  createKitchen,
  matchingOrderForPlate,
  servePlate,
  startShift,
  updateKitchen,
} from './kitchen.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_SERVE, handleClick, handleKey } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';
import { playSound, unlockAudio } from './audio.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const kitchen = createKitchen(seed);
/** Debug hook for play-testing: the live kitchen state, read-only in practice. */
window.__kitchen = kitchen;

/** Size the canvas to its CSS box (times the device pixel ratio, capped at 2)
// so the logical field is painted 1:1 instead of stretched from 300x150. */
function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
}
fitCanvas();
window.addEventListener('resize', fitCanvas);
const renderer = createRenderer(canvas);
const mouse = { x: 640, y: 400 };

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function playEvents(events) {
  for (const name of events) playSound(name);
}

function runShot(name) {
  const scene = stageShot(name, kitchen);
  // Park the cursor over the empty floor strip so a carried item's chip
  // never covers a bin or a plate in the frame.
  mouse.x = 640;
  mouse.y = 620;
  let painted = 0;
  function paint() {
    renderer.draw(kitchen, scene.best, mouse);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = kitchen.screen;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function syncScreen() {
    screen = kitchen.screen;
  }

  function startGame() {
    startShift(kitchen);
    syncScreen();
    announce('Playing. Serve tickets before their patience runs out.');
  }

  function endGame() {
    syncScreen();
    if (kitchen.coins > best) {
      best = kitchen.coins;
      saveBest(best);
    }
    announce(
      kitchen.won
        ? `Shift complete! ${kitchen.coins} coins. Best ${best}.`
        : `Shift over. ${kitchen.coins} coins. Best ${best}.`,
    );
  }

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 1280;
    mouse.y = ((event.clientY - rect.top) / rect.height) * 800;
  });

  canvas.addEventListener('pointerdown', (event) => {
    unlockAudio();
    const result = handleClick(kitchen, canvas, event);
    mouse.x = result.point.x;
    mouse.y = result.point.y;
    playEvents(result.events);
    if (result.confirm) {
      if (screen === 'title' || screen === 'over') startGame();
      else if (screen === 'paused') {
        kitchen.screen = 'play';
        syncScreen();
        announce('Playing.');
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    unlockAudio();
    const result = handleKey(kitchen, event);
    playEvents(result.events);
    if (result.actions & ACTION_PAUSE) {
      if (screen === 'play') {
        kitchen.screen = 'paused';
        syncScreen();
        announce('Paused.');
      } else if (screen === 'paused') {
        kitchen.screen = 'play';
        syncScreen();
        announce('Playing.');
      }
      return;
    }
    if (result.actions & ACTION_SERVE && screen === 'play') {
      // Space serves the ready plate whose ticket is running out first.
      const ready = kitchen.plates
        .map((plate) => ({ plate, order: matchingOrderForPlate(kitchen, plate) }))
        .filter((entry) => entry.order)
        .sort((a, b) => a.order.patience - b.order.patience)[0];
      if (ready) playEvents(servePlate(kitchen, ready.plate.id));
      return;
    }
    if (result.actions & ACTION_CONFIRM) {
      if (screen === 'title' || screen === 'over') startGame();
      else if (screen === 'paused') {
        kitchen.screen = 'play';
        syncScreen();
        announce('Playing.');
      }
      return;
    }
  });

  function step() {
    const events = updateKitchen(kitchen, STEP);
    playEvents(events);
    if (kitchen.screen === 'over' && screen !== 'over') endGame();
    syncScreen();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (screen === 'play') {
      while (accumulator >= STEP && screen === 'play') {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(kitchen, best, mouse);
  }

  // Leaving the tab pauses a running game rather than letting tickets expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === 'play') {
      kitchen.screen = 'paused';
      syncScreen();
      announce('Paused.');
    }
  });

  announce('Simmer and Serve, Warung Rush. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
