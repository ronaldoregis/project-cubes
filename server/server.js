const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static('public'));

function getRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}
// 20x20
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

function getRandomSpawnableSquareInTheMap() {
  //since the map is a square, the length of any row or column will be the same
  const mapXLength = map.length;
  // need to subtract 2 since all the borders are non-spawnables (row most left and most right are non-spawnables)
  const posSalt = mapXLength - 2;
  let isSpawnableSquare = false;
  let newX, newY;
  // re run random until the pair x, y lands on a 0 square
  while (!isSpawnableSquare) {
    // also need to add 1. In a map 20x20 a random * 20 will spaw on 0 to 20. -2, makes it 0 to 18, +1 makes it 1 to 19
    newX = Math.floor(Math.random() * posSalt + 1);
    newY = Math.floor(Math.random() * posSalt + 1);
    if (map[newX][newY] == 0) isSpawnableSquare = true;
  }
  
  return { x: newX, y: newY}
}

const players = {};

const monsterTypes = Object.freeze({
  evilSquare: "Evil Square",
});

let monsters = [
  { id: 'm1', x: 4, y:2, hp: 20, xp: 1, type: monsterTypes.evilSquare },
  { id: 'm2', x: 6, y:2, hp: 20, xp: 1, type: monsterTypes.evilSquare }
]

const MONSTER_DAMAGE = 1;
const TICK_MS = 1000;

function canMove(player, direction) {
  let newX = player.x;
  let newY = player.y;

  if (direction === 'up') newY--;
  if (direction === 'down') newY++;
  if (direction === 'left') newX--;
  if (direction === 'right') newX++;

  for (const id in players) {
    if (players[id].x === newX && players[id].y === newY) {
      return false; // Another player is there
    }
  }
  for (const monster of monsters) {
    if (monster.x === newX && monster.y === newY) {
      return false; // A monster is there
    }
  }
  if (map[newY][newX] === undefined) return false; // Out of bounds
  if (map[newY][newX] === 1) return false; // Wall
  
  if (map[newY][newX] === 0) return true
  if (map[newY][newX] === 2) return true

  return false
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  players[socket.id] = {x:1, y:1, color: getRandomColor(), lastMove: 0, lastAttack: 0, hp: 20, maxHp: 20, isDead: false, xp: 0};
  io.emit('state', { players, monsters });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id]
    io.emit('state', { players, monsters });
  });

  socket.on('move', (direction) => {
    const player = players[socket.id];
    if (!player || player.isDead) return;

    const currentTime = Date.now();
    const MOVE_COOLDOWN = 150;
    if (currentTime - player.lastMove < MOVE_COOLDOWN) return;
    player.lastMove = currentTime;

    if (canMove(player, direction)) {
      if (direction === 'up') player.y--;
      if (direction === 'down') player.y++;
      if (direction === 'left') player.x--;
      if (direction === 'right') player.x++;

      // console.log(`player ${socket.id} moved ${direction}`);
      io.emit('state', { players, monsters });
    }
  });

  socket.on('attack', ({ targetId }) => {
    const player = players[socket.id];
    if (!player || player.isDead) return;

    const currentTime = Date.now();
    const ATTACK_COOLDOWN = 500;
    if (currentTime - player.lastAttack > ATTACK_COOLDOWN) {
      player.lastAttack = currentTime;
      console.log('atacou fora do cooldown')

      const monster = monsters.find(monster => monster.id === targetId);
      console.log(`Tentou atacar o monstro ${targetId}`)
      if (monster) {
        const dx = Math.abs(monster.x - player.x);
        const dy = Math.abs(monster.y - player.y);
        if ((dx === 1 && dy === 0) || (dy === 1 && dx === 0)) {
          console.log('Target dentro do range de ataque');
          monster.hp -= 5;
          console.log(`Monster ${monster.id} hit! HP: ${monster.hp}`);
          socket.emit('message', `${monster.type} hit! HP: ${monster.hp}`);

          if (monster.hp <= 0) {
            console.log(`Monster ${monster.id} defeated`);
            socket.emit('message', `${monster.type} defeated`);
            player.xp += monster.xp;
            setTimeout(() => {
              const spawnablePos = getRandomSpawnableSquareInTheMap()
              const newMonsterId = Math.floor(Math.random()*16777215).toString(16);
              const newMonster = { id: newMonsterId, x: spawnablePos.x, y: spawnablePos.y, hp: 20, type: monsterTypes.evilSquare };
              monsters.push(newMonster);
              io.emit('state', { players, monsters });
            }, 5000);
          }
        } else {
          console.log('Target fora de alcance')
        }
      }

      monsters = monsters.filter(monster => monster.hp >0);
      io.emit('state', { players, monsters })
    }
  
  });

});

function handlePlayerDeath(playerId) {
  const p = players[playerId];
  if (!p || p.isDead) return;

  p.isDead = true;
  p.hp = 0;

  io.emit('state', { players, monsters });

  const RESPAWN_MS = 3000;
  setTimeout(() => {
    if (!players[playerId]) return;

    p.x = 1;
    p.y = 1;
    p.hp = p.maxHp;
    p.isDead = false;

    io.emit('state', { players, monsters });
  }, RESPAWN_MS);
}

setInterval(() => {
  let changed = false;

  for (const m of monsters) {
    for (const id in players) {
      const p = players[id];
      if (p.isDead) continue;

      const dx = Math.abs(m.x - p.x);
      const dy = Math.abs(m.y - p.y);
      const adjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
      if (adjacent) {
        const dmg = Math.max(1, MONSTER_DAMAGE - (p.defense || 0));
        p.hp -= dmg;
        changed = true;

        if (p.hp <= 0) {
          handlePlayerDeath(id);
        }
        // if one hit per tick per monster is enough un-comment next line
        // break;
      }
    }
  }

  if (changed) {
    io.emit('state', { players, monsters });
  }
}, TICK_MS);

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on localhost:${PORT}`));

