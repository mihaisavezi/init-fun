import "./style.css";

// Touch event console logs (can be kept or removed)
document.addEventListener("touchstart", (event) => {
  console.log(
    "touchstart",
    event.touches[0].clientX,
    event.touches[0].clientY,
    event.timeStamp
  );
});
document.addEventListener("touchmove", (event) => {
  console.log(
    "touchmove",
    event.touches[0].clientX,
    event.touches[0].clientY,
    event.timeStamp
  );
});
document.addEventListener("touchend", (event) => {
  console.log(
    "touchend",
    event.changedTouches[0].clientX,
    event.changedTouches[0].clientY,
    event.timeStamp
  );
});
document.addEventListener("touchcancel", (event) => {
  console.log(
    "touchcancel",
    event.touches[0].clientX,
    event.touches[0].clientY,
    event.timeStamp
  );
});

const container = document.getElementById("image-container");
const square1 = document.getElementById("square1");
const square2 = document.getElementById("square2");

const toggleSquare1Effect = document.getElementById("toggleSquare1");
const toggleSquare2Effect = document.getElementById("toggleSquare2");

// --- Utility function for checking overlap ---
function checkOverlap(rect1, rect2) {
  // Check if one rectangle is to the side of the other
  if (rect1.right < rect2.left || rect1.left > rect2.right) {
    return false;
  }
  // Check if one rectangle is above or below the other
  if (rect1.bottom < rect2.top || rect1.top > rect2.bottom) {
    return false;
  }
  // If none of the above, they overlap
  return true;
}

// Store initial positions and dimensions
// Get bounding rects for initial setup relative to the viewport
const containerRectForInitialSetup = container.getBoundingClientRect();
const s1RectInitialForSetup = square1.getBoundingClientRect();
const s2RectInitialForSetup = square2.getBoundingClientRect();

// Calculate initial positions relative to the 'container' element
const s1Initial = {
  left: s1RectInitialForSetup.left - containerRectForInitialSetup.left,
  top: s1RectInitialForSetup.top - containerRectForInitialSetup.top,
  width: s1RectInitialForSetup.width, // Use width from getBoundingClientRect for precision
  height: s1RectInitialForSetup.height, // Use height from getBoundingClientRect for precision
};
const s2Initial = {
  left: s2RectInitialForSetup.left - containerRectForInitialSetup.left,
  top: s2RectInitialForSetup.top - containerRectForInitialSetup.top,
  width: s2RectInitialForSetup.width,
  height: s2RectInitialForSetup.height,
};

