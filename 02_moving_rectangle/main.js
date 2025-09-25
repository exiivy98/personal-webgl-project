import { loadShaders } from "./shader.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  console.error("WebGL 2 is not supported by your browser.");
}

canvas.width = 600;
canvas.height = 600;

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);

let rectangleX = 0.0;
let rectangleY = 0.0;
const movingSpeed = 0.01;
const rectangleSize = 0.1;

const keyStates = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

const vertices = new Float32Array([
  0.0, 0.0, 0.0, -0.1, -0.1, 0.0, 0.1, -0.1, 0.0, 0.1, 0.1, 0.0, -0.1, 0.1, 0.0,
  -0.1, -0.1, 0.0,
]);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(0);

let uPositionLocation;

function resizeAspectRatio() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let size = 600;

  if (windowWidth < 600 || windowHeight < 600) {
    size = Math.min(windowWidth, windowHeight);
  }

  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    gl.viewport(0, 0, size, size);
  }
}

function setupText(canvas, initialText, line = 1) {
  if (line == 1) {
    const existingOverlay = document.getElementById("textOverlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }
  }

  const overlay = document.createElement("div");
  overlay.id = "textOverlay";
  overlay.style.position = "fixed";
  overlay.style.left = canvas.offsetLeft + 10 + "px";
  overlay.style.top = canvas.offsetTop + (20 * (line - 1) + 10) + "px";
  overlay.style.color = "white";
  overlay.style.fontFamily = "monospace";
  overlay.style.fontSize = "14px";
  overlay.style.zIndex = "100";
  overlay.textContent = `${initialText}`;

  canvas.parentElement.appendChild(overlay);
  return overlay;
}

function updatePosition() {
  let newX = rectangleX;
  let newY = rectangleY;

  if (keyStates.ArrowUp) {
    newY = Math.min(rectangleY + movingSpeed, 1.0 - rectangleSize);
  }
  if (keyStates.ArrowDown) {
    newY = Math.max(rectangleY - movingSpeed, -1.0 + rectangleSize);
  }
  if (keyStates.ArrowLeft) {
    newX = Math.max(rectangleX - movingSpeed, -1.0 + rectangleSize);
  }
  if (keyStates.ArrowRight) {
    newX = Math.min(rectangleX + movingSpeed, 1.0 - rectangleSize);
  }

  rectangleX = newX;
  rectangleY = newY;
}

window.addEventListener("keydown", (event) => {
  if (event.key in keyStates) {
    keyStates[event.key] = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key in keyStates) {
    keyStates[event.key] = false;
  }
});

function render() {
  updatePosition();

  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform2f(uPositionLocation, rectangleX, rectangleY);

  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);

  requestAnimationFrame(render);
}

async function init() {
  const shaderProgram = await loadShaders(gl);

  gl.useProgram(shaderProgram);
  uPositionLocation = gl.getUniformLocation(shaderProgram, "uPosition");

  setupText(canvas, "Use arrow keys to move the rectangle", 1);

  window.addEventListener("resize", resizeAspectRatio);
  resizeAspectRatio();

  render();
}

init();
