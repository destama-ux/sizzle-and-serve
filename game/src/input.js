// input.js — keyboard and mouse, gathered in one place. The world reads a
// plain snapshot each frame: which way to walk, whether the interact key is
// held or was just pressed, and where the mouse last clicked.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    mouseX: 0,
    mouseY: 0,
    clickX: null,       // canvas x of the last click, consumed by the world
    interactPressed: false,
    startPressed: false,
  };

  const INTERACT_KEYS = ["Space", "KeyE", "Enter"];

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat && INTERACT_KEYS.includes(event.code)) state.interactPressed = true;
    if (!event.repeat && (event.code === "KeyR" || INTERACT_KEYS.includes(event.code))) {
      state.startPressed = true;
    }
    keys.add(event.code);
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));

  function toCanvasX(event) {
    const rect = canvas.getBoundingClientRect();
    return (event.clientX - rect.left) * (canvas.width / rect.width);
  }
  canvas.addEventListener("pointermove", (event) => {
    state.mouseX = toCanvasX(event);
    const rect = canvas.getBoundingClientRect();
    state.mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
  });
  canvas.addEventListener("pointerdown", (event) => {
    state.clickX = toCanvasX(event);
    state.startPressed = true;
  });

  return {
    axis() {
      let dir = 0;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) dir -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) dir += 1;
      return dir;
    },
    interactHeld() {
      return INTERACT_KEYS.some((code) => keys.has(code));
    },
    takeInteractPress() {
      const pressed = state.interactPressed;
      state.interactPressed = false;
      return pressed;
    },
    takeStartPress() {
      const pressed = state.startPressed;
      state.startPressed = false;
      return pressed;
    },
    takeClick() {
      const x = state.clickX;
      state.clickX = null;
      return x;
    },
    mouse() {
      return { x: state.mouseX, y: state.mouseY };
    },
  };
}