// --- Configurable parameters ---
const S1_ACTIVATION_RADIUS = 360;
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
  // Calculate center of square1 based on its initial position relative to the container
  const s1CenterX = s1Initial.left + s1Initial.width / 2;
  const s1CenterY = s1Initial.top + s1Initial.height / 2;

  // mouseX and mouseY are already relative to the container's top-left corner
  const dx1 = mouseX - s1CenterX;
  const dy1 = mouseY - s1CenterY;
  const distanceToS1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

  let targetTranslateX = 0;
  let targetTranslateY = 0;

  // Calculate desired translation if mouse is close enough
  if (distanceToS1 < S1_ACTIVATION_RADIUS && distanceToS1 > 1e-6) {
    // 1e-6 to avoid division by zero
    const pushIntensity =
      (S1_ACTIVATION_RADIUS - distanceToS1) / S1_ACTIVATION_RADIUS;
    const normDx1 = dx1 / distanceToS1;
    const normDy1 = dy1 / distanceToS1;
    targetTranslateX = -normDx1 * pushIntensity * S1_MAX_PUSH_DISTANCE;
    targetTranslateY = -normDy1 * pushIntensity * S1_MAX_PUSH_DISTANCE;
  }

  // --- Collision detection and resolution with square2 ---
  const rectS2 = square2.getBoundingClientRect(); // Get current viewport bounds of square2
  const currentContainerRect = container.getBoundingClientRect(); // Get current viewport bounds of the container

  // Calculate potential s1 bounding box in viewport coordinates *after* applying the translation
  const potentialS1Rect = {
    left: currentContainerRect.left + s1Initial.left + targetTranslateX,
    top: currentContainerRect.top + s1Initial.top + targetTranslateY,
    width: s1Initial.width,
    height: s1Initial.height,
  };
  potentialS1Rect.right = potentialS1Rect.left + potentialS1Rect.width;
  potentialS1Rect.bottom = potentialS1Rect.top + potentialS1Rect.height;

  if (checkOverlap(potentialS1Rect, rectS2)) {
    // Collision detected. Adjust targetTranslateX, targetTranslateY.
    const s1PotCenterX = potentialS1Rect.left + potentialS1Rect.width / 2;
    const s1PotCenterY = potentialS1Rect.top + potentialS1Rect.height / 2;
    const s2ActualCenterX = rectS2.left + rectS2.width / 2;
    const s2ActualCenterY = rectS2.top + rectS2.height / 2;

    const centerDiffX = s1PotCenterX - s2ActualCenterX;
    const centerDiffY = s1PotCenterY - s2ActualCenterY;

    const combinedHalfWidths = (potentialS1Rect.width + rectS2.width) / 2;
    const combinedHalfHeights = (potentialS1Rect.height + rectS2.height) / 2;

    const penetrationX = combinedHalfWidths - Math.abs(centerDiffX);
    const penetrationY = combinedHalfHeights - Math.abs(centerDiffY);

    // Resolve collision along the axis of least penetration by pushing s1 out of s2
    if (penetrationX > 0 && penetrationY > 0) {
      // Confirm actual penetration
      if (penetrationX < penetrationY) {
        // Resolve along X-axis
        // Move s1 in the direction that increases separation from s2's center
        targetTranslateX += Math.sign(centerDiffX) * penetrationX;
      } else {
        // Resolve along Y-axis
        targetTranslateY += Math.sign(centerDiffY) * penetrationY;
      }
    }
  }
  square1.style.transform = `translate(${targetTranslateX}px, ${targetTranslateY}px)`;
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

  // Get the current position and dimensions of square1
  const s1Rect = square1.getBoundingClientRect();

  // Remove added circles that are within the bounds of square1
  addedCircles = addedCircles.filter((circle) => {
    const circleRect = circle.getBoundingClientRect();
    const isWithinSquare1 =
      circleRect.left >= s1Rect.left &&
      circleRect.right <= s1Rect.right &&
      circleRect.top >= s1Rect.top &&
      circleRect.bottom <= s1Rect.bottom;

    if (isWithinSquare1) {
      container.removeChild(circle);
      return false; // Remove from the array
    } else {
      return true; // Keep in the array
    }
  });
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

container.addEventListener("mouseenter", function () {
  // Show cursor trail when mouse enters the container
  cursorTrail.style.opacity = 1;
});

// --- Touch Event Listeners ---
container.addEventListener("touchmove", function (event) {
  const rect = container.getBoundingClientRect();
  const touch = event.touches[0];
  const mouseX = touch.clientX - rect.left;
  const mouseY = touch.clientY - rect.top;

  if (isSquare1EffectActive) {
    // This was previously commented out
    updateSquare1Behavior(mouseX, mouseY);
  }
  if (isSquare2EffectActive) {
    updateSquare2Behavior(mouseX, mouseY);
  }

  // Update custom cursor trail position
  cursorTrail.style.left = `${mouseX}px`;
  cursorTrail.style.top = `${mouseY}px`;
});

container.addEventListener("touchstart", function (event) {
  // Show cursor trail when touch starts
  cursorTrail.style.opacity = 1;
  container.classList.add("hovered");

  // Code for adding circle on touchstart (from later in the original file)
  const rect = container.getBoundingClientRect();
  const touch = event.touches[0];
  const clickX = touch.clientX - rect.left;
  const clickY = touch.clientY - rect.top;

  const clickedCircle = document.createElement("div");
  clickedCircle.classList.add("clicked-circle");
  clickedCircle.style.left = `${clickX}px`;
  clickedCircle.style.top = `${clickY}px`;
  container.appendChild(clickedCircle);
  addedCircles.push(clickedCircle);
});

container.addEventListener("touchend", function () {
  if (isSquare1EffectActive) {
    resetSquare1();
  }
  if (isSquare2EffectActive) {
    resetSquare2();
  }
  // Hide cursor trail when touch ends
  cursorTrail.style.opacity = 0;
  container.classList.remove("hovered");
  clearTimeout(longPressTimer); // Clear long press timer
});

container.addEventListener("touchcancel", function () {
  if (isSquare1EffectActive) {
    resetSquare1();
  }
  if (isSquare2EffectActive) {
    resetSquare2();
  }
  // Hide cursor trail when touch is cancelled
  cursorTrail.style.opacity = 0;
  container.classList.remove("hovered");
  clearTimeout(longPressTimer); // Clear long press timer
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

  addedCircles.push(clickedCircle);
});

