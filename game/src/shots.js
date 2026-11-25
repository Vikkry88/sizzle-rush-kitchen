// The screenshot scenes behind ?shot=start|play|end. Each one sets the world
// to a fixed, seeded state — the same seed always gives the same frame — so
// the screenshots show the game at its busiest: orders on the board, a dish
// mid-assembly on the plate, the timer running and the chef at work.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Put three orders on the board with staggered timers. */
function seedOrders(world, times) {
  const state = world.state;
  state.orders = [];
  const ids = ['ember-burger', 'sunset-ramen', 'golden-satay', 'sizzle-stack'];
  times.forEach((seconds, index) => {
    state.orders.push({ uid: index + 1, recipeId: ids[index], timeLeft: seconds });
  });
  state.nextOrderUid = times.length + 1;
  world.refreshMatch();
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name !== 'play' && name !== 'end') {
    seedOrders(world, [48, 36, 27]);
    state.plate = [
      { ingredient: 'bun', prep: 'raw' },
      { ingredient: 'cheese', prep: 'raw' },
    ];
    state.carrying = { ingredient: 'patty', prep: 'cooked' };
    state.chef.x = 1.6;
    state.chef.z = 2.2;
    state.chef.angle = Math.atan2(-1.6, -1.6);
    state.score = 0;
    state.shiftLeft = 180;
    world.refreshMatch();
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    seedOrders(world, [41, 29, 18, 9]);
    state.plate = [
      { ingredient: 'bun', prep: 'raw' },
      { ingredient: 'patty', prep: 'cooked' },
      { ingredient: 'cheese', prep: 'raw' },
    ];
    state.carrying = { ingredient: 'lettuce', prep: 'chopped' };
    state.chef.x = 1.4;
    state.chef.z = 2.0;
    state.chef.angle = Math.atan2(-1.4, -1.4);
    state.score = 340;
    state.combo = 2;
    state.bestCombo = 2;
    state.served = 2;
    state.shiftLeft = 132;
    state.work = null;
    world.refreshMatch();
    return { screen: SCREEN_PLAY, best: 340 };
  }
  seedOrders(world, [33, 14]);
  state.plate = [
    { ingredient: 'noodle', prep: 'cooked' },
    { ingredient: 'broth', prep: 'raw' },
    { ingredient: 'tomato', prep: 'chopped' },
  ];
  state.carrying = null;
  state.chef.x = 0.6;
  state.chef.z = 3.0;
  state.chef.angle = Math.PI;
  state.score = 1240;
  state.combo = 4;
  state.bestCombo = 4;
  state.served = 9;
  state.shiftLeft = 0;
  world.refreshMatch();
  return { screen: SCREEN_OVER, best: 1240 };
}
