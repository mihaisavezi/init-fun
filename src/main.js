import "./style.css";
const container = document.getElementById("image-container");
const square1 = document.getElementById("square1");
const square2 = document.getElementById("square2");

const toggleSquare1Effect = document.getElementById("toggleSquare1");
const toggleSquare2Effect = document.getElementById("toggleSquare2");

// Store initial positions and dimensions
const s1Initial = {
  left: square1.offsetLeft,
  top: square1.offsetTop,
  width: square1.offsetWidth,
  height: square1.offsetHeight,
};
const s2Initial = {
  left: square2.offsetLeft,
  top: square2.offsetTop,
  width: square2.offsetWidth,
  height: square2.offsetHeight,
};

// --- Configurable parameters ---
const S1_ACTIVATION_RADIUS = 180;
const S1_MAX_PUSH_DISTANCE = 540;
const S2_MIN_SCALE = 0.7;
const S2_MAX_SCALE = 2.5;
const S2_DISTANCE_FOR_BASE_SCALE = 100;
const S2_SENSITIVITY_FACTOR = 0.005;

// --- Custom Cursor Trail Element ---
const cursorTrail = document.createElement("div");
cursorTrail.classList.add("cursor-trail");

// --- State for effects ---
let isSquare1EffectActive = toggleSquare1Effect.checked;
let isSquare2EffectActive = toggleSquare2Effect.checked;

// Array to store added circles
let addedCircles = [];

// --- Behavior Functions ---
function updateSquare1Behavior(mouseX, mouseY) {
  const s1CenterX = s1Initial.left + s1Initial.width / 2;
  const s1CenterY = s1Initial.top + s1Initial.height / 2;

  const dx1 = mouseX - s1CenterX;
  const dy1 = mouseY - s1CenterY;
  const distanceToS1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

  let translateX = 0;
  let translateY = 0;

  if (distanceToS1 < S1_ACTIVATION_RADIUS) {
    const pushIntensity =
      (S1_ACTIVATION_RADIUS - distanceToS1) / S1_ACTIVATION_RADIUS;
    const normDx1 = dx1 / distanceToS1;
    const normDy1 = dy1 / distanceToS1;
    translateX = -normDx1 * pushIntensity * S1_MAX_PUSH_DISTANCE;
    translateY = -normDy1 * pushIntensity * S1_MAX_PUSH_DISTANCE;
  }
  square1.style.transform = `translate(${translateX}px, ${translateY}px)`;
}

function updateSquare2Behavior(mouseX, mouseY) {
  const s2CenterX = s2Initial.left + s2Initial.width / 2;
  const s2CenterY = s2Initial.top + s2Initial.height / 2;

  const dx2 = mouseX - s2CenterX;
  const dy2 = mouseY - s2CenterY;
  const distanceToS2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

  let scale =
    1 + (distanceToS2 - S2_DISTANCE_FOR_BASE_SCALE) * S2_SENSITIVITY_FACTOR;
  scale = Math.max(S2_MIN_SCALE, Math.min(S2_MAX_SCALE, scale));
  square2.style.transform = `scale(${scale})`;
}

// --- Reset Functions ---
function resetSquare1() {
  square1.style.transform = "translate(0, 0)";

  // Remove added circles
  addedCircles.forEach(circle => {
    container.removeChild(circle);
  });
  addedCircles = [];
}

function resetSquare2() {
  square2.style.transform = "scale(1)";
}

// --- Initialize ---
// Add the cursor trail to the container
container.appendChild(cursorTrail);

// --- Event Listeners ---
container.addEventListener("mousemove", function (event) {
  const rect = container.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  if (isSquare1EffectActive) {
    updateSquare1Behavior(mouseX, mouseY);
  }
  if (isSquare2EffectActive) {
    updateSquare2Behavior(mouseX, mouseY);
  }

  // Update custom cursor trail position
  cursorTrail.style.left = `${mouseX}px`;
  cursorTrail.style.top = `${mouseY}px`;
});

container.addEventListener("mouseleave", function () {
  if (isSquare1EffectActive) {
    resetSquare1();
  }
  if (isSquare2EffectActive) {
    resetSquare2();
  }
  // Hide cursor trail when mouse leaves the container
  cursorTrail.style.opacity = 0;
});

container.addEventListener("mouseenter", function() {
    // Show cursor trail when mouse enters the container
    cursorTrail.style.opacity = 1;
});

// Listen for clicks to add circles
container.addEventListener("click", function (event) {
  const rect = container.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  // Create and add a new circle element
  const clickedCircle = document.createElement("div");
  clickedCircle.classList.add("clicked-circle");
  clickedCircle.style.left = `${clickX}px`;
  clickedCircle.style.top = `${clickY}px`;
  container.appendChild(clickedCircle);
  
  // Add the circle to the tracking array
  addedCircles.push(clickedCircle);
});

// Listen to checkbox changes
toggleSquare1Effect.addEventListener("change", function () {
  isSquare1EffectActive = this.checked;
  if (!isSquare1EffectActive) {
    resetSquare1(); // Reset immediately if disabled
  }
});

toggleSquare2Effect.addEventListener("change", function () {
  isSquare2EffectActive = this.checked;
  if (!isSquare2EffectActive) {
    resetSquare2(); // Reset immediately if disabled
  }
});

// Listen to checkbox changes
toggleSquare1Effect.addEventListener("change", function () {
  isSquare1EffectActive = this.checked;
  if (!isSquare1EffectActive) {
    resetSquare1(); // Reset immediately if disabled
  }
});

toggleSquare2Effect.addEventListener("change", function () {
  isSquare2EffectActive = this.checked;
  if (!isSquare2EffectActive) {
    resetSquare2(); // Reset immediately if disabled
  }
});
