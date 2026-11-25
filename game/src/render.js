// The renderer: everything the player sees, painted on one canvas with
// procedural shapes — no images, no fonts loaded, no network. The layout is
// fixed for the 1280x800 logical field; input.js imports LAYOUT so clicks
// land on exactly the rectangles drawn here.

import { DISH_BY_ID, INGREDIENTS, INGREDIENT_BY_ID } from './recipes.js';
import { FIELD, FONT, PALETTE, PLATES, STATIONS, STATION_TIME } from './config.js';
import { activePlate, matchingOrderForPlate, pinnedDish, plateDish } from './kitchen.js';

/** Where every clickable thing sits, in logical pixels. */
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 70 },
  board: { x: 16, y: 82, w: 284, h: 700 },
  stations: { x: 316, y: 90, w: 584, h: 162 },
  counter: { x: 316, y: 268, w: 584, h: 288 },
  plates: { x: 916, y: 90, w: 348, h: 696 },
  trash: { x: 316, y: 700, w: 180, h: 52 },
  serveHint: { x: 516, y: 700, w: 384, h: 52 },
};

export function stationRect(index) {
  const gap = 8;
  const w = (LAYOUT.stations.w - gap * (STATIONS.length - 1)) / STATIONS.length;
  return { x: LAYOUT.stations.x + index * (w + gap), y: LAYOUT.stations.y, w, h: LAYOUT.stations.h };
}

export function binRect(index) {
  const cols = 5;
  const gap = 6;
  const w = (LAYOUT.counter.w - gap * (cols - 1)) / cols;
  const h = (LAYOUT.counter.h - gap) / 2;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { x: LAYOUT.counter.x + col * (w + gap), y: LAYOUT.counter.y + row * (h + gap), w, h };
}

export function plateRect(index) {
  const h = (LAYOUT.plates.h - 16) / 2;
  return { x: LAYOUT.plates.x, y: LAYOUT.plates.y + index * (h + 16), w: LAYOUT.plates.w, h };
}

export function serveButtonRect(plateIndex) {
  const rect = plateRect(plateIndex);
  return { x: rect.x + 24, y: rect.y + rect.h - 58, w: rect.w - 48, h: 44 };
}

export function ticketRect(index) {
  const gap = 10;
  const h = 162;
  return { x: LAYOUT.board.x, y: LAYOUT.board.y + index * (h + gap), w: LAYOUT.board.w, h };
}

function inRect(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, weight = 'bold', align = 'left') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function heart(ctx, cx, cy, size, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.7);
  ctx.bezierCurveTo(cx - size, cy, cx - size * 0.55, cy - size * 0.8, cx, cy - size * 0.25);
  ctx.bezierCurveTo(cx + size * 0.55, cy - size * 0.8, cx + size, cy, cx, cy + size * 0.7);
  ctx.fill();
}

function coinIcon(ctx, cx, cy, r) {
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a87c1e';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'C', cx, cy + 1, r * 1.1, '#8a6210', 'bold', 'center');
}

