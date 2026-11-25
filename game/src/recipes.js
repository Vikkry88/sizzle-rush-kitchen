// The ingredients and the dishes they build. Every name is invented for this
// game. Each ingredient lists the preparation it needs before it can be
// plated: 'ready' means it goes straight on the plate, 'chop' means it must
// visit the chopping board, 'cook' means it must visit the stove.

/** Preparation a raw ingredient needs: 'ready', 'chop' or 'cook'. */
export const PREP_READY = 'ready';
export const PREP_CHOP = 'chop';
export const PREP_COOK = 'cook';

export const INGREDIENTS = {
  bun: { name: 'Bun', prep: PREP_READY, color: '#e0a458', shape: 'dome' },
  patty: { name: 'Patty', prep: PREP_COOK, color: '#7a4a26', shape: 'disc' },
  lettuce: { name: 'Lettuce', prep: PREP_CHOP, color: '#5cb531', shape: 'leaf' },
  tomato: { name: 'Tomato', prep: PREP_CHOP, color: '#e03131', shape: 'ball' },
  cheese: { name: 'Cheese', prep: PREP_READY, color: '#ffd43b', shape: 'slab' },
  noodle: { name: 'Noodles', prep: PREP_COOK, color: '#f2c14e', shape: 'coil' },
  broth: { name: 'Broth', prep: PREP_READY, color: '#d9480f', shape: 'bowl' },
  satay: { name: 'Satay', prep: PREP_COOK, color: '#b06428', shape: 'skewer' },
};

/** One entry is one required item: the ingredient id and the prep it must have when plated. */
export const RECIPES = [
  {
    id: 'ember-burger',
    name: 'Ember Burger',
    price: 100,
    needs: [
      { ingredient: 'bun', prep: PREP_READY },
      { ingredient: 'patty', prep: PREP_COOK },
      { ingredient: 'lettuce', prep: PREP_CHOP },
      { ingredient: 'cheese', prep: PREP_READY },
    ],
  },
  {
    id: 'sunset-ramen',
    name: 'Sunset Ramen',
    price: 100,
    needs: [
      { ingredient: 'noodle', prep: PREP_COOK },
      { ingredient: 'broth', prep: PREP_READY },
      { ingredient: 'tomato', prep: PREP_CHOP },
    ],
  },
  {
    id: 'golden-satay',
    name: 'Golden Satay',
    price: 100,
    needs: [
      { ingredient: 'satay', prep: PREP_COOK },
      { ingredient: 'lettuce', prep: PREP_CHOP },
      { ingredient: 'tomato', prep: PREP_CHOP },
    ],
  },
  {
    id: 'sizzle-stack',
    name: 'Sizzle Stack',
    price: 100,
    needs: [
      { ingredient: 'bun', prep: PREP_READY },
      { ingredient: 'patty', prep: PREP_COOK },
      { ingredient: 'cheese', prep: PREP_READY },
      { ingredient: 'tomato', prep: PREP_CHOP },
    ],
  },
  {
    id: 'ember-noodle-bowl',
    name: 'Ember Noodle Bowl',
    price: 100,
    needs: [
      { ingredient: 'noodle', prep: PREP_COOK },
      { ingredient: 'satay', prep: PREP_COOK },
      { ingredient: 'broth', prep: PREP_READY },
    ],
  },
  {
    id: 'garden-melt',
    name: 'Garden Melt',
    price: 100,
    needs: [
      { ingredient: 'bun', prep: PREP_READY },
      { ingredient: 'cheese', prep: PREP_READY },
      { ingredient: 'lettuce', prep: PREP_CHOP },
      { ingredient: 'tomato', prep: PREP_CHOP },
    ],
  },
];

/** The recipe with this id, or null. */
export function recipeById(id) {
  for (const recipe of RECIPES) if (recipe.id === id) return recipe;
  return null;
}

/** A short label for one carried or plated item, e.g. "Patty (cooked)". */
export function itemLabel(item) {
  const ingredient = INGREDIENTS[item.ingredient];
  if (!ingredient) return '?';
  if (item.prep === 'chopped') return `${ingredient.name} (chopped)`;
  if (item.prep === 'cooked') return `${ingredient.name} (cooked)`;
  return ingredient.name;
}

/** The prep an ingredient still needs, or 'ready' when it is done. */
export function prepNeeded(item) {
  const ingredient = INGREDIENTS[item.ingredient];
  if (!ingredient) return PREP_READY;
  if (ingredient.prep === PREP_CHOP && item.prep !== 'chopped') return PREP_CHOP;
  if (ingredient.prep === PREP_COOK && item.prep !== 'cooked') return PREP_COOK;
  return PREP_READY;
}
