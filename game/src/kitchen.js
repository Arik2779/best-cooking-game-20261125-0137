// The kitchen: the whole game state and its rules. No drawing lives here —
// render.js paints whatever this file holds. Every action returns the list of
// sound names main.js should play, so the rules stay testable without audio.

import { DISHES, DISH_BY_ID, INGREDIENT_BY_ID, dishForPlate } from './recipes.js';
import { createRandom } from './random.js';
import { ORDERS, SHIFT, STATION_TIME, STATIONS } from './config.js';

/** A fresh kitchen: title screen, no shift running yet. */
export function createKitchen(seed) {
  return {
    seed,
    rng: createRandom(seed),
    screen: 'title',
    won: false,
    time: 0,
    timeLeft: SHIFT.seconds,
    coins: 0,
    target: SHIFT.targetCoins,
    hearts: SHIFT.hearts,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expired: 0,
    tipsEarned: 0,
    orders: [],
    stations: STATIONS.map((station) => ({ id: station.id, item: null })),
    plates: [
      { id: 0, items: [], selected: true },
      { id: 1, items: [], selected: false },
    ],
    hand: null,
    pinnedOrderId: null,
    spawnTimer: ORDERS.firstAfterSeconds,
    nextOrderId: 1,
    rush: false,
    toast: null,
    overReason: '',
  };
}

/** Start (or restart) a shift: clear the counters, the orders, the plates. */
export function startShift(kitchen) {
  const fresh = createKitchen(kitchen.seed);
  Object.assign(kitchen, fresh, { screen: 'play', rng: kitchen.rng });
  kitchen.rng = createRandom(kitchen.seed + kitchen.served + 1);
  showToast(kitchen, 'Shift started — first tickets coming in!', 'good');
}

function showToast(kitchen, text, kind = 'info') {
  kitchen.toast = { text, kind, until: kitchen.time + 2.6 };
}

/** The plate the player is building on right now. */
export function activePlate(kitchen) {
  return kitchen.plates.find((plate) => plate.selected) ?? kitchen.plates[0];
}

/** The dish a plate's contents make, or null when it matches no dish. */
export function plateDish(kitchen, plate) {
  return dishForPlate(plate.items);
}

/** The open ticket a plate can serve right now, or null. When two tickets
 *  want the same dish, the one with the least patience left is served first. */
export function matchingOrderForPlate(kitchen, plate) {
  const dish = plateDish(kitchen, plate);
  if (!dish) return null;
  const matches = kitchen.orders.filter((order) => order.dishId === dish.id);
  if (matches.length === 0) return null;
  matches.sort((a, b) => a.patience - b.patience);
  return matches[0];
}

function spawnOrder(kitchen) {
  const dish = kitchen.rng.pick(DISHES);
  const patience = kitchen.rush ? ORDERS.patienceSecondsRush : ORDERS.patienceSeconds;
  kitchen.orders.push({
    id: kitchen.nextOrderId,
    dishId: dish.id,
    patience,
    patienceMax: patience,
    bornAt: kitchen.time,
    ticked: false,
  });
  kitchen.nextOrderId += 1;
}

function expireOrder(kitchen, order, events) {
  kitchen.orders = kitchen.orders.filter((open) => open.id !== order.id);
  kitchen.hearts -= 1;
  kitchen.combo = 0;
  kitchen.expired += 1;
  events.push('wrong');
  showToast(kitchen, `Ticket expired — a customer walked out! (${kitchen.hearts} hearts left)`, 'bad');
  if (kitchen.hearts <= 0) endShift(kitchen, false, 'No hearts left — the customers gave up on the warung.', events);
}

function endShift(kitchen, won, reason, events) {
  kitchen.screen = 'over';
  kitchen.won = won;
  kitchen.overReason = reason;
  events.push(won ? 'win' : 'lose');
}

/** Advance the shift by dt seconds: clock, tickets, stations, rush hour. */
export function updateKitchen(kitchen, dt) {
  const events = [];
  if (kitchen.screen !== 'play') return events;
  kitchen.time += dt;
  kitchen.timeLeft = Math.max(0, SHIFT.seconds - kitchen.time);

  if (!kitchen.rush && kitchen.timeLeft <= SHIFT.rushAtSecondsLeft) {
    kitchen.rush = true;
    events.push('rush');
    showToast(kitchen, 'RUSH HOUR! Tickets arrive faster — keep the wok hot!', 'warn');
  }

  // New tickets arrive on a timer, faster once rush hour starts.
  kitchen.spawnTimer -= dt;
  if (kitchen.spawnTimer <= 0) {
    if (kitchen.orders.length < ORDERS.maxOpen) spawnOrder(kitchen);
    const interval = kitchen.rush ? ORDERS.spawnIntervalRush : ORDERS.spawnInterval;
    kitchen.spawnTimer = interval * (0.85 + kitchen.rng.next() * 0.3);
  }

  // Patience drains; a ticket at zero walks out and costs a heart.
  for (const order of [...kitchen.orders]) {
    order.patience -= dt;
    if (order.patience <= 10 && !order.ticked) {
      order.ticked = true;
      events.push('tick');
    }
    if (order.patience <= 0) expireOrder(kitchen, order, events);
    if (kitchen.screen !== 'play') return events;
  }

  // Stations cook; a finished item waits to be collected.
  for (const station of kitchen.stations) {
    const item = station.item;
    if (item && !item.done) {
      item.progress += dt / item.duration;
      if (item.progress >= 1) {
        item.progress = 1;
        item.done = true;
        events.push('ready');
      }
    }
  }

  if (kitchen.timeLeft <= 0) {
    const won = kitchen.coins >= kitchen.target;
    endShift(
      kitchen,
      won,
      won
        ? 'Target reached — what a shift!'
        : `Time! ${kitchen.coins} of ${kitchen.target} coins — just short of target.`,
      events,
    );
  }
  return events;
}