/** Draw one ingredient as a little procedural picture. size is its radius. */
export function drawIngredientIcon(ctx, ingredientId, cx, cy, size, cooked = false) {
  const ing = INGREDIENT_BY_ID[ingredientId];
  if (!ing) return;
  const s = size;
  ctx.save();
  ctx.translate(cx, cy);
  switch (ingredientId) {
    case 'rice': {
      ctx.fillStyle = '#3f6db3';
      ctx.beginPath();
      ctx.arc(0, s * 0.25, s * 0.85, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = cooked ? '#f7e9b0' : '#f5efdc';
      ctx.beginPath();
      ctx.arc(-s * 0.35, -s * 0.15, s * 0.4, 0, Math.PI * 2);
      ctx.arc(s * 0.3, -s * 0.25, s * 0.42, 0, Math.PI * 2);
      ctx.arc(0, -s * 0.4, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'egg': {
      ctx.fillStyle = '#fff8e6';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.95, s * 0.75, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cooked ? '#ffb62e' : '#ffd94d';
      ctx.beginPath();
      ctx.arc(s * 0.1, -s * 0.05, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffdf7a';
      ctx.beginPath();
      ctx.arc(s * 0.02, -s * 0.12, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'noodles': {
      ctx.fillStyle = '#3f6db3';
      ctx.beginPath();
      ctx.arc(0, s * 0.2, s * 0.9, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = cooked ? '#e89a1e' : '#f2b544';
      ctx.lineWidth = s * 0.22;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, -s * 0.3 + i * s * 0.3);
        ctx.quadraticCurveTo(0, -s * 0.55 + i * s * 0.3, s * 0.6, -s * 0.3 + i * s * 0.3);
        ctx.stroke();
      }
      break;
    }
    case 'chicken': {
      ctx.fillStyle = cooked ? '#a35a24' : '#c97b43';
      ctx.beginPath();
      ctx.ellipse(-s * 0.1, s * 0.1, s * 0.62, s * 0.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5efdc';
      ctx.lineWidth = s * 0.22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.35, -s * 0.35);
      ctx.lineTo(s * 0.75, -s * 0.75);
      ctx.stroke();
      ctx.fillStyle = '#f5efdc';
      ctx.beginPath();
      ctx.arc(s * 0.82, -s * 0.82, s * 0.2, 0, Math.PI * 2);
      ctx.arc(s * 0.62, -s * 0.95, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chili': {
      ctx.fillStyle = '#8f1d12';
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, s * 0.3);
      ctx.quadraticCurveTo(-s * 0.2, s * 0.9, s * 0.7, -s * 0.2);
      ctx.quadraticCurveTo(s * 0.9, -s * 0.5, s * 0.55, -s * 0.55);
      ctx.quadraticCurveTo(s * 0.1, s * 0.1, -s * 0.55, -s * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5da24a';
      ctx.lineWidth = s * 0.18;
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, s * 0.05);
      ctx.lineTo(-s * 0.95, -s * 0.25);
      ctx.stroke();
      break;
    }
    case 'greens': {
      ctx.fillStyle = '#5da24a';
      for (let i = -1; i <= 1; i += 1) {
        ctx.save();
        ctx.rotate(i * 0.6);
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.35, s * 0.3, s * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#2f6b2a';
      ctx.lineWidth = s * 0.1;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.2);
      ctx.lineTo(0, s * 0.85);
      ctx.stroke();
      break;
    }
    case 'skewers': {
      ctx.strokeStyle = '#d8cfae';
      ctx.lineWidth = s * 0.12;
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, s * 0.6);
      ctx.lineTo(s * 0.8, -s * 0.6);
      ctx.moveTo(-s * 0.8, -s * 0.2);
      ctx.lineTo(s * 0.8, -s * 0.95);
      ctx.stroke();
      ctx.fillStyle = cooked ? '#7a4218' : '#a0663a';
      const cubes = [[-0.45, 0.25], [0, -0.1], [0.45, -0.45], [-0.45, -0.55], [0, -0.85]];
      for (const [dx, dy] of cubes) {
        ctx.fillRect(dx * s - s * 0.2, dy * s - s * 0.2, s * 0.4, s * 0.4);
      }
      break;
    }
    case 'peanut': {
      ctx.fillStyle = '#7a4218';
      ctx.beginPath();
      ctx.arc(0, s * 0.25, s * 0.85, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#b06a35';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.1, s * 0.7, s * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e8b04b';
      ctx.lineWidth = s * 0.1;
      ctx.beginPath();
      ctx.arc(0, -s * 0.1, s * 0.35, 0.3, Math.PI * 1.4);
      ctx.stroke();
      break;
    }
    case 'kecap': {
      ctx.fillStyle = '#2c180e';
      roundRect(ctx, -s * 0.35, -s * 0.5, s * 0.7, s * 1.15, s * 0.15);
      ctx.fill();
      ctx.fillRect(-s * 0.18, -s * 0.95, s * 0.36, s * 0.5);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-s * 0.35, -s * 0.1, s * 0.7, s * 0.45);
      text(ctx, 'K', 0, s * 0.14, s * 0.4, '#fff6e3', 'bold', 'center');
      break;
    }
    case 'ricecake': {
      ctx.save();
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#fbf7ea';
      ctx.fillRect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
      ctx.strokeStyle = '#7da05a';
      ctx.lineWidth = s * 0.16;
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s * 0.2);
      ctx.lineTo(s * 0.6, -s * 0.2);
      ctx.moveTo(-s * 0.6, s * 0.2);
      ctx.lineTo(s * 0.6, s * 0.2);
      ctx.moveTo(-s * 0.2, -s * 0.6);
      ctx.lineTo(-s * 0.2, s * 0.6);
      ctx.moveTo(s * 0.2, -s * 0.6);
      ctx.lineTo(s * 0.2, s * 0.6);
      ctx.stroke();
      ctx.restore();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function drawBackground(ctx, kitchen) {
  // Wall, wainscot band and warm floor tiles: the warung at dusk.
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, FIELD.width, 330);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 330, FIELD.width, 310);
  ctx.fillStyle = '#5f3a1e';
  ctx.fillRect(0, 626, FIELD.width, 14);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 640, FIELD.width, 160);
  ctx.fillStyle = PALETTE.floorTile;
  for (let x = 0; x < FIELD.width; x += 80) ctx.fillRect(x + 4, 660, 72, 60);
  for (let x = 0; x < FIELD.width; x += 80) ctx.fillRect(x + 44, 730, 72, 60);
  void kitchen;
}

function drawHUD(ctx, kitchen) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, FIELD.width, LAYOUT.hud.h);
  text(ctx, 'SIMMER & SERVE', 20, 26, 26, PALETTE.hudText);
  text(ctx, 'Warung Rush', 20, 52, 14, PALETTE.muted, 'normal');

  // Shift timer, big and centre: it turns red and pulses under 30 seconds.
  const urgent = kitchen.timeLeft <= 30 && kitchen.screen === 'play';
  const pulse = urgent ? 0.75 + 0.25 * Math.sin(kitchen.time * 8) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, formatTime(kitchen.timeLeft), 640, 34, 34, urgent ? '#ff6b5e' : PALETTE.text, 'bold', 'center');
  ctx.restore();
  text(ctx, kitchen.rush ? 'RUSH HOUR!' : 'SHIFT TIMER', 640, 58, 12, urgent ? '#ff6b5e' : PALETTE.muted, 'bold', 'center');

  // Shift progress bar under the timer.
  const progress = kitchen.time / 150;
  ctx.fillStyle = '#3a2f26';
  roundRect(ctx, 520, 64, 240, 5, 2);
  ctx.fill();
  ctx.fillStyle = urgent ? '#ff6b5e' : PALETTE.accent;
  roundRect(ctx, 520, 64, 240 * Math.min(1, progress), 5, 2);
  ctx.fill();

  // Coins and target.
  coinIcon(ctx, 900, 26, 15);
  text(ctx, `${kitchen.coins} / ${kitchen.target} coins`, 922, 26, 22, PALETTE.hudText);
  text(ctx, `served ${kitchen.served} · combo x${kitchen.combo}`, 922, 52, 13, PALETTE.muted, 'normal');

  // Hearts.
  for (let i = 0; i < 3; i += 1) {
    heart(ctx, 1150 + i * 34, 30, 13, i < kitchen.hearts ? '#ff5e6e' : '#4a3a30');
  }
  text(ctx, 'HEARTS', 1133, 56, 11, PALETTE.muted, 'bold', 'center');
}

