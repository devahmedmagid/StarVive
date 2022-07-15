const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector('#scoreEl');
const startGameBtn = document.querySelector('#startGameBtn');
const modalEl = document.querySelector('#modalEl');
const bigScoreEl = document.querySelector('#bigScoreEl');
class StarPlayer {
  constructor(x, y, spikes, outerRadius, innerRadius, color) {
    this.x = x;
    this.y = y;
    this.spikes = spikes;
    this.outerRadius = outerRadius;
    this.innerRadius = innerRadius;
    this.color = color;
  }

  draw() {
    let rot = (Math.PI / 2) * 3;
    let step = Math.PI / this.spikes;
    let x;
    let y;
    c.beginPath();
    c.moveTo(this.x, this.y - this.outerRadius);
    for (let i = 0; i < this.spikes; i++) {
      x = this.x + Math.cos(rot) * this.outerRadius;
      y = this.y + Math.sin(rot) * this.outerRadius;
      c.lineTo(x, y);
      rot += step;

      x = this.x + Math.cos(rot) * this.innerRadius;
      y = this.y + Math.sin(rot) * this.innerRadius;
      c.lineTo(x, y);
      rot += step;
    }
    c.lineTo(this.x, this.y - this.outerRadius);
    c.closePath();
    c.fillStyle = this.color;
    c.fill();
  }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

const player = new StarPlayer(x, y, 5, 15, 7, 'white');

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }
  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }
  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

const friction = 0.97;

class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }
  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

let projectiles = [];
let enemies = [];
let particles = [];

function init() {
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  scoreEl.innerHTML = score;
  bigScoreEl.innerHTML = score;
}

function spawnEnemies() {
  setInterval(() => {
    const radius = Math.random() * (30 - 4) + 4;
    let x;
    let y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() < canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    let velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
    if (innerWidth < 800) {
      velocity.x = velocity.x / 2;
      velocity.y = velocity.y / 2;
    }
    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1500);
}

let animationId;
let score = 0;

function animate() {
  animationId = requestAnimationFrame(animate);
  c.fillStyle = 'rgba(0,0,0,0.1)';
  c.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();
  particles.forEach((particle, particleIndex) => {
    if (particle.alpha <= 0) {
      particles.splice(particleIndex, 1);
    } else {
      particle.update();
    }
  });
  projectiles.forEach((projectile, projectileIndex) => {
    projectile.update();
    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        projectiles.splice(projectileIndex, 1);
      }, 0);
    }
  });
  enemies.forEach((enemy, enemyIndex) => {
    enemy.update();
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    // when enemy touch our star
    if (dist - enemy.radius - player.outerRadius < 0.01) {
      cancelAnimationFrame(animationId);
      modalEl.style.display = 'flex';
      bigScoreEl.innerHTML = score;
    }
    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      // when projectiles touch enemy
      if (dist - enemy.radius - projectile.radius < 1) {
        // create explosions
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6),
              }
            )
          );
        }
        if (enemy.radius - 10 > 5) {
          //i increase score
          score += 100;
          scoreEl.innerHTML = score;
          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          setTimeout(() => {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          // move from scene score bonus
          score += 250;
          scoreEl.innerHTML = score;
          setTimeout(() => {
            enemies.splice(enemyIndex, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
}

addEventListener('click', (e) => {
  const angle = Math.atan2(
    e.clientY - canvas.height / 2,
    e.clientX - canvas.width / 2
  );
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5,
  };

  projectiles.push(
    new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity)
  );
});

startGameBtn.addEventListener('click', () => {
  init();
  animate();
  spawnEnemies();
  modalEl.style.display = 'none';
});
