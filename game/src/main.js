// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play,
// paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld,
  EVENT_EXPIRE,
  EVENT_OVER,
  EVENT_PICKUP,
  EVENT_PLACE,
  EVENT_SERVE,
  EVENT_TRASH,
  EVENT_WORK_DONE,
  EVENT_WORK_START,
  EVENT_WRONG,
} from './world.js';
import {
  ACTION_CONFIRM,
  ACTION_PAUSE,
  ACTION_RESTART,
  ACTION_USE,
  createInput,
} from './input.js';
import { createAudio } from './audio.js';
import { createHud, promptForStation } from './hud.js';
import { createKitchen } from './kitchen.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('scene');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
window.__world = world;
const renderer = createRenderer(canvas);
const kitchen = createKitchen(renderer.scene);
const hud = createHud();
const audio = createAudio();

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  let time = 0;
  function paint() {
    time += 1 / 60;
    kitchen.update(world.state, time);
    renderer.draw(world.state, time);
    hud.draw(world.state, scene.screen, '', scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput();
  let screen = SCREEN_TITLE;
  let best = 0;
  let accumulator = 0;
  let last = performance.now();
  let time = 0;
  let lastTickSecond = -1;
  let useQueued = false;

  // Screen readers (and anyone watching the page's text) hear the screen changes and each serve.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.start();
    announce('Playing. Your shift has started.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) best = world.state.score;
    announce(`Shift over. Score ${world.state.score}. Dishes served ${world.state.served}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_SERVE) {
      audio.serve();
      announce(`Served! Score ${world.state.score}.`);
    }
    if (events & EVENT_EXPIRE) audio.expire();
    if (events & EVENT_PICKUP) audio.pickup();
    if (events & EVENT_PLACE) audio.place();
    if (events & EVENT_TRASH) audio.place();
    if (events & EVENT_WRONG) audio.wrong();
    if (events & EVENT_WORK_START) {
      if (world.state.work !== null && world.state.work.kind === 'stove') audio.sizzle();
      else audio.chop();
    }
    if (events & EVENT_WORK_DONE) audio.done();
  }

  function handleActions() {
    const actions = input.takeActions();
    // The use press is queued for the world step below, not swallowed here:
    // handleActions and step both take actions, so E must survive this call.
    if (actions & ACTION_USE) useQueued = true;
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_RESTART && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    const usePressed = useQueued;
    useQueued = false;
    const events = world.step(STEP, input.move(), usePressed);
    handleEvents(events);
    if (events & EVENT_OVER) endGame();
    const whole = Math.ceil(world.state.shiftLeft);
    if (whole <= 10 && whole !== lastTickSecond && whole > 0) {
      lastTickSecond = whole;
      audio.tick();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    time += Math.min((now - last) / 1000, MAX_FRAME);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    kitchen.update(world.state, time);
    renderer.draw(world.state, time);
    const prompt = screen === SCREEN_PLAY ? promptForStation(world.nearestStation(), world.state) : '';
    hud.draw(world.state, screen, prompt, best);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });
  canvas.addEventListener('pointerdown', () => {
    audio.unlock();
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
  });

  announce('Sizzle Rush. Press Enter or click to start your shift.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