function drawOrderBoard(ctx, kitchen) {
  ctx.fillStyle = PALETTE.boardFrame;
  roundRect(ctx, LAYOUT.board.x - 4, LAYOUT.board.y - 4, LAYOUT.board.w + 8, LAYOUT.board.h + 8, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.w, LAYOUT.board.h, 10);
  ctx.fill();
  text(ctx, 'ORDER BOARD', LAYOUT.board.x + LAYOUT.board.w / 2, LAYOUT.board.y + 22, 18, '#f2c94c', 'bold', 'center');

  if (kitchen.orders.length === 0) {
    text(ctx, 'No tickets yet…', LAYOUT.board.x + LAYOUT.board.w / 2, LAYOUT.board.y + 90, 15, PALETTE.muted, 'normal', 'center');
    text(ctx, 'The dinner crowd is coming.', LAYOUT.board.x + LAYOUT.board.w / 2, LAYOUT.board.y + 116, 13, PALETTE.muted, 'normal', 'center');
    return;
  }

  kitchen.orders.forEach((order, index) => {
    const dish = DISH_BY_ID[order.dishId];
    const rect = ticketRect(index);
    const fraction = Math.max(0, order.patience / order.patienceMax);
    const pinned = kitchen.pinnedOrderId === order.id;
    const matched = kitchen.plates.some((plate) => matchingOrderForPlate(kitchen, plate)?.id === order.id);

    ctx.fillStyle = pinned ? '#4a3a1e' : '#f7ead0';
    if (matched) ctx.fillStyle = '#d8f0c0';
    roundRect(ctx, rect.x + 6, rect.y, rect.w - 12, rect.h, 10);
    ctx.fill();
    if (matched) {
      ctx.strokeStyle = '#58c96b';
      ctx.lineWidth = 4;
      roundRect(ctx, rect.x + 6, rect.y, rect.w - 12, rect.h, 10);
      ctx.stroke();
    }

    text(ctx, `#${order.id}  ${dish.name}`, rect.x + 20, rect.y + 26, 17, PALETTE.paperInk);
    coinIcon(ctx, rect.x + rect.w - 46, rect.y + 26, 11);
    text(ctx, `${dish.price}`, rect.x + rect.w - 30, rect.y + 26, 16, PALETTE.paperInk);

    dish.ingredients.forEach((ingId, i) => {
      drawIngredientIcon(ctx, ingId, rect.x + 38 + i * 56, rect.y + 72, 22, true);
      text(ctx, INGREDIENT_BY_ID[ingId].name, rect.x + 38 + i * 56, rect.y + 108, 10, PALETTE.paperInk, 'normal', 'center');
    });

    // Patience bar: green to red as the customer loses patience.
    const barX = rect.x + 20;
    const barY = rect.y + rect.h - 30;
    const barW = rect.w - 40;
    ctx.fillStyle = '#d8cfae';
    roundRect(ctx, barX, barY, barW, 14, 7);
    ctx.fill();
    ctx.fillStyle = fraction > 0.5 ? '#7fc96b' : fraction > 0.25 ? '#f2c94c' : '#e5534b';
    roundRect(ctx, barX, barY, barW * fraction, 14, 7);
    ctx.fill();
    text(ctx, matched ? 'READY TO SERVE!' : `${Math.ceil(order.patience)}s patience`, barX + barW / 2, barY + 7, 11, fraction > 0.25 ? '#3d2b1f' : '#fff6e3', 'bold', 'center');
  });
}

