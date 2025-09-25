export async function readShaderFile(path) {
    try {
      const response = await fetch(path);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.text();
      return `${content}`;
    } catch (error) {
      console.error("Error fetching shader file:", error);
      throw error;
    }
  }
  
  export function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  export function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(
      gl,
      fragmentShaderSource,
      gl.FRAGMENT_SHADER
    );
  
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error(
        "Error linking program:",
        gl.getProgramInfoLog(shaderProgram)
      );
      gl.deleteProgram(shaderProgram);
      return null;
    }
    return shaderProgram;
  }
  
  export async function loadShaders(gl) {
    const vertexShaderSource = await readShaderFile("vertex_shader.glsl");
    const fragmentShaderSource = await readShaderFile("fragment_shader.glsl");
    return createProgram(gl, vertexShaderSource, fragmentShaderSource);
  }
  