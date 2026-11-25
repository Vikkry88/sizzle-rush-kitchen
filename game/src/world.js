// The game's rules and state, with no drawing and no browser in it: the chef,
// the orders on the board, the plate being assembled, chopping and cooking
// work, score, combo and the shift timer. step() advances one fixed step and
// returns what happened as bit flags, so the caller can react with sound and
// announcements without the world knowing about screens or speakers.
import {
  CHEF_SPEED, CHOP_SECONDS, COMBO_MAX, COMBO_STEP, COOK_SECONDS, FLOOR,
  MAX_ORDERS, ORDER_INTERVAL, ORDER_LIFETIME, SERVE_BASE, SERVE_PER_INGREDIENT,
  SHIFT_SECONDS, STATIONS, USE_RADIUS,
} from './config.js';
import { INGREDIENTS, RECIPES, PREP_CHOP, PREP_COOK, PREP_READY } from './recipes.js';

export const EVENT_PICKUP = 1;
export const EVENT_PLACE = 2;
export const EVENT_SERVE = 4;
export const EVENT_EXPIRE = 8;
export const EVENT_OVER = 16;
export const EVENT_WRONG = 32;
export const EVENT_WORK_DONE = 64;
export const EVENT_WORK_START = 128;
export const EVENT_TRASH = 256;

/** Solid counter blocks the chef cannot walk through: { x, z, halfX, halfZ }. */
const OBSTACLES = [
  { x: -0.9, z: -4.35, halfX: 7.6, halfZ: 0.65 }, // north ingredient counter
  { x: -7.9, z: 0.2, halfX: 0.65, halfZ: 2.2 }, // west chopping counter
  { x: 7.9, z: 0.2, halfX: 0.65, halfZ: 2.2 }, // east stove counter
  { x: 0, z: 0.6, halfX: 1.7, halfZ: 0.9 }, // centre assembly island
  { x: 0, z: 4.75, halfX: 2.6, halfZ: 0.6 }, // south serve pass
  { x: 7.2, z: 4.4, halfX: 0.5, halfZ: 0.5 }, // trash bin
];

function stationById(id) {
  for (const station of STATIONS) if (station.id === id) return station;
  return null;
}

/** True when this plated item satisfies the recipe need. */
function itemSatisfies(item, need) {
  if (item.ingredient !== need.ingredient) return false;
  if (need.prep === PREP_READY) return true;
  if (need.prep === PREP_CHOP) return item.prep === 'chopped';
  if (need.prep === PREP_COOK) return item.prep === 'cooked';
  return false;
}

/** The order this exact plate completes, or null. */
function matchingOrder(plate, orders) {
  for (const order of orders) {
    const recipe = RECIPES.find((entry) => entry.id === order.recipeId);
    if (!recipe || recipe.needs.length !== plate.length) continue;
    const used = new Array(plate.length).fill(false);
    let matched = true;
    for (const need of recipe.needs) {
      let found = -1;
      for (let index = 0; index < plate.length; index += 1) {
        if (!used[index] && itemSatisfies(plate[index], need)) { found = index; break; }
      }
      if (found === -1) { matched = false; break; }
      used[found] = true;
    }
    if (matched) return order;
  }
  return null;
}