function drawStations(ctx, kitchen) {
  text(ctx, 'STATIONS — click a raw ingredient, then its station', LAYOUT.stations.x, LAYOUT.stations.y - 14, 13, PALETTE.muted, 'bold');
  STATIONS.forEach((station, index) => {
    const rect = stationRect(index);
    const state = kitchen.stations[index];
    const item = state.item;
    ctx.fillStyle = PALETTE.counterFront;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, rect.x, rect.y, rect.w, 34, 12);
    ctx.fill();
    text(ctx, station.name.toUpperCase(), rect.x + rect.w / 2, rect.y + 17, 14, '#3d2b1f', 'bold', 'center');
    text(ctx, `[${station.key}] ${STATION_TIME[station.id]}s`, rect.x + rect.w / 2, rect.y + 52, 12, PALETTE.muted, 'normal', 'center');

    if (item) {
      drawIngredientIcon(ctx, item.ing, rect.x + rect.w / 2, rect.y + 96, 26, item.done);
      if (!item.done) {
        // Progress ring around the cooking food.
        ctx.strokeStyle = '#3a2f26';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(rect.x + rect.w / 2, rect.y + 96, 36, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = station.colour;
        ctx.beginPath();
        ctx.arc(rect.x + rect.w / 2, rect.y + 96, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * item.progress);
        ctx.stroke();
        text(ctx, `${Math.ceil((1 - item.progress) * item.duration)}s`, rect.x + rect.w / 2, rect.y + 142, 13, PALETTE.text, 'bold', 'center');
      } else {
        ctx.fillStyle = '#58c96b';
        ctx.beginPath();
        ctx.arc(rect.x + rect.w - 18, rect.y + 66, 13, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, '✓', rect.x + rect.w - 18, rect.y + 67, 15, '#fff', 'bold', 'center');
        text(ctx, 'READY — click to take', rect.x + rect.w / 2, rect.y + 142, 12, '#7fc96b', 'bold', 'center');
      }
    } else {
      ctx.fillStyle = 'rgba(255,246,227,0.18)';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + 96, 30, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'empty', rect.x + rect.w / 2, rect.y + 96, 12, PALETTE.muted, 'normal', 'center');
    }
  });
}

