// The DOM heads-up display: score, combo, shift timer, the order board, the
// carried item, the plate being assembled and the contextual prompt. Text is
// rebuilt only when it changes, so a frame allocates nothing.
import { INGREDIENTS, RECIPES, itemLabel, prepNeeded, PREP_READY } from './recipes.js';
import { COMBO_MAX, COMBO_STEP } from './config.js';

function formatTimer(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
}

function recipeById(id) {
  for (const recipe of RECIPES) if (recipe.id === id) return recipe;
  return null;
}

/** Which needs of this order the current plate already satisfies. */
function satisfiedNeeds(order, plate) {
  const recipe = recipeById(order.recipeId);
  if (!recipe) return [];
  const used = new Array(plate.length).fill(false);
  return recipe.needs.map((need) => {
    for (let index = 0; index < plate.length; index += 1) {
      if (used[index]) continue;
      const item = plate[index];
      if (item.ingredient !== need.ingredient) continue;
      if (need.prep === PREP_READY || (need.prep === 'chop' && item.prep === 'chopped') || (need.prep === 'cook' && item.prep === 'cooked')) {
        used[index] = true;
        return true;
      }
    }
    return false;
  });
}

export function createHud() {
  const scoreEl = document.getElementById('score');
  const comboEl = document.getElementById('comboVal');
  const servedEl = document.getElementById('served');
  const timerEl = document.getElementById('shiftTimer');
  const orderListEl = document.getElementById('orderList');
  const promptEl = document.getElementById('prompt');
  const carryEl = document.getElementById('carryVal');
  const plateEl = document.getElementById('plateVal');
  const plateMatchEl = document.getElementById('plateMatch');
  const flashEl = document.getElementById('flash');
  const workbarEl = document.getElementById('workbar');
  const workLabelEl = document.getElementById('workLabel');
  const workFillEl = document.getElementById('workFill');
  const overlayEl = document.getElementById('overlay');

  let lastScore = -1;
  let lastCombo = -1;
  let lastServed = -1;
  let lastTimer = '';
  let lastCarry = '';
  let lastPlate = '';
  let lastMatch = '';
  let lastPrompt = '';
  let lastFlash = '';
  let lastOrdersKey = '';
  let lastWorkKey = '';

  function drawOrders(state) {
    const key = state.orders.map((order) => `${order.uid}:${Math.ceil(order.timeLeft)}`).join('|') + '#' + state.plate.map((item) => item.ingredient + item.prep).join(',');
    if (key === lastOrdersKey) return;
    lastOrdersKey = key;
    if (state.orders.length === 0) {
      orderListEl.innerHTML = '<div style="font-size:15px;color:#ffd9a0">No orders yet — first ticket lands in a moment…</div>';
      return;
    }
    let html = '';
    for (const order of state.orders) {
      const recipe = recipeById(order.recipeId);
      const done = satisfiedNeeds(order, state.plate);
      const seconds = Math.ceil(order.timeLeft);
      const low = seconds <= 12;
      const fraction = Math.max(0, order.timeLeft / 55);
      html += `<div class="order"><div class="oname"><span>${recipe.name}</span><span class="otime${low ? ' low' : ''}">${seconds}s</span></div>`
        + `<div class="bar"><i class="${low ? 'low' : ''}" style="width:${Math.round(fraction * 100)}%"></i></div><div class="chips">`;
      recipe.needs.forEach((need, index) => {
        const ingredient = INGREDIENTS[need.ingredient];
        const label = need.prep === PREP_READY ? ingredient.name : `${ingredient.name} · ${need.prep === 'chop' ? 'chopped' : 'cooked'}`;
        html += `<span class="chip ${done[index] ? 'done' : 'need'}">${done[index] ? '✓ ' : ''}${label}</span>`;
      });
      html += '</div></div>';
    }
    orderListEl.innerHTML = html;
  }

  /** Paint the HUD from the world state and the current screen. */
  function draw(state, screen, prompt, best) {
    if (state.score !== lastScore) {
      lastScore = state.score;
      scoreEl.textContent = String(state.score);
    }
    const multiplier = Math.min(COMBO_MAX, 1 + COMBO_STEP * state.combo);
    const comboText = `x${multiplier.toFixed(1)}`;
    if (comboText !== lastCombo) {
      lastCombo = comboText;
      comboEl.textContent = comboText;
    }
    if (state.served !== lastServed) {
      lastServed = state.served;
      servedEl.textContent = String(state.served);
    }
    const timerText = formatTimer(state.shiftLeft);
    if (timerText !== lastTimer) {
      lastTimer = timerText;
      timerEl.textContent = timerText;
      timerEl.classList.toggle('low', state.shiftLeft <= 30);
    }
    drawOrders(state);

    const carryText = state.carrying === null ? '— empty hands —' : itemLabel(state.carrying);
    if (carryText !== lastCarry) {
      lastCarry = carryText;
      carryEl.textContent = carryText;
    }
    const plateText = state.plate.length === 0 ? 'Plate is empty' : state.plate.map(itemLabel).join('  +  ');
    if (plateText !== lastPlate) {
      lastPlate = plateText;
      plateEl.textContent = plateText;
    }
    let matchText = '';
    if (state.plateMatch !== null) {
      const recipe = recipeById(state.plateMatch.recipeId);
      matchText = `✓ READY: ${recipe.name} — serve it at the pass!`;
    } else if (state.plate.length > 0) {
      matchText = 'Keep building — no order matches yet';
    }
    if (matchText !== lastMatch) {
      lastMatch = matchText;
      plateMatchEl.textContent = matchText;
    }
    if (prompt !== lastPrompt) {
      lastPrompt = prompt;
      if (prompt === '') promptEl.style.display = 'none';
      else {
        promptEl.style.display = 'block';
        promptEl.innerHTML = prompt;
      }
    }
    const flashText = state.flash === null ? '' : state.flash;
    if (flashText !== lastFlash) {
      lastFlash = flashText;
      flashEl.textContent = flashText;
      flashEl.style.opacity = flashText === '' ? '0' : '1';
    }
    const workKey = state.work === null ? '' : `${state.work.kind}:${Math.round((state.work.t / state.work.total) * 100)}`;
    if (workKey !== lastWorkKey) {
      lastWorkKey = workKey;
      if (state.work === null) {
        workbarEl.style.display = 'none';
      } else {
        workbarEl.style.display = 'block';
        workLabelEl.textContent = state.work.kind === 'board' ? '🔪 Chopping…' : '🔥 Cooking — sizzle!';
        workFillEl.style.width = `${Math.round((state.work.t / state.work.total) * 100)}%`;
      }
    }

    if (screen === 'title') {
      overlayEl.innerHTML = '<div class="card"><h1>SIZZLE RUSH</h1><h2>3D KITCHEN RUSH</h2>'
        + '<p>The dinner rush is on! Grab ingredients, chop and cook them,<br>build each dish on the plate and serve it before the ticket expires.</p>'
        + `<p class="keys"><b>WASD / Arrows</b> move &nbsp;·&nbsp; <b>E</b> grab · chop · cook · plate · serve<br><b>P</b> pause &nbsp;·&nbsp; <b>R</b> restart &nbsp;·&nbsp; <b>Enter</b> start</p>`
        + '<p class="big">Press Enter or click to start your shift</p></div>';
    } else if (screen === 'paused') {
      overlayEl.innerHTML = '<div class="card"><h1>PAUSED</h1><p>The kitchen waits for you.</p><p class="big">Press P to keep cooking</p></div>';
    } else if (screen === 'over') {
      overlayEl.innerHTML = '<div class="card"><h1>SHIFT OVER!</h1>'
        + `<p class="big">Score ${state.score}</p>`
        + `<p>Dishes served: <b>${state.served}</b> &nbsp;·&nbsp; Best combo: <b>x${(1 + COMBO_STEP * state.bestCombo).toFixed(1)}</b><br>Best this visit: <b>${best}</b></p>`
        + '<p class="big">Press Enter to cook again</p></div>';
    } else {
      overlayEl.innerHTML = '';
    }
  }

  return { draw };
}