// --- Erratic Movement for Square 1 on Mobile ---
// This function is defined but not actively used by mouse/touch drag interactions.
// Its internal overlap check can be updated to use the new helper.
function moveSquare1Erraticly() {
  let targetX, targetY;
  let overlap = true;

  const currentContainerRect = container.getBoundingClientRect(); // Use consistent naming
  const s1Width = square1.offsetWidth;
  const s1Height = square1.offsetHeight;
  const s2Rect = square2.getBoundingClientRect(); // Current state of square2

  const maxY = currentContainerRect.height / 2 - s1Height;

  while (overlap) {
    const maxX = currentContainerRect.width - s1Width;
    targetX = Math.random() * maxX;
    targetY = Math.random() * maxY;

    const potentialS1LeftViewport = currentContainerRect.left + targetX;
    const potentialS1TopViewport = currentContainerRect.top + targetY;

    const s1RectRandom = {
      // Renamed to avoid potential scope conflicts
      left: potentialS1LeftViewport,
      top: potentialS1TopViewport,
      right: potentialS1LeftViewport + s1Width,
      bottom: potentialS1TopViewport + s1Height,
      width: s1Width,
      height: s1Height,
    };

    // Use the new checkOverlap helper
    overlap = checkOverlap(s1RectRandom, s2Rect);
  }

  const translateX = targetX - s1Initial.left;
  const translateY = targetY - s1Initial.top;

  square1.style.transform = `translate(${translateX}px, ${translateY}px)`;
}

// Listen to checkbox changes
toggleSquare1Effect.addEventListener("change", function () {
  isSquare1EffectActive = this.checked;
  if (!isSquare1EffectActive) {
    resetSquare1();
  }
});

toggleSquare2Effect.addEventListener("change", function () {
  isSquare2EffectActive = this.checked;
  if (!isSquare2EffectActive) {
    resetSquare2();
  }
});

// --- Long Press Event Listener ---
// (This was duplicated, ensuring only one set of long press logic is present)
let longPressTimer;
const longPressDelay = 500;

// The touchstart listener already handles adding circles.
// If long press is meant to be *distinct* from a regular touchstart's circle add,
// you might need to prevent the regular add if long press is detected.
// For now, consolidating circle adding to the primary touchstart.
// The existing longPressTimer logic in touchstart handles adding a circle on long press.
// It was defined twice; I've kept the one associated with the primary touchstart/touchend.
// The 'touchstart' listener that creates circles from user's code:
// container.addEventListener("touchstart", function (event) {
//   const rect = container.getBoundingClientRect();
//   const touch = event.touches[0];
//   const clickX = touch.clientX - rect.left;
//   const clickY = touch.clientY - rect.top;
//   ... creates circle ...
// });
// This is now integrated into the main touchstart listener.

// The long press specific logic for adding circle on timeout:
container.addEventListener("touchstart", function (event) {
  // This part is already handled by the main touchstart listener combined above.
  // To avoid double-adding, this specific long-press circle add can be conditional
  // or the main touchstart adds on touchend if not a long press.
  // For simplicity, current setup might add two circles on long press (one instant, one after delay).
  // Let's assume the primary touchstart handles the immediate circle for now.
  // The longPressTimer is set within the main touchstart, so it will trigger.
  // The circle creation part of the long press timer:
  clearTimeout(longPressTimer); // Clear any previous timer
  longPressTimer = setTimeout(() => {
    // Check if touch is still active (optional, for more robust long press)
    const rect = container.getBoundingClientRect();
    // Make sure event.touches[0] is still valid; it might not be if touchend occurred.
    // This needs to be handled carefully if only one circle is desired.
    // For now, it uses the event from the initial touchstart.
    const touch = event.touches[0];
    if (!touch) return; // Safety check

    const clickX = touch.clientX - rect.left;
    const clickY = touch.clientY - rect.top;

    const clickedCircle = document.createElement("div");
    clickedCircle.classList.add("clicked-circle");
    clickedCircle.style.left = `${clickX}px`;
    clickedCircle.style.top = `${clickY}px`;
    container.appendChild(clickedCircle);
    addedCircles.push(clickedCircle);
  }, longPressDelay);
});

// touchend and touchcancel already clear longPressTimer.
