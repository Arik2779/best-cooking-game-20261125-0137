// Input: mouse clicks and keyboard shortcuts, turned into kitchen actions.
// Coordinates are converted from the canvas's CSS pixels into the 1280x800
// logical field, so clicks land on the same rectangles render.js draws.

import { INGREDIENTS } from './recipes.js';
import { FIELD, PLATES, STATIONS } from './config.js';
import {
  LAYOUT,
  binRect,
  inRect,
  plateRect,
  serveButtonRect,
  stationRect,
  ticketRect,
} from './render.js';
import {
  activePlate,
  addToPlate,
  matchingOrderForPlate,
  pickIngredient,
  pinOrder,
  selectPlate,
  servePlate,
  trashPlate,
  useStation,
} from './kitchen.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SERVE = 4;

/** Convert a pointer event into logical-field coordinates. */
function toLogical(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
  const offsetX = (rect.width - FIELD.width * scale) / 2;
  const offsetY = (rect.height - FIELD.height * scale) / 2;
  return {
    x: (event.clientX - rect.left - offsetX) / scale,
    y: (event.clientY - rect.top - offsetY) / scale,
  };
}

/**
 * Handle a click while playing. Returns the sounds to play, plus whether the
 * click was a "confirm" (start / resume / restart) when it lands outside the
 * kitchen, which main.js treats as the confirm action.
 */
export function handleClick(kitchen, canvas, event) {
  const events = [];
  const point = toLogical(canvas, event);
  if (kitchen.screen !== 'play') return { events, confirm: true, point };

  // Order board: pin a ticket to see its recipe on the plates.
  for (let i = 0; i < kitchen.orders.length; i += 1) {
    if (inRect(ticketRect(i), point.x, point.y)) {
      pinOrder(kitchen, kitchen.orders[i].id);
      return { events, confirm: false, point };
    }
  }

  // Stations: send food in, or collect it when done.
  for (let i = 0; i < STATIONS.length; i += 1) {
    if (inRect(stationRect(i), point.x, point.y)) {
      events.push(...useStation(kitchen, STATIONS[i].id));
      return { events, confirm: false, point };
    }
  }

  // Counter bins: pick an ingredient up.
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (inRect(binRect(i), point.x, point.y)) {
      events.push(...pickIngredient(kitchen, INGREDIENTS[i].id));
      return { events, confirm: false, point };
    }
  }

  // Serve buttons.
  for (let i = 0; i < PLATES.length; i += 1) {
    if (inRect(serveButtonRect(i), point.x, point.y)) {
      events.push(...servePlate(kitchen, i));
      return { events, confirm: false, point };
    }
  }

  // Plates: select, and drop the hand's food on them.
  for (let i = 0; i < PLATES.length; i += 1) {
    if (inRect(plateRect(i), point.x, point.y)) {
      events.push(...addToPlate(kitchen, i));
      return { events, confirm: false, point };
    }
  }

  // Trash: clear the active plate.
  if (inRect(LAYOUT.trash, point.x, point.y)) {
    events.push(...trashPlate(kitchen, activePlate(kitchen).id));
    return { events, confirm: false, point };
  }

  return { events, confirm: false, point };
}

/**
 * Keyboard: number keys pick ingredients, Q/W/E/R use stations, A/B pick a
 * plate, Space serves a ready plate, T clears the active plate, Esc pauses.
 * Returns the sounds to play plus the action flags main.js needs.
 */
export function handleKey(kitchen, event) {
  const events = [];
  let actions = 0;
  const key = event.key.toLowerCase();

  if (key === 'escape' || key === 'p') {
    actions |= ACTION_PAUSE;
    return { events, actions };
  }
  if (key === 'enter' || key === ' ') {
    actions |= ACTION_CONFIRM;
    if (key === ' ' && kitchen.screen === 'play') actions |= ACTION_SERVE;
    if (key === ' ') event.preventDefault();
    return { events, actions };
  }
  if (kitchen.screen !== 'play') return { events, actions };

  const ingredient = INGREDIENTS.find((ing) => ing.key === key);
  if (ingredient) {
    events.push(...pickIngredient(kitchen, ingredient.id));
    return { events, actions };
  }
  const station = STATIONS.find((item) => item.key.toLowerCase() === key);
  if (station) {
    events.push(...useStation(kitchen, station.id));
    return { events, actions };
  }
  const plate = PLATES.find((item) => item.key.toLowerCase() === key);
  if (plate) {
    selectPlate(kitchen, plate.id);
    return { events, actions };
  }
  if (key === 't') {
    events.push(...trashPlate(kitchen, activePlate(kitchen).id));
    return { events, actions };
  }
  if (key === 's') {
    // Serve the ready plate whose ticket is running out first.
    const ready = kitchen.plates
      .map((item) => ({ plate: item, order: matchingOrderForPlate(kitchen, item) }))
      .filter((entry) => entry.order)
      .sort((a, b) => a.order.patience - b.order.patience)[0];
    if (ready) events.push(...servePlate(kitchen, ready.plate.id));
    return { events, actions };
  }
  return { events, actions };
}