function drawCounter(ctx, kitchen) {
  text(ctx, 'COUNTER — ingredients (click to pick up; keys 1–0)', LAYOUT.counter.x, LAYOUT.counter.y - 14, 13, PALETTE.muted, 'bold');
  INGREDIENTS.forEach((ing, index) => {
    const rect = binRect(index);
    const inHand = kitchen.hand?.ing === ing.id;
    ctx.fillStyle = inHand ? '#4a3a1e' : PALETTE.counterFront;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
    if (inHand) {
      ctx.strokeStyle = '#ffb347';
      ctx.lineWidth = 3;
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, rect.x, rect.y, rect.w, 26, 12);
    ctx.fill();
    text(ctx, `[${ing.key}] ${ing.name}`, rect.x + rect.w / 2, rect.y + 13, 12, '#3d2b1f', 'bold', 'center');
    drawIngredientIcon(ctx, ing.id, rect.x + rect.w / 2, rect.y + 66, 30, ing.station === 'raw');
    const station = ing.station === 'raw' ? 'ready to plate' : `→ ${ing.station} ${STATION_TIME[ing.station]}s`;
    text(ctx, station, rect.x + rect.w / 2, rect.y + rect.h - 16, 11, PALETTE.muted, 'normal', 'center');
  });
}

function drawPlates(ctx, kitchen) {
  text(ctx, 'PLATES — build dishes here, then SERVE', LAYOUT.plates.x, LAYOUT.plates.y - 14, 13, PALETTE.muted, 'bold');
  const ghost = pinnedDish(kitchen);
  PLATES.forEach((plateDef, index) => {
    const plate = kitchen.plates[index];
    const rect = plateRect(index);
    const dish = plateDish(kitchen, plate);
    const order = matchingOrderForPlate(kitchen, plate);
    ctx.fillStyle = plate.selected ? '#4a3626' : '#3a2b26';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
    ctx.fill();
    if (plate.selected) {
      ctx.strokeStyle = '#ffb347';
      ctx.lineWidth = 3;
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
      ctx.stroke();
    }
    text(ctx, `${plateDef.name.toUpperCase()}  [${plateDef.key}]`, rect.x + 20, rect.y + 24, 15, PALETTE.text);
    if (order) text(ctx, `→ Ticket #${order.id}`, rect.x + rect.w - 20, rect.y + 24, 14, '#7fc96b', 'bold', 'right');

    // The plate itself, with the food on it.
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + 128;
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath();
    ctx.arc(cx, cy, 88, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.plateRim;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.stroke();

    if (plate.items.length === 0 && ghost) {
      text(ctx, 'Pinned recipe:', cx, cy - 96, 12, PALETTE.muted, 'normal', 'center');
      ghost.ingredients.forEach((ingId, i) => {
        const angle = (i / ghost.ingredients.length) * Math.PI * 2 - Math.PI / 2;
        ctx.globalAlpha = 0.45;
        drawIngredientIcon(ctx, ingId, cx + Math.cos(angle) * 38, cy + Math.sin(angle) * 30, 20, true);
        ctx.globalAlpha = 1;
      });
    } else if (plate.items.length === 0) {
      text(ctx, 'Empty plate', cx, cy, 14, '#8b93a3', 'normal', 'center');
      text(ctx, 'click a ticket to pin its recipe', cx, cy + 22, 11, '#8b93a3', 'normal', 'center');
    } else {
      plate.items.forEach((ingId, i) => {
        const angle = (i / plate.items.length) * Math.PI * 2 - Math.PI / 2;
        drawIngredientIcon(ctx, ingId, cx + Math.cos(angle) * 38, cy + Math.sin(angle) * 30, 24, true);
      });
    }

    // Slots: what is on the plate, and what the matched dish still needs.
    const slotY = rect.y + rect.h - 108;
    const slots = dish ? dish.ingredients : ghost ? ghost.ingredients : [];
    const slotCount = Math.max(plate.items.length, slots.length, 1);
    const slotW = Math.min(64, (rect.w - 48) / slotCount);
    for (let i = 0; i < slotCount; i += 1) {
      const sx = rect.x + 24 + i * slotW + slotW / 2;
      const filled = plate.items[i];
      ctx.fillStyle = filled ? '#f7ead0' : 'rgba(255,246,227,0.15)';
      roundRect(ctx, sx - slotW / 2 + 3, slotY, slotW - 6, 34, 8);
      ctx.fill();
      if (filled) drawIngredientIcon(ctx, filled, sx, slotY + 17, 13, true);
      else if (slots[i]) {
        ctx.globalAlpha = 0.4;
        drawIngredientIcon(ctx, slots[i], sx, slotY + 17, 13, true);
        ctx.globalAlpha = 1;
      }
    }
    if (dish) text(ctx, order ? `${dish.name} — READY!` : `${dish.name} (no ticket yet)`, cx, slotY - 14, 14, order ? '#7fc96b' : PALETTE.muted, 'bold', 'center');

    // Serve button.
    const button = serveButtonRect(index);
    const ready = Boolean(order);
    ctx.fillStyle = ready ? PALETTE.serve : '#4a3a30';
    roundRect(ctx, button.x, button.y, button.w, button.h, 10);
    ctx.fill();
    if (ready) {
      ctx.strokeStyle = '#b8f0c0';
      ctx.lineWidth = 2;
      roundRect(ctx, button.x, button.y, button.w, button.h, 10);
      ctx.stroke();
    }
    text(ctx, ready ? '★ SERVE DISH  [Space]' : 'SERVE DISH', button.x + button.w / 2, button.y + button.h / 2, 17, ready ? '#fff' : '#8b93a3', 'bold', 'center');
  });
}

function drawBottomBar(ctx, kitchen, mouse) {
  // Trash button.
  const trash = LAYOUT.trash;
  ctx.fillStyle = kitchen.plates.some((plate) => plate.items.length > 0) ? '#7a3a2e' : '#4a3a30';
  roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 10);
  ctx.fill();
  text(ctx, 'Clear plate [T]', trash.x + trash.w / 2, trash.y + trash.h / 2, 15, PALETTE.text, 'bold', 'center');

  // Help line.
  text(ctx, 'Click ingredient → its station → plate · Space serves · Esc pauses', LAYOUT.serveHint.x + LAYOUT.serveHint.w / 2, LAYOUT.serveHint.y + 16, 13, PALETTE.muted, 'normal', 'center');
  text(ctx, 'Plan the route: grill first (4s), chop while it cooks, batch the shared ingredients.', LAYOUT.serveHint.x + LAYOUT.serveHint.w / 2, LAYOUT.serveHint.y + 38, 12, PALETTE.muted, 'normal', 'center');

  // The hand: what the player is carrying, following the cursor.
  if (kitchen.hand && mouse) {
    const ing = INGREDIENT_BY_ID[kitchen.hand.ing];
    ctx.fillStyle = 'rgba(36,26,20,0.9)';
    roundRect(ctx, mouse.x + 14, mouse.y - 34, 150, 30, 8);
    ctx.fill();
    drawIngredientIcon(ctx, ing.id, mouse.x + 30, mouse.y - 19, 11, kitchen.hand.ready);
    text(ctx, kitchen.hand.ready ? `${ing.name} (ready)` : `${ing.name} (raw)`, mouse.x + 46, mouse.y - 19, 12, PALETTE.text, 'bold');
  }

  // Toast message.
  if (kitchen.toast && kitchen.time < kitchen.toast.until) {
    const colours = { good: '#2f6b2a', bad: '#7a2a22', warn: '#8a6210', info: '#3a2f26' };
    const message = kitchen.toast.text;
    ctx.fillStyle = colours[kitchen.toast.kind] ?? colours.info;
    const w = Math.min(720, 20 + message.length * 8.4);
    roundRect(ctx, FIELD.width / 2 - w / 2, 84, w, 34, 10);
    ctx.fill();
    text(ctx, message, FIELD.width / 2, 101, 14, '#fff6e3', 'bold', 'center');
  }
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(20,12,8,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#2e2620';
  roundRect(ctx, 290, 170, 700, 460, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  roundRect(ctx, 290, 170, 700, 460, 18);
  ctx.stroke();
  text(ctx, title, 640, 232, 40, accent, 'bold', 'center');
  lines.forEach((line, i) => {
    text(ctx, line.text, 640, 296 + i * 34, line.size ?? 17, line.colour ?? PALETTE.text, line.weight ?? 'normal', 'center');
  });
}

function drawTitle(ctx, kitchen, best) {
  drawOverlay(ctx, 'SIMMER & SERVE', [
    { text: '— Warung Rush —', size: 22, colour: PALETTE.accent },
    { text: 'Run a warung kitchen through the dinner rush.', size: 18 },
    { text: 'Chop, fry, grill and boil — plate each ticket before its patience runs out.', size: 16, colour: PALETTE.muted },
    { text: 'Reach 120 coins before the shift timer ends. 3 hearts: an expired ticket costs one.', size: 16, colour: PALETTE.muted },
    { text: 'Click or press Enter to start', size: 20, colour: '#7fc96b', weight: 'bold' },
    { text: best > 0 ? `Best shift so far: ${best} coins` : 'Your first shift — good luck, chef!', size: 15, colour: PALETTE.muted },
  ], PALETTE.accent);
  void kitchen;
}

function drawPaused(ctx) {
  drawOverlay(ctx, 'PAUSED', [
    { text: 'The kitchen waits. The tickets do not — not really.', size: 17, colour: PALETTE.muted },
    { text: 'Press Esc or click to keep cooking', size: 19, colour: '#7fc96b', weight: 'bold' },
  ], PALETTE.muted);
}

function drawOver(ctx, kitchen, best) {
  const title = kitchen.won ? 'SHIFT COMPLETE!' : 'SHIFT OVER';
  drawOverlay(ctx, title, [
    { text: kitchen.overReason, size: 17 },
    { text: `Coins: ${kitchen.coins} / ${kitchen.target}   ·   Dishes served: ${kitchen.served}   ·   Tips earned: ${kitchen.tipsEarned}`, size: 17 },
    { text: `Best combo: x${kitchen.bestCombo}   ·   Tickets lost: ${kitchen.expired}   ·   Best shift: ${best} coins`, size: 15, colour: PALETTE.muted },
    { text: kitchen.won ? 'The warung survives another night. ★★★' : 'The crowd drifted away. Tomorrow is another shift.', size: 16, colour: PALETTE.accent },
    { text: 'Press Enter to play again', size: 19, colour: '#7fc96b', weight: 'bold' },
  ], kitchen.won ? '#7fc96b' : '#e5534b');
}

/** The renderer: one canvas, scaled to fit the window, drawn every frame. */
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const SCREEN_TITLE = 'title';
  const SCREEN_PAUSED = 'paused';
  const SCREEN_OVER = 'over';

  function draw(kitchen, best, mouse) {
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const offsetX = (canvas.width - FIELD.width * scale) / 2;
    const offsetY = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#171009';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    drawBackground(ctx, kitchen);
    drawHUD(ctx, kitchen);
    drawOrderBoard(ctx, kitchen);
    drawStations(ctx, kitchen);
    drawCounter(ctx, kitchen);
    drawPlates(ctx, kitchen);
    drawBottomBar(ctx, kitchen, mouse);

    if (kitchen.screen === SCREEN_TITLE) drawTitle(ctx, kitchen, best);
    else if (kitchen.screen === SCREEN_PAUSED) drawPaused(ctx);
    else if (kitchen.screen === SCREEN_OVER) drawOver(ctx, kitchen, best);
  }

  return { draw };
}

export { inRect };
