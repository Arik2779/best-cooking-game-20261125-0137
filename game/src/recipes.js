// The pantry and the menu: ten ingredients, each with the station that
// prepares it (or 'raw' when it goes straight on the plate), and six original
// warung dishes built from them. A dish is its ingredient set: the plate
// matches a ticket when it holds exactly those ingredients, in any order.

/** station: chop | wok | grill | pot | raw (no cooking, straight to the plate). */
export const INGREDIENTS = [
  { id: 'rice', name: 'Rice', station: 'wok', key: '1', colour: '#f5efdc', detail: '#d8cfae' },
  { id: 'egg', name: 'Egg', station: 'wok', key: '2', colour: '#ffd94d', detail: '#fff3c4' },
  { id: 'noodles', name: 'Noodles', station: 'pot', key: '3', colour: '#f2b544', detail: '#e08a2e' },
  { id: 'chicken', name: 'Chicken', station: 'grill', key: '4', colour: '#c97b43', detail: '#8a4f26' },
  { id: 'chili', name: 'Chili', station: 'chop', key: '5', colour: '#e23b2e', detail: '#8f1d12' },
  { id: 'greens', name: 'Greens', station: 'chop', key: '6', colour: '#5da24a', detail: '#2f6b2a' },
  { id: 'skewers', name: 'Skewers', station: 'grill', key: '7', colour: '#a0663a', detail: '#5f3a1e' },
  { id: 'peanut', name: 'Peanut Sauce', station: 'raw', key: '8', colour: '#b06a35', detail: '#7a4218' },
  { id: 'kecap', name: 'Kecap', station: 'raw', key: '9', colour: '#4a2c1c', detail: '#2c180e' },
  { id: 'ricecake', name: 'Rice Cake', station: 'pot', key: '0', colour: '#fbf7ea', detail: '#c9b98a' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

/** price: coins for the dish. tip adds up to half again for a fast serve. */
export const DISHES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng Kampung',
    short: 'Nasi Goreng',
    ingredients: ['rice', 'egg', 'chili', 'kecap'],
    price: 14,
    blurb: 'Wok-fried rice, egg, chili, kecap.',
  },
  {
    id: 'mie-ayam',
    name: 'Mie Ayam',
    short: 'Mie Ayam',
    ingredients: ['noodles', 'chicken', 'greens'],
    price: 16,
    blurb: 'Noodles, grilled chicken, greens.',
  },
  {
    id: 'sate-platter',
    name: 'Sate Platter',
    short: 'Sate Platter',
    ingredients: ['skewers', 'peanut', 'ricecake'],
    price: 18,
    blurb: 'Grilled skewers, peanut sauce, rice cake.',
  },
  {
    id: 'ayam-geprek',
    name: 'Ayam Geprek',
    short: 'Ayam Geprek',
    ingredients: ['chicken', 'chili', 'rice'],
    price: 15,
    blurb: 'Smashed grilled chicken, chili, rice.',
  },
  {
    id: 'soto-ayam',
    name: 'Soto Ayam',
    short: 'Soto Ayam',
    ingredients: ['noodles', 'chicken', 'egg', 'greens'],
    price: 20,
    blurb: 'The big one: four stations, one bowl.',
  },
  {
    id: 'gado-gado',
    name: 'Gado-Gado',
    short: 'Gado-Gado',
    ingredients: ['greens', 'egg', 'peanut', 'ricecake'],
    price: 17,
    blurb: 'Greens, egg, peanut sauce, rice cake.',
  },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((dish) => [dish.id, dish]));

/** The same ingredient set, whatever order the plate holds it in. */
export function sameIngredients(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((ing, index) => ing === sortedB[index]);
}

/** The dish a plate's contents make, or null when it matches no dish. */
export function dishForPlate(items) {
  return DISHES.find((dish) => sameIngredients(dish.ingredients, items)) ?? null;
}
