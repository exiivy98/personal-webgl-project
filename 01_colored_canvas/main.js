const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  console.error("WebGL 2 is not supported by your browser.");
}

canvas.width = 500;
canvas.height = 500;

gl.viewport(0, 0, canvas.width, canvas.height);

gl.enable(gl.SCISSOR_TEST);

render();

function render() {
  const halfWidth = canvas.width / 2;
  const halfHeight = canvas.height / 2;

  gl.scissor(0, 0, halfWidth, halfHeight);
  gl.clearColor(0.0, 0.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.scissor(halfWidth, 0, halfWidth, halfHeight);
  gl.clearColor(1.0, 1.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.scissor(0, halfHeight, halfWidth, halfHeight);
  gl.clearColor(0.0, 1.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.scissor(halfWidth, halfHeight, halfWidth, halfHeight);
  gl.clearColor(1.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

window.addEventListener("resize", () => {
  const size = Math.min(window.innerWidth, window.innerHeight);

  canvas.width = size;
  canvas.height = size;

  gl.viewport(0, 0, canvas.width, canvas.height);
  render();
});