export function createWorld(random) {
  const chef = { x: 0, z: 2.6, angle: Math.PI, moving: false };
  const state = {
    chef,
    carrying: null,
    plate: [],
    orders: [],
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    shiftLeft: SHIFT_SECONDS,
    elapsed: 0,
    orderTimer: 6,
    work: null,
    flash: null,
    flashTimer: 0,
    plateMatch: null,
    nextOrderUid: 1,
  };

  function reset() {
    chef.x = 0;
    chef.z = 2.6;
    chef.angle = Math.PI;
    chef.moving = false;
    state.carrying = null;
    state.plate = [];
    state.orders = [];
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.shiftLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.orderTimer = 6;
    state.work = null;
    state.flash = null;
    state.flashTimer = 0;
    state.plateMatch = null;
    state.nextOrderUid = 1;
  }

  function setFlash(text) {
    state.flash = text;
    state.flashTimer = 1.6;
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const easy = state.elapsed < 60;
    const pool = easy ? RECIPES.slice(0, 3) : RECIPES;
    const recipe = pool[Math.floor(random() * pool.length)];
    state.orders.push({
      uid: state.nextOrderUid,
      recipeId: recipe.id,
      timeLeft: ORDER_LIFETIME,
    });
    state.nextOrderUid += 1;
  }

  function refreshMatch() {
    state.plateMatch = matchingOrder(state.plate, state.orders);
  }

  function pushOutOfObstacles() {
    for (const block of OBSTACLES) {
      const dx = chef.x - block.x;
      const dz = chef.z - block.z;
      if (Math.abs(dx) > block.halfX + 0.35 || Math.abs(dz) > block.halfZ + 0.35) continue;
      const pushX = block.halfX + 0.35 - Math.abs(dx);
      const pushZ = block.halfZ + 0.35 - Math.abs(dz);
      if (pushX < pushZ) chef.x = block.x + (dx >= 0 ? 1 : -1) * (block.halfX + 0.35);
      else chef.z = block.z + (dz >= 0 ? 1 : -1) * (block.halfZ + 0.35);
    }
  }

  /** The station nearest the chef within reach, or null. */
  function nearestStation() {
    let best = null;
    let bestDistance = USE_RADIUS;
    for (const station of STATIONS) {
      const distance = Math.hypot(chef.x - station.x, chef.z - station.z);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = station;
      }
    }
    return best;
  }

  /** What the E key does at the nearest station. Returns event flags. */
  function use() {
    if (state.work !== null) return 0;
    const station = nearestStation();
    if (station === null) return 0;
    let events = 0;
    if (station.kind === 'bin') {
      if (state.carrying !== null) {
        setFlash('Hands full — plate or trash it first');
        return EVENT_WRONG;
      }
      state.carrying = { ingredient: station.ingredient, prep: 'raw' };
      events |= EVENT_PICKUP;
    } else if (station.kind === 'board' || station.kind === 'stove') {
      if (state.carrying === null) {
        setFlash(station.kind === 'board' ? 'Bring something to chop' : 'Bring something to cook');
        return EVENT_WRONG;
      }
      const ingredient = INGREDIENTS[state.carrying.ingredient];
      const wanted = station.kind === 'board' ? PREP_CHOP : PREP_COOK;
      if (ingredient.prep !== wanted) {
        setFlash(ingredient.prep === PREP_READY ? 'That needs no prep' : station.kind === 'board' ? 'That needs the stove!' : 'That needs the chopping board!');
        return EVENT_WRONG;
      }
      if (state.carrying.prep === (wanted === PREP_CHOP ? 'chopped' : 'cooked')) {
        setFlash('Already done — plate it!');
        return EVENT_WRONG;
      }
      state.work = {
        stationId: station.id,
        kind: station.kind,
        t: 0,
        total: station.kind === 'board' ? CHOP_SECONDS : COOK_SECONDS,
      };
      events |= EVENT_WORK_START;
    } else if (station.kind === 'plate') {
      if (state.carrying !== null) {
        if (state.plate.length >= 4) {
          setFlash('Plate is full — serve it!');
          return EVENT_WRONG;
        }
        const duplicate = state.plate.some((item) => item.ingredient === state.carrying.ingredient && item.prep === state.carrying.prep);
        if (duplicate) {
          setFlash('That is already on the plate');
          return EVENT_WRONG;
        }
        state.plate.push(state.carrying);
        state.carrying = null;
        refreshMatch();
        events |= EVENT_PLACE;
      } else if (state.plate.length > 0) {
        state.carrying = state.plate.pop();
        refreshMatch();
        events |= EVENT_PICKUP;
      } else {
        setFlash('Plate is empty — bring ingredients');
        return EVENT_WRONG;
      }
    } else if (station.kind === 'pass') {
      if (state.plateMatch !== null) {
        const order = state.plateMatch;
        const recipe = RECIPES.find((entry) => entry.id === order.recipeId);
        const multiplier = Math.min(COMBO_MAX, 1 + COMBO_STEP * state.combo);
        const points = Math.round((SERVE_BASE + SERVE_PER_INGREDIENT * recipe.needs.length) * multiplier) + Math.round(order.timeLeft);
        state.score += points;
        state.combo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        state.served += 1;
        state.orders = state.orders.filter((entry) => entry.uid !== order.uid);
        state.plate = [];
        state.plateMatch = null;
        setFlash(`+${points}  ${recipe.name} served!`);
        events |= EVENT_SERVE;
      } else if (state.plate.length > 0) {
        setFlash("Doesn't match any order — check the board");
        events |= EVENT_WRONG;
      } else {
        setFlash('Nothing to serve — build a dish first');
        events |= EVENT_WRONG;
      }
    } else if (station.kind === 'trash') {
      if (state.carrying !== null) {
        state.carrying = null;
        events |= EVENT_TRASH;
      } else if (state.plate.length > 0) {
        state.plate = [];
        state.plateMatch = null;
        events |= EVENT_TRASH;
      } else {
        setFlash('Nothing to throw away');
        return EVENT_WRONG;
      }
    }
    return events;
  }

  /**
   * One fixed step. `move` is the held direction { x, z }; `usePressed` is
   * true on the frame E was pressed. Returns event flags.
   */
  function step(dt, move, usePressed) {
    let events = 0;
    if (state.shiftLeft <= 0) return EVENT_OVER;
    state.elapsed += dt;
    state.shiftLeft = Math.max(0, state.shiftLeft - dt);
    if (state.flashTimer > 0) {
      state.flashTimer -= dt;
      if (state.flashTimer <= 0) state.flash = null;
    }

    if (usePressed) events |= use();

    if (state.work !== null) {
      state.work.t += dt;
      if (state.work.t >= state.work.total) {
        if (state.carrying !== null) state.carrying.prep = state.work.kind === 'board' ? 'chopped' : 'cooked';
        state.work = null;
        events |= EVENT_WORK_DONE;
      }
    } else if (move.x !== 0 || move.z !== 0) {
      // Move one axis at a time so the chef slides along counters instead of sticking to them.
      chef.x += move.x * CHEF_SPEED * dt;
      chef.x = Math.min(FLOOR.width / 2 - 0.6, Math.max(-(FLOOR.width / 2 - 0.6), chef.x));
      pushOutOfObstacles();
      chef.z += move.z * CHEF_SPEED * dt;
      chef.z = Math.min(FLOOR.depth / 2 - 0.6, Math.max(-(FLOOR.depth / 2 - 0.6), chef.z));
      pushOutOfObstacles();
      chef.angle = Math.atan2(move.x, move.z);
      chef.moving = true;
    } else {
      chef.moving = false;
    }

    state.orderTimer -= dt;
    if (state.orderTimer <= 0) {
      spawnOrder();
      state.orderTimer = Math.max(9, ORDER_INTERVAL - state.elapsed / 90);
    }
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        state.orders.splice(index, 1);
        state.combo = 0;
        refreshMatch();
        setFlash('Order expired — combo lost');
        events |= EVENT_EXPIRE;
      }
    }

    if (state.shiftLeft <= 0) events |= EVENT_OVER;
    return events;
  }

  reset();
  return { state, reset, step, use, nearestStation, spawnOrder, refreshMatch, stationById };
}
