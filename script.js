const canvas = document.getElementById("weatherCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const droplets = [];
const rays = [];
let animationId = null;
let currentEffect = null;

const apiKey = "dedb8fdca253420e8e79fd7607db07ef"; // Replace with your actual API key

class Droplet {
  constructor(x, y, speed, size, opacity) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
    this.opacity = opacity;
    this.splashTimer = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(174, 214, 241, ${this.opacity})`;
    ctx.fill();
    ctx.closePath();

    if (this.splashTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 10 * (1 - this.splashTimer / 30), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(174, 214, 241, ${this.opacity * (1 - this.splashTimer / 30)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
      this.splashTimer--;
    }
  }

  update() {
    this.y += this.speed;

    if (this.y > canvas.height) {
      this.y = 0;
      this.x = Math.random() * canvas.width;
      this.speed = Math.random() * 1 + 2;
      this.size = Math.random() * 5 + 1;
      this.opacity = Math.random() * 0.5 + 0.3;
    }

    this.draw();
  }
}

class Ray {
  constructor(x, y, length, angle, speed) {
    this.x = x;
    this.y = y;
    this.length = length;
    this.angle = angle;
    this.speed = speed;
    this.opacity = 0;
    this.maxWidth = length * (Math.random() * 0.5 + 0.5);
    this.currentWidth = 0;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const gradient = ctx.createLinearGradient(0, 0, this.currentWidth, 0);
    gradient.addColorStop(0, `rgba(255, 223, 186, ${this.opacity})`);
    gradient.addColorStop(1, `rgba(255, 223, 186, 0)`);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.currentWidth, 0);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  update() {
    this.angle += this.speed;
    this.opacity = Math.min(1, this.opacity + 0.02);
    this.currentWidth = Math.min(this.maxWidth, this.currentWidth + 5);
    this.draw();
  }
}

let sunX = canvas.width / 2;
let sunY = canvas.height / 2;
let sunRadius = 50;
let sunCenterX = canvas.width / 2;
let sunCenterY = canvas.height / 2;
let orbitRadius = Math.min(canvas.width, canvas.height) / 3;
let orbitAngle = 0;
let orbitSpeed = 0.002;

function createDroplets() {
  droplets.length = 0;
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const speed = Math.random() * 1 + 2;
    const size = Math.random() * 5 + 1;
    const opacity = Math.random() * 0.5 + 0.3;
    droplets.push(new Droplet(x, y, speed, size, opacity));
  }
}

function createRays() {
  rays.length = 0;
  const numRays = 30;

  for (let i = 0; i < numRays; i++) {
    const angle = (Math.PI * 2) / numRays * i;
    const length = Math.random() * 250 + 150;
    const speed = (Math.random() - 0.5) * 0.015;
    rays.push(new Ray(sunX, sunY, length, angle, speed));
  }
}

function animateRain() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  droplets.forEach((droplet) => droplet.update());
  animationId = requestAnimationFrame(animateRain);
}

function animateSun() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  orbitAngle += orbitSpeed;
  sunX = sunCenterX + orbitRadius * Math.cos(orbitAngle);
  sunY = sunCenterY + orbitRadius * Math.sin(orbitAngle);

  if (sunX + sunRadius * 2 > canvas.width) sunX = canvas.width - sunRadius * 2;
  if (sunX - sunRadius * 2 < 0) sunX = sunRadius * 2;
  if (sunY + sunRadius * 2 > canvas.height) sunY = canvas.height - sunRadius * 2;
  if (sunY - sunRadius * 2 < 0) sunY = sunRadius * 2;

  const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
  sunGradient.addColorStop(0, "rgba(255, 255, 224, 0.9)");
  sunGradient.addColorStop(1, "rgba(255, 223, 186, 0.1)");

  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
  ctx.fillStyle = sunGradient;
  ctx.fill();

  rays.forEach(ray => {
    ray.x = sunX;
    ray.y = sunY;
  });

  rays.forEach((ray) => ray.update());
  animationId = requestAnimationFrame(animateSun);
}

function startRain() {
  if (currentEffect !== "rain") {
    currentEffect = "rain";
    cancelAnimationFrame(animationId);
    createDroplets();
    animateRain();
  }
}

function startSun() {
  if (currentEffect !== "sun") {
    currentEffect = "sun";
    cancelAnimationFrame(animationId);
    createRays();
    animateSun();
  }
}

// Add event listeners for the Rain and Sun buttons
const rainButton = document.getElementById("rainButton");
const sunButton = document.getElementById("sunButton");

rainButton.addEventListener("click", startRain);
sunButton.addEventListener("click", startSun);

async function fetchWeather(city) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
  );
  const data = await response.json();
  return data;
}

function updateWeatherUI(data) {
  const temperature = document.getElementById("temperature");
  const condition = document.getElementById("condition");

  temperature.textContent = `Temperature: ${data.main.temp}°C`;
  condition.textContent = `Condition: ${data.weather[0].main}`;

  if (data.weather[0].main.toLowerCase().includes("rain")) {
    startRain();
  } else if (data.weather[0].main.toLowerCase().includes("clear")) {
    startSun();
  }
}

const searchButton = document.getElementById("searchButton");
searchButton.addEventListener("click", async () => {
  const locationInput = document.getElementById("locationInput");
  const city = locationInput.value.trim();

  if (city) {
    const weatherData = await fetchWeather(city);
    updateWeatherUI(weatherData);
  }
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  sunCenterX = canvas.width / 2;
  sunCenterY = canvas.height / 2;
  orbitRadius = Math.min(canvas.width, canvas.height) / 3;

  if (currentEffect === "sun") {
    createRays();
  }
});