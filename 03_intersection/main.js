import { resizeAspectRatio, setupText, Axes } from "./util/util.js";
import { Shader, readShaderFile } from "./util/shader.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
const SHAPE = {
  CIRCLE: 0,
  LINE: 1,
  INVALID: 2,
};
const CIRCLE_PRECISION = 200;

let isInitialized = false;
let shader;
let vao;
let positionBuffer;
let isDrawing = false;
let shape = 0;
let startPoint = null;
let tempEndPoint = null;
let lines = [];
let circles = [];
let intersections = [];
let axes = new Axes(gl, 0.85);

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

function initWebGL() {
  if (!gl) {
    console.error("WebGL 2 is not supported by your browser.");
    return false;
  }

  canvas.width = 700;
  canvas.height = 700;

  resizeAspectRatio(gl, canvas);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.2, 0.3, 1.0);

  return true;
}

function setupBuffers() {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
  return [(x / canvas.width) * 2 - 1, -((y / canvas.height) * 2 - 1)];
}

function setupMouseEvents() {
  function handleMouseDown(event) {
    event.preventDefault();
    event.stopPropagation();

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (!isDrawing) {
      if (shape == SHAPE.CIRCLE || shape == SHAPE.LINE) {
        let [glX, glY] = convertToWebGLCoordinates(x, y);
        startPoint = [glX, glY];
        isDrawing = true;
      }
    }
  }

  function handleMouseMove(event) {
    if (isDrawing) {
      if (shape == SHAPE.CIRCLE || shape == SHAPE.LINE) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        let [glX, glY] = convertToWebGLCoordinates(x, y);
        tempEndPoint = [glX, glY];
        render();
      }
    }
  }

  function handleMouseUp() {
    if (isDrawing && tempEndPoint) {
      if (shape == SHAPE.CIRCLE) {
        circles.push([...startPoint, ...tempEndPoint]);
        setupText(
          canvas,
          "Circle: center (" +
            circles[0][0].toFixed(2) +
            ", " +
            circles[0][1].toFixed(2) +
            ") radius = " +
            Math.sqrt(
              Math.pow(circles[0][0] - circles[0][2], 2) +
                Math.pow(circles[0][1] - circles[0][3], 2)
            ).toFixed(2),
          1
        );
        shape = SHAPE.LINE;
      } else if (shape == SHAPE.LINE) {
        lines.push([...startPoint, ...tempEndPoint]);
        setupText(
          canvas,
          "Line segment: (" +
            lines[0][0].toFixed(2) +
            ", " +
            lines[0][1].toFixed(2) +
            ") ~ (" +
            lines[0][2].toFixed(2) +
            ", " +
            lines[0][3].toFixed(2) +
            ")",
          2
        );
        shape = SHAPE.INVALID;

        let a = lines[0][2] - lines[0][0];
        let b = lines[0][0];
        let c = lines[0][3] - lines[0][1];
        let d = lines[0][1];
        let e = circles[0][0];
        let f = circles[0][1];
        let r = Math.sqrt(
          Math.pow(circles[0][0] - circles[0][2], 2) +
            Math.pow(circles[0][1] - circles[0][3], 2)
        );
        let A = Math.pow(a, 2) + Math.pow(c, 2);
        let B = 2 * (a * b - a * e + c * d - c * f);
        let C =
          Math.pow(b, 2) +
          Math.pow(d, 2) +
          Math.pow(e, 2) +
          Math.pow(f, 2) -
          Math.pow(r, 2) -
          2 * (b * e + d * f);

        let D = Math.pow(B, 2) - 4 * A * C;

        let num_t = 0;
        let t1, t2;
        if (D < 0) {
          num_t = 0;
        } else if (D == 0) {
          t1 = -B / (2 * A);

          if (t1 >= 0 && t1 <= 1) {
            num_t++;
            intersections.push([a * t1 + b, c * t1 + d]);
          }
        } else if (D > 0) {
          t1 = -(B + Math.sqrt(D)) / (2 * A);
          t2 = -(B - Math.sqrt(D)) / (2 * A);

          if (t1 >= 0 && t1 <= 1) {
            num_t++;
            intersections.push([a * t1 + b, c * t1 + d]);
          }
          if (t2 >= 0 && t2 <= 1) {
            num_t++;
            intersections.push([a * t2 + b, c * t2 + d]);
          }
        }

        switch (num_t) {
          case 0:
            setupText(canvas, "No intersection", 3);
            break;
          case 1:
            setupText(
              canvas,
              "Intersection Points: 1 Point 1: (" +
                intersections[0][0].toFixed(2) +
                ", " +
                intersections[0][1].toFixed(2) +
                ")",
              3
            );
            break;
          case 2:
            setupText(
              canvas,
              "Intersection Points: 2 Point 1: (" +
                intersections[0][0].toFixed(2) +
                ", " +
                intersections[0][1].toFixed(2) +
                ") Point 2: (" +
                intersections[1][0].toFixed(2) +
                ", " +
                intersections[1][1].toFixed(2) +
                ")",
              3
            );
            break;
        }
      }

      isDrawing = false;
      startPoint = null;
      tempEndPoint = null;
      render();
    }
  }

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  shader.use();

  for (let line of lines) {
    shader.setVec4("u_color", [0.5, 0.5, 1.0, 1.0]);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINES, 0, 2);
  }

  for (let circle of circles) {
    shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);

    let r = Math.sqrt(
      Math.pow(circle[0] - circle[2], 2) + Math.pow(circle[1] - circle[3], 2)
    );
    let circleCentX = circle[0];
    let circleCentY = circle[1];
    let circleVert = [];
    for (let i = 0; i < CIRCLE_PRECISION; i++) {
      circleVert.push(
        circleCentX + Math.cos(((Math.PI * 2) / CIRCLE_PRECISION) * i) * r
      );
      circleVert.push(
        circleCentY + Math.sin(((Math.PI * 2) / CIRCLE_PRECISION) * i) * r
      );
    }

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(circleVert),
      gl.STATIC_DRAW
    );
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINE_LOOP, 0, CIRCLE_PRECISION);
  }

  for (let intersection of intersections) {
    shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(intersection),
      gl.STATIC_DRAW
    );
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, 1);
  }

  // 임시 선 그리기
  if (isDrawing && startPoint && tempEndPoint) {
    if (shape == SHAPE.CIRCLE) {
      shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);

      let r = Math.sqrt(
        Math.pow(startPoint[0] - tempEndPoint[0], 2) +
          Math.pow(startPoint[1] - tempEndPoint[1], 2)
      );
      let circleCentX = startPoint[0];
      let circleCentY = startPoint[1];
      let circleVert = [];
      for (let i = 0; i < CIRCLE_PRECISION; i++) {
        circleVert.push(
          circleCentX + Math.cos(((Math.PI * 2) / CIRCLE_PRECISION) * i) * r
        );
        circleVert.push(
          circleCentY + Math.sin(((Math.PI * 2) / CIRCLE_PRECISION) * i) * r
        );
      }

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(circleVert),
        gl.STATIC_DRAW
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINE_LOOP, 0, CIRCLE_PRECISION);
    } else if (shape == SHAPE.LINE) {
      shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([...startPoint, ...tempEndPoint]),
        gl.STATIC_DRAW
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 2);
    }
  }

  axes.draw(mat4.create(), mat4.create());
}

async function initShader() {
  const vertexShaderSource = await readShaderFile("shVert.glsl");
  const fragmentShaderSource = await readShaderFile("shFrag.glsl");
  shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error("WebGL 초기화 실패");
      return false;
    }

    await initShader();

    setupBuffers();
    shader.use();

    setupMouseEvents();

    render();

    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    alert("프로그램 초기화에 실패했습니다.");
    return false;
  }
}
