// Builds the 3D kitchen: floor, walls, counters, ingredient bins, chopping
// board, stove, assembly island, serve pass and the chef. All geometry is
// made from primitives here — no model files. update() moves the chef and
// refreshes the carried item, the plate contents, the stove glow and steam
// from the world state each frame.
import * as THREE from 'three';
import { FLOOR, PALETTE, STATIONS } from './config.js';
import { INGREDIENTS } from './recipes.js';

function checkerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const size = 32;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      context.fillStyle = (row + col) % 2 === 0 ? PALETTE.floorLight : PALETTE.floorDark;
      context.fillRect(col * size, row * size, size, size);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function menuTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#2b1608';
  context.fillRect(0, 0, 1024, 256);
  context.strokeStyle = '#ffb63d';
  context.lineWidth = 8;
  context.strokeRect(10, 10, 1004, 236);
  context.fillStyle = '#ffb63d';
  context.font = 'bold 64px system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText("TODAY'S MENU", 512, 84);
  context.fillStyle = '#fff7ea';
  context.font = 'bold 40px system-ui, sans-serif';
  context.fillText('Ember Burger  •  Sunset Ramen  •  Golden Satay', 512, 156);
  context.font = 'bold 36px system-ui, sans-serif';
  context.fillStyle = '#ffd9a0';
  context.fillText('Sizzle Stack  •  Ember Noodle Bowl  •  Garden Melt', 512, 212);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function labelSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 72;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(24, 14, 8, 0.88)';
  context.beginPath();
  context.roundRect(4, 4, 248, 64, 14);
  context.fill();
  context.fillStyle = color || '#ffd166';
  context.font = 'bold 34px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 128, 38);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.7, 0.48, 1);
  return sprite;
}

function box(width, height, depth, color, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(radiusTop, radiusBottom, height, color, x, y, z, segments) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments || 24),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** One small mesh for an ingredient, tinted and shaped by its kind. */
export function makeIngredientMesh(ingredientId, prep) {
  const ingredient = INGREDIENTS[ingredientId];
  const color = ingredient ? ingredient.color : '#ffffff';
  const group = new THREE.Group();
  let mesh;
  if (ingredientId === 'bun') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
    mesh.position.y = 0.02;
  } else if (ingredientId === 'patty' || ingredientId === 'cheese') {
    mesh = cylinder(0.26, 0.26, ingredientId === 'cheese' ? 0.05 : 0.12, color, 0, 0.06, 0, 20);
  } else if (ingredientId === 'lettuce') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
    mesh.scale.set(1, 0.35, 1);
    mesh.position.y = 0.08;
  } else if (ingredientId === 'noodle') {
    mesh = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.09, 10, 20), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 0.1;
  } else if (ingredientId === 'broth') {
    mesh = cylinder(0.24, 0.16, 0.16, color, 0, 0.08, 0, 20);
  } else if (ingredientId === 'satay') {
    mesh = box(0.5, 0.07, 0.12, color, 0, 0.06, 0);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: '#e8a34c', roughness: 0.5 }));
    tip.position.set(0.28, 0.06, 0);
    tip.castShadow = true;
    group.add(tip);
  } else {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
    mesh.position.y = 0.24;
  }
  mesh.castShadow = true;
  group.add(mesh);
  if (prep === 'chopped') {
    const bits = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.3), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }));
    bits.position.y = 0.16;
    group.add(bits);
  }
  if (prep === 'cooked') {
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 8), new THREE.MeshStandardMaterial({ color: '#ff8c1a', emissive: '#ff6a00', emissiveIntensity: 0.35, transparent: true, opacity: 0.35 }));
    glow.position.y = 0.12;
    group.add(glow);
  }
  return group;
}

