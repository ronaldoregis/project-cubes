const canvas = document.getElementById("game");
const ctx = canvas.getContext('2d');

const sideBar = document.getElementById("monsters-side-bar");

const playerBaseImage = new Image();
// playerBaseImage.src = 'player_base.png';
playerBaseImage.src = 'Sprite-0001.png';

let playerBaseLoaded = false;
playerBaseImage.onload = () => {
  playerBaseLoaded = true;
};

const socket = io();
let players = {};
let monsters = [];

const EMPTY_TILE = 0;
const WALL_TILE = 1;
const SAFE_TILE = 2;

const tileSize = 32;
const map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

function getTile(mapValue) {
  switch (mapValue) {
    case 1:
      return 'gray';
    case 2:
      return 'lightyellow';
    default:
      return 'lightgreen';
  }
}

function drawMap() {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) { 
      ctx.fillStyle = getTile(map[y][x]);
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}

function drawMonsters() {
  for (const monster of monsters) {
    ctx.fillStyle = 'purple';
    ctx.fillRect(monster.x * tileSize, monster.y * tileSize, tileSize, tileSize);

    // Draw hp bar
    const hpRatio = monster.hp /20;
    ctx.fillStyle = hpRatio > 0.6 ? 'green' : hpRatio > 0.3 ? 'yellow' : 'red';
    ctx.fillRect(monster.x * tileSize, monster.y * tileSize -6, tileSize * hpRatio, 4);
  }
}

function drawPlayers() {;
  for (const id in players) {
    const player = players[id]
    const playerX = player.x * tileSize;
    const playerY = player.y * tileSize;

    if (playerBaseLoaded) {
      ctx.drawImage(playerBaseImage, playerX, playerY, tileSize, tileSize);
    }

    if (player.isDead) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#555';
      ctx.fillRect(playerX, playerY, tileSize, tileSize);
      ctx.globalAlpha = 1; // Reset alpha for other drawings
    } else {
      ctx.fillStyle = player.color;
      ctx.globalAlpha = 0.9; // Semi-transparent color
      ctx.fillRect(playerX+6, playerY+12, tileSize-12, tileSize-23);
      ctx.fillStyle = 'black';
      ctx.fillRect(playerX+6, playerY+21, tileSize-12, tileSize-27);
      ctx.fillRect(playerX+6, playerY, tileSize-12, tileSize-27);
      ctx.globalAlpha = 1; // Reset alpha for other drawings
    }

    // Draw hp bar
    const hpRatio = Math.max(0, (player.hp || 0)) / (player.maxHp || 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = hpRatio > 0.6 ? 'green' : hpRatio > 0.3 ? 'yellow' : 'red';
    ctx.fillRect(playerX, playerY -6, tileSize * hpRatio, 4);

    if (player.isDead) {
      ctx.fillStyle = 'black';
      ctx.fillRect(playerX, playerY + 10, tileSize, 12);
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText('DEAD', playerX + 4, playerY + 20);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.height);
  drawMap();
  drawMonsters();
  drawPlayers();
}

function hasMonsterUiChanges(newMonsters) {
  let hasChanges = false;
  if (monsters.length !== newMonsters.length) return true;
  return hasChanges;
}

function drawMonsterSideBar (oldMonsters) {
  if (hasMonsterUiChanges(oldMonsters)) console.log('Should re-draw monster bar');
}

socket.on('state', (serverState) => {
  const oldMonsters = monsters
  players = serverState.players || {};
  monsters = serverState.monsters || [];

  draw();
  drawMonsterSideBar(oldMonsters);
});

document.addEventListener('keydown', (e) => {
  let key = e.key.toLowerCase();

  if (e.key === ' ') {
    socket.emit('attack'); // player pressed space to attack
    return;
  }

  if (key === 'w') socket.emit('move', 'up');
  if (key === 's') socket.emit('move', 'down');
  if (key === 'a') socket.emit('move', 'left');
  if (key === 'd') socket.emit('move', 'right');
});