/** The contextual E prompt for the station the chef is standing at. */
export function promptForStation(station, state) {
  if (station === null) return '';
  if (state.work !== null) return '';
  if (station.kind === 'bin') {
    if (state.carrying !== null) return 'Hands full — plate it or trash it';
    return `<b>[E]</b> Grab ${INGREDIENTS[station.ingredient].name}`;
  }
  if (station.kind === 'board') {
    if (state.carrying === null) return '<b>[E]</b> Chopping Board — bring something to chop';
    const needed = prepNeeded(state.carrying);
    if (needed === 'chop') return `<b>[E]</b> Chop the ${INGREDIENTS[state.carrying.ingredient].name}`;
    return 'This needs the stove, not the board';
  }
  if (station.kind === 'stove') {
    if (state.carrying === null) return '<b>[E]</b> Stove — bring something to cook';
    const needed = prepNeeded(state.carrying);
    if (needed === 'cook') return `<b>[E]</b> Cook the ${INGREDIENTS[state.carrying.ingredient].name}`;
    return 'This needs the chopping board, not the stove';
  }
  if (station.kind === 'plate') {
    if (state.carrying !== null) return `<b>[E]</b> Add ${itemLabel(state.carrying)} to the plate`;
    if (state.plate.length > 0) return '<b>[E]</b> Take the last item back off the plate';
    return 'Assembly Plate — bring ingredients';
  }
  if (station.kind === 'pass') {
    if (state.plateMatch !== null) return `<b>[E]</b> SERVE ${recipeById(state.plateMatch.recipeId).name}!`;
    if (state.plate.length > 0) return 'No order matches this plate yet';
    return 'Serve Pass — build a dish on the plate first';
  }
  if (station.kind === 'trash') {
    if (state.carrying !== null || state.plate.length > 0) return '<b>[E]</b> Throw it away';
    return 'Trash Bin';
  }
  return '';
}
