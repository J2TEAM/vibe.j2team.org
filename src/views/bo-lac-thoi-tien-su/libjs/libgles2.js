/* oxlint-disable */
 
 
// we might stay with one surface, note antialias with fbos requires webgl2

// webgl doesn't throw

// we don't handle contextlost

/*
window.glestime = 0;
window.glestimebd={};

function instrument(nob) {
  const newobj = {};

  for (const kn of Object.keys(nob)) {
    newobj[kn] = async function() {
      //console.log('[glprof]', kn);
      const tstart = performance.now();
      const result = await nob[kn].apply(this, arguments);
      const dur =  performance.now()-tstart;
      window.glestime += dur;
      window.glestimebd[kn] = (window.glestimebd[kn]||0)+dur;

      return result;
    };
  }

  return newobj;
}
*/



function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

async function doThrow(lib, str) {
  // cheerpj doesn't support throwing exceptions
  await (await lib.pl.zb3.freej2me.bridge.gles2.GLES2).doThrow(errStr);
}

const tmatrix3x3 = new Float32Array(9), tmatrix4x4 = new Float32Array(16);
function transposeMatrix(matrix, size) {
  if (size === 3) {
      tmatrix3x3.set(matrix, 0);
      [tmatrix3x3[1], tmatrix3x3[3]] = [tmatrix3x3[3], tmatrix3x3[1]];
      [tmatrix3x3[2], tmatrix3x3[6]] = [tmatrix3x3[6], tmatrix3x3[2]];
      [tmatrix3x3[5], tmatrix3x3[7]] = [tmatrix3x3[7], tmatrix3x3[5]];
      return tmatrix3x3;
  } else if (size === 4) {
      tmatrix4x4.set(matrix, 0);
      [tmatrix4x4[1], tmatrix4x4[4]] = [tmatrix4x4[4], tmatrix4x4[1]];
      [tmatrix4x4[2], tmatrix4x4[8]] = [tmatrix4x4[8], tmatrix4x4[2]];
      [tmatrix4x4[3], tmatrix4x4[12]] = [tmatrix4x4[12], tmatrix4x4[3]];
      [tmatrix4x4[6], tmatrix4x4[9]] = [tmatrix4x4[9], tmatrix4x4[6]];
      [tmatrix4x4[7], tmatrix4x4[13]] = [tmatrix4x4[13], tmatrix4x4[7]];
      [tmatrix4x4[11], tmatrix4x4[14]] = [tmatrix4x4[14], tmatrix4x4[11]];
      return tmatrix4x4;
  } else {
      throw new Error("Only 3x3 or 4x4 matrices are supported.");
  }
}


