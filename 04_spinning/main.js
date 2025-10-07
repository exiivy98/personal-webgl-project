import { resizeAspectRatio } from "./util/util.js";
import { Shader, readShaderFile } from "./util/shader.js";

let gl;
let canvas;
let shader;
let vao;
let startTime;
let isInitialized = false;

const BASE_RECTANGLE = new Float32Array([
  -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
]);

const CANVAS_SIZE = 700;
const POLE_SCALE = [0.2, 0.9];
const HUB_POSITION = [0.0, POLE_SCALE[1] * 0.5];
const LARGE_WING_SCALE = [0.65, 0.1];
const SMALL_WING_SCALE = [0.18, 0.05];
const SMALL_WING_PIVOTS = [
  -LARGE_WING_SCALE[0] * 0.5,
  LARGE_WING_SCALE[0] * 0.5,
];

const COLORS = {
  background: [0.08, 0.18, 0.27, 1.0],
  tower: [0.58, 0.37, 0.16, 1.0],
  largeWing: [0.97, 0.97, 0.98, 1.0],
  smallWing: [0.64, 0.66, 0.71, 1.0],
};

document.addEventListener("DOMContentLoaded", () => {
  if (isInitialized) {
    console.log("Already initialized");
    return;
  }

  main()
    .then((success) => {
      if (!success) {
        console.log("프로그램을 종료합니다.");
        return;
      }
      isInitialized = true;
    })
    .catch((error) => {
      console.error("프로그램 실행 중 오류 발생:", error);
    });
});

async function main() {
  canvas = document.getElementById("glCanvas");
  gl = canvas.getContext("webgl2");

  if (!gl) {
    alert("WebGL 2 is not supported on this browser.");
    throw new Error("WebGL 2 not supported");
  }

  initializeCanvas();
  await initializeShader();
  initializeGeometry();

  startTime = performance.now();
  requestAnimationFrame(render);
}

function initializeCanvas() {
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  resizeAspectRatio(gl, canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(...COLORS.background);
}

async function initializeShader() {
  const vertexSource = await readShaderFile("vert_shader.glsl");
  const fragmentSource = await readShaderFile("frag_shader.glsl");
  shader = new Shader(gl, vertexSource, fragmentSource);
}

function initializeGeometry() {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, BASE_RECTANGLE, gl.STATIC_DRAW);

  shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
}

function render(now) {
  const elapsedTime = (now - startTime) * 0.001;
  const largeWingAngle = Math.sin(elapsedTime) * Math.PI * 2.0;
  const smallWingAngle = Math.sin(elapsedTime) * Math.PI * -10.0;

  gl.clear(gl.COLOR_BUFFER_BIT);
  shader.use();
  gl.bindVertexArray(vao);

  drawRectangle({
    color: COLORS.tower,
    translation: [0.0, 0.0],
    rotation: 0,
    scale: POLE_SCALE,
  });

  drawRectangle({
    color: COLORS.largeWing,
    translation: HUB_POSITION,
    rotation: largeWingAngle,
    scale: LARGE_WING_SCALE,
  });

  drawSmallWing(largeWingAngle, smallWingAngle);

  gl.bindVertexArray(null);
  requestAnimationFrame(render);
}

function drawSmallWing(baseRotation, smallWingAngle) {
  for (const pivot of SMALL_WING_PIVOTS) {
    const matrix = mat4.create();

    mat4.translate(matrix, matrix, [HUB_POSITION[0], HUB_POSITION[1], 0]);
    mat4.rotateZ(matrix, matrix, baseRotation);
    mat4.translate(matrix, matrix, [pivot, 0, 0]);
    mat4.rotateZ(matrix, matrix, smallWingAngle);
    mat4.scale(matrix, matrix, [SMALL_WING_SCALE[0], SMALL_WING_SCALE[1], 1]);

    shader.setMat4("u_matrix", matrix);
    shader.setVec4("u_color", COLORS.smallWing);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}

function drawRectangle({
  color,
  translation,
  rotation,
  scale,
  localTranslation,
}) {
  const matrix = composeMatrix(translation, rotation, scale, localTranslation);
  shader.setMat4("u_matrix", matrix);
  shader.setVec4("u_color", color);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function composeMatrix(translation, rotation, scale, localTranslation) {
  const matrix = mat4.create();

  mat4.translate(matrix, matrix, [translation[0], translation[1], 0]);
  mat4.rotateZ(matrix, matrix, rotation);

  if (localTranslation) {
    mat4.translate(matrix, matrix, [
      localTranslation[0],
      localTranslation[1],
      0,
    ]);
  }

  mat4.scale(matrix, matrix, [scale[0], scale[1], 1]);
  return matrix;
}