/** Take an ingredient off the counter into the hand. Raw ingredients
 *  (peanut sauce, kecap) are ready to plate at once; the rest need a station. */
export function pickIngredient(kitchen, ingredientId) {
  const events = [];
  const ingredient = INGREDIENT_BY_ID[ingredientId];
  if (!ingredient || kitchen.screen !== 'play') return events;
  if (kitchen.hand) {
    // Tapping the same bin again puts the item back.
    if (kitchen.hand.ing === ingredientId) kitchen.hand = null;
    return events;
  }
  kitchen.hand = { ing: ingredientId, ready: ingredient.station === 'raw' };
  events.push('pickup');
  return events;
}

/** Use a station: send the hand's raw ingredient in to cook, or collect a
 *  finished item into an empty hand. Returns the sounds to play. */
export function useStation(kitchen, stationId) {
  const events = [];
  if (kitchen.screen !== 'play') return events;
  const station = kitchen.stations.find((item) => item.id === stationId);
  if (!station) return events;
  const hand = kitchen.hand;

  if (station.item?.done && !hand) {
    kitchen.hand = { ing: station.item.ing, ready: true };
    station.item = null;
    events.push('pickup');
    return events;
  }
  if (!station.item && hand && !hand.ready) {
    const ingredient = INGREDIENT_BY_ID[hand.ing];
    if (ingredient.station !== stationId) {
      events.push('wrong');
      showToast(kitchen, `${ingredient.name} does not go on the ${stationId} — try the ${ingredient.station}.`, 'bad');
      return events;
    }
    station.item = { ing: hand.ing, progress: 0, duration: STATION_TIME[stationId], done: false };
    kitchen.hand = null;
    events.push(ingredient.station === 'grill' || ingredient.station === 'wok' ? 'sizzle' : 'chop');
    return events;
  }
  return events;
}

/** Drop the hand's ready ingredient onto a plate (and select that plate). */
export function addToPlate(kitchen, plateId) {
  const events = [];
  if (kitchen.screen !== 'play') return events;
  const plate = kitchen.plates.find((item) => item.id === plateId);
  if (!plate) return events;
  for (const other of kitchen.plates) other.selected = other.id === plateId;
  const hand = kitchen.hand;
  if (!hand || !hand.ready) return events;
  if (plate.items.includes(hand.ing)) {
    events.push('wrong');
    showToast(kitchen, 'That is already on the plate.', 'bad');
    return events;
  }
  if (plate.items.length >= 4) {
    events.push('wrong');
    showToast(kitchen, 'The plate is full — serve it or clear it.', 'bad');
    return events;
  }
  plate.items.push(hand.ing);
  kitchen.hand = null;
  events.push('plop');
  const dish = plateDish(kitchen, plate);
  if (dish && matchingOrderForPlate(kitchen, plate)) {
    showToast(kitchen, `${dish.name} is ready — serve it!`, 'good');
  }
  return events;
}

/** Select a plate to build on. */
export function selectPlate(kitchen, plateId) {
  for (const plate of kitchen.plates) plate.selected = plate.id === plateId;
}

/** Serve a finished plate to its ticket: coins, tip, combo. */
export function servePlate(kitchen, plateId) {
  const events = [];
  if (kitchen.screen !== 'play') return events;
  const plate = kitchen.plates.find((item) => item.id === plateId);
  if (!plate) return events;
  const order = matchingOrderForPlate(kitchen, plate);
  if (!order) {
    events.push('wrong');
    showToast(kitchen, 'No ticket wants this dish yet — keep building.', 'bad');
    return events;
  }
  const dish = DISH_BY_ID[order.dishId];
  const patienceFraction = Math.max(0, order.patience / order.patienceMax);
  const tip = Math.round(dish.price * 0.5 * patienceFraction) + Math.min(kitchen.combo, 5) * 2;
  kitchen.coins += dish.price + tip;
  kitchen.tipsEarned += tip;
  kitchen.combo += 1;
  kitchen.bestCombo = Math.max(kitchen.bestCombo, kitchen.combo);
  kitchen.served += 1;
  kitchen.orders = kitchen.orders.filter((open) => open.id !== order.id);
  plate.items = [];
  events.push('serve');
  showToast(
    kitchen,
    `Served ${dish.name}! +${dish.price} coins${tip > 0 ? ` + ${tip} tip` : ''}${kitchen.combo >= 2 ? ` — combo x${kitchen.combo}!` : ''}`,
    'good',
  );
  if (kitchen.coins >= kitchen.target) {
    endShift(kitchen, true, `Target smashed: ${kitchen.coins} coins with time to spare!`, events);
  }
  return events;
}

/** Clear the active plate back to empty (the food goes in the bin). */
export function trashPlate(kitchen, plateId) {
  const events = [];
  if (kitchen.screen !== 'play') return events;
  const plate = kitchen.plates.find((item) => item.id === plateId);
  if (!plate || plate.items.length === 0) return events;
  plate.items = [];
  events.push('wrong');
  showToast(kitchen, 'Plate cleared.', 'info');
  return events;
}

/** Pin a ticket: its recipe shows as ghost slots on the plates. */
export function pinOrder(kitchen, orderId) {
  kitchen.pinnedOrderId = kitchen.pinnedOrderId === orderId ? null : orderId;
}

/** The pinned ticket's dish, for the ghost slots on the plates. */
export function pinnedDish(kitchen) {
  const order = kitchen.orders.find((item) => item.id === kitchen.pinnedOrderId);
  return order ? DISH_BY_ID[order.dishId] : null;
}
