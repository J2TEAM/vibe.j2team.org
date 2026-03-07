/* oxlint-disable */
 
 
// on load we need a context for font stuff..

const ctx = document.createElement('canvas').getContext('2d');
ctx.canvas.width = 10; ctx.canvas.height = 10;

ctx.textBaseline = 'alphabetic'; // useful for measuring ascent

export default {
  async Java_pl_zb3_freej2me_bridge_graphics_CanvasFont_getTextWidth(lib, fontStr, text) {
    ctx.font = fontStr;
    return Math.round(ctx.measureText(text).width) | 0;
  },
  async Java_pl_zb3_freej2me_bridge_graphics_CanvasFont_getFontMetrics(lib, fontStr, result) {
    ctx.font = fontStr;

    const tm = ctx.measureText("0");

    // height
    result[0] = Math.round(Math.abs(tm.fontBoundingBoxAscent) + Math.abs(tm.fontBoundingBoxDescent))|0;

    // ascent
    result[1] = Math.round(Math.abs(tm.fontBoundingBoxAscent))|0;
  },
}