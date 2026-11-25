// The screenshot scenes behind ?shot=start|play|rush|end. Each one stages a
// real, reachable kitchen state — the same state the live game can be in —
// and the renderer paints it, so the frame is what the game really looks
// like and the same seed always gives the same frame.

import { ORDERS, SHIFT } from './config.js';
import { startShift } from './kitchen.js';

function setClock(kitchen, elapsedSeconds) {
  kitchen.time = elapsedSeconds;
  kitchen.timeLeft = Math.max(0, SHIFT.seconds - elapsedSeconds);
}

function setOrder(kitchen, id, dishId, patience, patienceMax) {
  kitchen.orders.push({ id, dishId, patience, patienceMax, bornAt: 0, ticked: patience <= 10 });
  kitchen.nextOrderId = Math.max(kitchen.nextOrderId, id + 1);
}

function setStation(kitchen, stationId, ing, progress) {
  const station = kitchen.stations.find((item) => item.id === stationId);
  station.item = { ing, progress, duration: 3, done: progress >= 1 };
}

/**
 * Set `kitchen` to the named scene (start, play, rush or end; any other name
 * is start) and return the best-coins value to show on the title screen.
 */
export function stageShot(name, kitchen) {
  startShift(kitchen);
  kitchen.spawnTimer = ORDERS.spawnInterval;

  if (name === 'play') {
    // Mid-shift: two tickets waiting, one dish half-built, one dish ready.
    setClock(kitchen, 43);
    kitchen.coins = 86;
    kitchen.served = 5;
    kitchen.combo = 2;
    kitchen.bestCombo = 3;
    setOrder(kitchen, 6, 'mie-ayam', 22, 50);
    setOrder(kitchen, 7, 'nasi-goreng', 38, 50);
    setOrder(kitchen, 8, 'sate-platter', 28, 50);
    kitchen.pinnedOrderId = 6;
    setStation(kitchen, 'wok', 'egg', 0.55);
    setStation(kitchen, 'grill', 'chicken', 0.8);
    setStation(kitchen, 'pot', 'noodles', 0.3);
    // Plate 1: Mie Ayam mid-assembly — noodles and chicken on, greens still to come.
    kitchen.plates[0].items = ['noodles', 'chicken'];
    kitchen.plates[0].selected = true;
    // Plate 2: a finished Nasi Goreng, ready to serve to ticket #7.
    kitchen.plates[1].items = ['rice', 'egg', 'chili', 'kecap'];
    kitchen.plates[1].selected = false;
    return { best: 132 };
  }

  if (name === 'rush') {
    // Rush hour: four tickets, every station sizzling, the clock nearly gone.
    setClock(kitchen, 92);
    kitchen.rush = true;
    kitchen.coins = 104;
    kitchen.served = 8;
    kitchen.combo = 4;
    kitchen.bestCombo = 4;
    setOrder(kitchen, 11, 'soto-ayam', 14, 34);
    setOrder(kitchen, 12, 'mie-ayam', 9, 34);
    setOrder(kitchen, 13, 'ayam-geprek', 21, 34);
    setOrder(kitchen, 14, 'gado-gado', 30, 34);
    kitchen.pinnedOrderId = 11;
    setStation(kitchen, 'chop', 'greens', 0.7);
    setStation(kitchen, 'wok', 'rice', 0.45);
    setStation(kitchen, 'grill', 'skewers', 0.9);
    setStation(kitchen, 'pot', 'noodles', 0.6);
    kitchen.plates[0].items = ['noodles', 'chicken', 'egg'];
    kitchen.plates[0].selected = true;
    kitchen.plates[1].items = ['greens', 'peanut'];
    kitchen.plates[1].selected = false;
    kitchen.hand = { ing: 'chili', ready: false };
    return { best: 132 };
  }

  if (name === 'end') {
    // The shift is won: target beaten with time to spare.
    setClock(kitchen, 138);
    kitchen.coins = 132;
    kitchen.served = 9;
    kitchen.tipsEarned = 38;
    kitchen.bestCombo = 4;
    kitchen.expired = 1;
    kitchen.screen = 'over';
    kitchen.won = true;
    kitchen.overReason = 'Target smashed: 132 coins with time to spare!';
    return { best: 132 };
  }

  // start: the title screen over a kitchen already mid-shift.
  setClock(kitchen, 18);
  kitchen.coins = 24;
  kitchen.served = 2;
  setOrder(kitchen, 2, 'nasi-goreng', 41, 50);
  setOrder(kitchen, 3, 'mie-ayam', 33, 50);
  setStation(kitchen, 'wok', 'rice', 0.4);
  setStation(kitchen, 'grill', 'chicken', 0.65);
  kitchen.plates[0].items = ['rice', 'egg'];
  kitchen.screen = 'title';
  return { best: 132 };
}