export function createKitchen(scene) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(FLOOR.width, FLOOR.depth),
    new THREE.MeshStandardMaterial({ map: checkerTexture(), roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Walls: a tall back wall with the menu board, and low side walls.
  const backWall = box(FLOOR.width + 1, 4.4, 0.4, PALETTE.wall, 0, 2.2, -FLOOR.depth / 2 - 0.2);
  scene.add(backWall);
  const menu = new THREE.Mesh(
    new THREE.PlaneGeometry(9.5, 2.4),
    new THREE.MeshStandardMaterial({ map: menuTexture(), roughness: 0.8 }),
  );
  menu.position.set(0, 2.1, -FLOOR.depth / 2 + 0.02);
  scene.add(menu);
  scene.add(box(0.4, 2.2, FLOOR.depth + 1, PALETTE.wallTop, -FLOOR.width / 2 - 0.2, 1.1, 0));
  scene.add(box(0.4, 2.2, FLOOR.depth + 1, PALETTE.wallTop, FLOOR.width / 2 + 0.2, 1.1, 0));
  scene.add(box(FLOOR.width + 1, 1.4, 0.4, PALETTE.wallTop, 0, 0.7, FLOOR.depth / 2 + 0.2));

  // North ingredient counter with one bin per ingredient.
  scene.add(box(15.2, 0.95, 1.1, PALETTE.counterSide, -0.9, 0.475, -4.35));
  scene.add(box(15.2, 0.08, 1.25, PALETTE.counterTop, -0.9, 0.99, -4.35));
  for (const station of STATIONS) {
    if (station.kind !== 'bin') continue;
    const pile = makeIngredientMesh(station.ingredient, 'raw');
    pile.position.set(station.x, 1.03, station.z);
    scene.add(pile);
    const second = makeIngredientMesh(station.ingredient, 'raw');
    second.position.set(station.x + 0.35, 1.03, station.z + 0.15);
    second.scale.setScalar(0.85);
    scene.add(second);
    const label = labelSprite(INGREDIENTS[station.ingredient].name.toUpperCase(), '#ffd166');
    label.position.set(station.x, 2.05, station.z + 0.4);
    scene.add(label);
  }

  // West chopping counter with a wooden board and a knife block.
  scene.add(box(1.1, 0.95, 4.2, PALETTE.counterSide, -7.9, 0.475, 0.2));
  scene.add(box(1.25, 0.08, 4.35, PALETTE.counterTop, -7.9, 0.99, 0.2));
  scene.add(box(0.9, 0.06, 1.6, PALETTE.boardWood, -7.9, 1.06, 0.2));
  scene.add(box(0.25, 0.5, 0.7, PALETTE.steelDark, -7.9, 1.3, 1.6));
  const chopLabel = labelSprite('CHOP', '#7CFC9A');
  chopLabel.position.set(-7.2, 2.0, 0.2);
  scene.add(chopLabel);

  // East stove counter with two glowing burners and a pot.
  scene.add(box(1.1, 0.95, 4.2, PALETTE.counterSide, 7.9, 0.475, 0.2));
  scene.add(box(1.25, 0.08, 4.35, PALETTE.steelDark, 7.9, 0.99, 0.2));
  const burnerMaterial = new THREE.MeshStandardMaterial({ color: '#222222', emissive: PALETTE.stoveGlow, emissiveIntensity: 0.9, roughness: 0.4 });
  const burner1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 24), burnerMaterial);
  burner1.position.set(7.9, 1.05, -0.6);
  scene.add(burner1);
  const burner2 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 24), burnerMaterial.clone());
  burner2.position.set(7.9, 1.05, 1.0);
  scene.add(burner2);
  scene.add(cylinder(0.4, 0.32, 0.35, '#3a3f45', 7.9, 1.25, -0.6, 24));
  const stoveLabel = labelSprite('STOVE', '#ff9a5c');
  stoveLabel.position.set(7.2, 2.0, 0.2);
  scene.add(stoveLabel);

  // Centre assembly island with a white plate.
  scene.add(box(3.2, 0.95, 1.7, PALETTE.counterSide, 0, 0.475, 0.6));
  scene.add(box(3.35, 0.08, 1.85, PALETTE.counterTop, 0, 0.99, 0.6));
  scene.add(cylinder(0.55, 0.45, 0.06, '#ffffff', 0, 1.06, 0.6, 28));
  const plateLabel = labelSprite('PLATE', '#ffffff');
  plateLabel.position.set(0, 1.9, 0.6);
  scene.add(plateLabel);

  // South serve pass: a shelf with a heat lamp and a bell.
  scene.add(box(5.0, 0.95, 1.0, PALETTE.counterSide, 0, 0.475, 4.75));
  scene.add(box(5.15, 0.08, 1.15, PALETTE.passShelf, 0, 0.99, 4.75));
  scene.add(cylinder(0.16, 0.16, 0.1, '#ffd43b', 0, 1.08, 4.75, 16));
  const passLabel = labelSprite('SERVE!', '#ffd43b');
  passLabel.position.set(0, 1.9, 4.4);
  scene.add(passLabel);

  // Trash bin near the pass.
  scene.add(cylinder(0.42, 0.36, 0.9, '#4a5568', 7.2, 0.45, 4.4, 20));
  const trashLabel = labelSprite('TRASH', '#adb5bd');
  trashLabel.position.set(7.2, 1.5, 4.4);
  scene.add(trashLabel);

  // Potted herbs and a hanging pan rack for warmth.
  for (const [x, z] of [[-7.9, -4.9], [7.9, -4.9], [-7.9, 4.9]]) {
    scene.add(cylinder(0.3, 0.22, 0.4, '#b5533c', x, 0.2, z, 16));
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), new THREE.MeshStandardMaterial({ color: '#3d9e4d', roughness: 0.9 }));
    leaves.position.set(x, 0.62, z);
    leaves.scale.y = 0.7;
    leaves.castShadow = true;
    scene.add(leaves);
  }

  // The chef: white toque, head, body and apron, with a hand anchor above the head for carried food.
  const chefGroup = new THREE.Group();
  const body = cylinder(0.34, 0.42, 0.85, '#f8f9fa', 0, 0.75, 0, 20);
  chefGroup.add(body);
  const apron = box(0.5, 0.6, 0.06, '#2f6fb2', 0, 0.7, 0.4);
  chefGroup.add(apron);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), new THREE.MeshStandardMaterial({ color: '#f2c89b', roughness: 0.7 }));
  head.position.y = 1.45;
  head.castShadow = true;
  chefGroup.add(head);
  const hatBase = cylinder(0.3, 0.32, 0.18, '#ffffff', 0, 1.68, 0, 20);
  chefGroup.add(hatBase);
  const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }));
  hatTop.position.y = 1.88;
  hatTop.scale.y = 0.75;
  hatTop.castShadow = true;
  chefGroup.add(hatTop);
  const armLeft = box(0.14, 0.55, 0.14, '#f8f9fa', -0.48, 0.85, 0.1);
  const armRight = box(0.14, 0.55, 0.14, '#f8f9fa', 0.48, 0.85, 0.1);
  chefGroup.add(armLeft);
  chefGroup.add(armRight);
  const handAnchor = new THREE.Group();
  handAnchor.position.set(0, 1.15, 0.45);
  chefGroup.add(handAnchor);
  scene.add(chefGroup);

  // Steam puffs above the stove pot, animated by update().
  const steam = [];
  const steamMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.45, roughness: 1 });
  for (let index = 0; index < 6; index += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), steamMaterial.clone());
    puff.position.set(7.9, 1.5, -0.6);
    scene.add(puff);
    steam.push(puff);
  }

  // Plate items and the carried item are rebuilt from state each frame.
  const plateAnchor = new THREE.Group();
  plateAnchor.position.set(0, 1.12, 0.6);
  scene.add(plateAnchor);

  let carriedMesh = null;
  let plateMeshes = [];
  let bobTime = 0;

  function rebuildPlate(plate) {
    for (const mesh of plateMeshes) plateAnchor.remove(mesh);
    plateMeshes = [];
    plate.forEach((item, index) => {
      const mesh = makeIngredientMesh(item.ingredient, item.prep);
      const angle = (index / Math.max(1, plate.length)) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 0.24, 0, Math.sin(angle) * 0.24);
      mesh.scale.setScalar(0.9);
      plateAnchor.add(mesh);
      plateMeshes.push(mesh);
    });
  }

  function rebuildCarried(carrying) {
    if (carriedMesh !== null) {
      handAnchor.remove(carriedMesh);
      carriedMesh = null;
    }
    if (carrying !== null) {
      carriedMesh = makeIngredientMesh(carrying.ingredient, carrying.prep);
      carriedMesh.scale.setScalar(1.15);
      handAnchor.add(carriedMesh);
    }
  }

  let lastPlateKey = '';
  let lastCarriedKey = '';

  function update(state, time) {
    const chef = state.chef;
    bobTime += 0.016;
    chefGroup.position.set(chef.x, chef.moving ? Math.abs(Math.sin(bobTime * 12)) * 0.06 : 0, chef.z);
    chefGroup.rotation.y = chef.angle;
    const plateKey = state.plate.map((item) => `${item.ingredient}:${item.prep}`).join(',');
    if (plateKey !== lastPlateKey) {
      lastPlateKey = plateKey;
      rebuildPlate(state.plate);
    }
    const carriedKey = state.carrying === null ? '' : `${state.carrying.ingredient}:${state.carrying.prep}`;
    if (carriedKey !== lastCarriedKey) {
      lastCarriedKey = carriedKey;
      rebuildCarried(state.carrying);
    }
    const cooking = state.work !== null && state.work.kind === 'stove';
    burnerMaterial.emissiveIntensity = cooking ? 1.6 : 0.9;
    burner2.material.emissiveIntensity = cooking ? 1.6 : 0.9;
    steam.forEach((puff, index) => {
      const cycle = (time * 0.7 + index / 6) % 1;
      puff.position.set(7.9 + Math.sin((time + index) * 2) * 0.08, 1.45 + cycle * 0.9, -0.6);
      puff.scale.setScalar(0.5 + cycle * 1.1);
      puff.material.opacity = cooking ? 0.5 * (1 - cycle) : 0.18 * (1 - cycle);
    });
  }

  return { update, chefGroup };
}
