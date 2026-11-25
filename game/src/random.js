// A tiny seeded random number generator (mulberry32), so ?seed=N replays the
// same shift: the same tickets arrive in the same order at the same times.

export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** An integer from 0 to max-1. */
    int(max) {
      return Math.floor(this.next() * max);
    },
    /** Pick one entry from an array. */
    pick(list) {
      return list[this.int(list.length)];
    },
  };
}