const GLES2 = ({
  async Java_pl_zb3_freej2me_bridge_gles2_GLES2__1create(lib, antialias) {
    // returns the context to be used as handle

    // KOKO: we assume this runs on the main thread
    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl2', {
      // alpha: false not for webgl
      antialias: !!antialias,
      depth: true,
    });

    let maxAnisotropy = 0;
    const ext = gl.getExtension('EXT_texture_filter_anisotropic');
    if (ext) {
      maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    }

    return {
      gl,
      width: 0,
      height: 0,
      anisotropyExt: ext,
      maxAnisotropy
    };
  },
  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_getCanvas(lib, ptr) {
    const {gl} = ptr;

    return gl.canvas;
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_destroy(lib, ptr) {

  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_setSurface(lib, ptr, width, height) {
    const {gl} = ptr;

    if (width !== ptr.width || height !== ptr.height) {
      gl.canvas.width = width;
      gl.canvas.height = height;
      gl.viewport(0, 0, width, height);
      ptr.width = width;
      ptr.height = height;
    }
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_checkGLError(lib, ptr) {
    const {gl} = ptr;
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      return error;
    }

    let errStr = "";
    switch (error) {
      case gl.INVALID_ENUM:    errStr += "Invalid enum"; break;
      case gl.INVALID_VALUE:   errStr += "Invalid value"; break;
      case gl.INVALID_OPERATION: errStr += "Invalid operation"; break;
      case gl.OUT_OF_MEMORY:    errStr += "Out of memory"; break;
      case gl.CONTEXT_LOST_WEBGL: errStr += "Context lost"; break;
    }

    await doThrow(errStr);

    return null;
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_createProgram(lib, ptr, vertexSource, fragmentSource) {
    const {gl} = ptr;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      console.error("Shader creation failed. Exiting.");
      doThrow("failed to compile shaders");
      return 0;
    }

    // Create and link the program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      doThrow("failed to compile shaders");
      return;
    }

    return program;
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_useProgram(lib, ptr, prog) {
    const {gl} = ptr;
    gl.useProgram(prog);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_deleteProgram(lib, ptr, prog) {
    const {gl} = ptr;
    gl.deleteProgram(prog);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_getAttribLocation(lib, ptr, prog, name) {
    const {gl} = ptr;

    return gl.getAttribLocation(prog, name);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_getUniformLocation(lib, ptr, prog, name) {
    const {gl} = ptr;

    return gl.getUniformLocation(prog, name);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttribPointer(lib, ptr, loc, size, type, normalized, stride, offset) {
    const {gl} = ptr;

    gl.vertexAttribPointer(loc, size, type, normalized, stride, offset);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttrib2f(lib, ptr, loc, f1, f2) {
    const {gl} = ptr;

    gl.vertexAttrib2f(loc, f1, f2);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttrib3f(lib, ptr, loc, f1, f2, f3) {
    const {gl} = ptr;

    gl.vertexAttrib3f(loc, f1, f2, f3);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttrib4f(lib, ptr, loc, f1, f2, f3, f4) {
    const {gl} = ptr;

    gl.vertexAttrib4f(loc, f1, f2, f3, f4);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform1i(lib, ptr, loc, i1) {
    const {gl} = ptr;

    gl.uniform1i(loc, i1);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform1f(lib, ptr, loc, f1) {
    const {gl} = ptr;

    gl.uniform1f(loc, f1);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform2f(lib, ptr, loc, f1, f2) {
    const {gl} = ptr;

    gl.uniform2f(loc, f1, f2);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform3f(lib, ptr, loc, f1, f2, f3) {
    const {gl} = ptr;

    gl.uniform3f(loc, f1, f2, f3);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform4f(lib, ptr, loc, f1, f2, f3, f4) {
    const {gl} = ptr;

    gl.uniform4f(loc, f1, f2, f3, f4);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform3fv(lib, ptr, loc, fa) {
    // fa is Float32Array
    const {gl} = ptr;

    gl.uniform3fv(loc, fa);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform4fv(lib, ptr, loc, fa) {
    // fa is Float32Array
    const {gl} = ptr;

    gl.uniform4fv(loc, fa);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniformMatrix3fv(lib, ptr, loc, transpose, fa) {
    // fa is Float32Array
    const {gl} = ptr;
    if (fa.length != 9) {
      fa =fa.subarray(0, 9);
    }


    // note this isn't universal, here we can transpose in place
    if (transpose) fa = transposeMatrix(fa, 4);
    gl.uniformMatrix3fv(loc, false, fa);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniformMatrix4fv(lib, ptr, loc, transpose, fa) {
    // fa is Float32Array
    const {gl} = ptr;

    if (transpose) fa = transposeMatrix(fa, 4);
    gl.uniformMatrix4fv(loc, false, fa);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_createBuffer(lib, ptr) {
    const {gl} = ptr;
    return gl.createBuffer();
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_deleteBuffers(lib, ptr, handles) {
    const {gl} = ptr;
    for (const handle in handles) {
      gl.deleteBuffer(handle);
    }
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_bindBuffer(lib, ptr, type, handle) {
    const {gl} = ptr;
    gl.bindBuffer(type, handle);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferData(lib, ptr, type, size, usage) {
    const {gl} = ptr;
    gl.bufferData(type, size, usage);
  },

  // these are uncertain.. it's internal representation all along the way

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData(lib, ptr, type, offset, byteSize, array) {
    const {gl} = ptr;

    gl.bufferSubData(type, offset, new Uint8Array(array.buffer, array.byteOffset, Math.min(array.byteLength, byteSize)));
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_createTexture(lib, ptr) {
    const {gl} = ptr;
    return gl.createTexture();
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_deleteTexture(lib, ptr, handle) {
    const {gl} = ptr;
    gl.deleteTexture(handle);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_activeTexture(lib, ptr, unit) {
    const {gl} = ptr;
    gl.activeTexture(unit);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_bindTexture(lib, ptr, target, handle) {
    const {gl} = ptr;
    gl.bindTexture(target, handle);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_texParameterf(lib, ptr, target, pname, param) {
    const {gl} = ptr;
    gl.texParameterf(target, pname, param);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_texParameteri(lib, ptr, target, pname, param) {
    const {gl} = ptr;
    gl.texParameteri(target, pname, param);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_texImage2D(lib, ptr, target, level, intFormat, width, height, border, format, type, byteArray) {
    const {gl} = ptr;
    gl.texImage2D(target, level, intFormat, width, height, border, format, type, new Uint8Array(byteArray.buffer, byteArray.byteOffset, byteArray.byteLength));
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_texImage2DFromHandle(lib, ptr, target, level, intFormat, width, height, format, type, handle) {
    const {gl} = ptr;

    // copying a part of the texture possible in webgl2.. webgl1 restriction made no sense
    gl.texImage2D(target, level, intFormat, width, height, 0, format, type, handle);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_generateMipmap(lib, ptr, target) {
    const {gl} = ptr;
    gl.generateMipmap(target);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_toggleAnisotropy(lib, ptr, enable) {
    const {gl} = ptr;

    if (ptr.maxAnisotropy) {
      gl.texParameterf(gl.TEXTURE_2D, ptr.anisotropyExt.TEXTURE_MAX_ANISOTROPY_EXT, enable ? ptr.maxAnisotropy : 0);
    }
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_isTexture(lib, ptr, handle) {
    const {gl} = ptr;
    return handle && gl.isTexture(handle);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_clear(lib, ptr, mask) {
    const {gl} = ptr;
    gl.clear(mask);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_clearColor(lib, ptr, r, g, b, a) {
    const {gl} = ptr;
    gl.clearColor(r, g, b, a);
  },


  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_clearDepthf(lib, ptr, depth) {
    const {gl} = ptr;
    gl.clearDepth(depth);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_colorMask(lib, ptr, r, g, b, a) {
    const {gl} = ptr;
    gl.colorMask(r, g, b, a);
  },


  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_cullFace(lib, ptr, mode) {
    const {gl} = ptr;
    gl.cullFace(mode);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_depthFunc(lib, ptr, mode) {
    const {gl} = ptr;
    gl.depthFunc(mode);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_depthRange(lib, ptr, near, far) {
    const {gl} = ptr;
    gl.depthRange(near, far);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_depthMask(lib, ptr, flag) {
    const {gl} = ptr;
    gl.depthMask(flag);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_disable(lib, ptr, flag) {
    const {gl} = ptr;
    gl.disable(flag);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_disableVertexAttribArray(lib, ptr, loc) {
    const {gl} = ptr;
    gl.disableVertexAttribArray(loc);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_drawArrays(lib, ptr, mode, first, count) {
    const {gl} = ptr;
    gl.drawArrays(mode, first, count);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_drawElements(lib, ptr, mode, count, type, offset) {
    const {gl} = ptr;
    gl.drawElements(mode, count, type, offset);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_enable(lib, ptr, flag) {
    const {gl} = ptr;
    gl.enable(flag);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_enableVertexAttribArray(lib, ptr, loc) {
    const {gl} = ptr;
    gl.enableVertexAttribArray(loc);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_finish(lib, ptr) {
    const {gl} = ptr;
    gl.finish();
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_frontFace(lib, ptr, mode) {
    const {gl} = ptr;
    gl.frontFace(mode);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_pixelStorei(lib, ptr, pname, param) {
    const {gl} = ptr;
    gl.pixelStorei(pname, param);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_polygonOffset(lib, ptr, factor, units) {
    const {gl} = ptr;
    gl.polygonOffset(factor, units);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_readPixels(lib, ptr, x, y, width, height, int8pixels) {
    const {gl} = ptr;

    // note: just doing new Uint8Array(int8pixels) would copy the array so no read would occur
    const pixels = new Uint8Array(int8pixels.buffer, int8pixels.byteOffset, int8pixels.byteLength);

    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_scissor(lib, ptr, x, y, width, height) {
    const {gl} = ptr;
    gl.scissor(x, y, width, height);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_viewport(lib, ptr, x, y, width, height) {
    const {gl} = ptr;
    gl.viewport(x, y, width, height);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendColor(lib, ptr, r, g, b, a) {
    const {gl} = ptr;
    gl.blendColor(r, g, b, a);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendEquation(lib, ptr, mode) {
    const {gl} = ptr;
    gl.blendEquation(mode);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendFunc(lib, ptr, sfactor, dfactor) {
    const {gl} = ptr;
    gl.blendFunc(sfactor, dfactor);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendFuncSeparate(lib, ptr, srcRGB, dstRGB, srcAlpha, dstAlpha) {
    const {gl} = ptr;
    gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha);
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_createVertexArray(lib, ptr) {
    const {gl} = ptr;
    return gl.createVertexArray();
  },

  async Java_pl_zb3_freej2me_bridge_gles2_GLES2_bindVertexArray(lib, ptr, vao) {
    const {gl} = ptr;
    gl.bindVertexArray(vao);
  },
});

export default GLES2;

