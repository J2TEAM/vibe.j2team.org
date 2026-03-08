<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { SmartAgent, AgentAsset } from "../types";
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";

const props = defineProps<{
  agents: SmartAgent[];
  isDaytime: boolean;
  selectedAgentId: string | null;
  assets: {
    houseImg: HTMLImageElement;
    sunImg: HTMLImageElement;
    moonImg: HTMLImageElement;
    agentAssets: Record<string, AgentAsset>;
    agentBuffer: HTMLCanvasElement;
    bufferCtx: CanvasRenderingContext2D | null;
  };
}>();

const emit = defineEmits(["canvas-click", "mouse-move"]);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const mousePos = ref({ gx: 0, gy: 0 });

const handleMouseMove = (e: MouseEvent) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
  const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
  mousePos.value.gx = Number((x / TILE_SIZE).toFixed(1));
  mousePos.value.gy = Number((y / TILE_SIZE).toFixed(1));
  emit("mouse-move", mousePos.value);
};

const handleCanvasClick = () => {
  emit("canvas-click", mousePos.value);
};

defineExpose({
  canvasRef,
});

let rafId: number;

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const render = (time: number) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (props.assets.houseImg.complete) {
      ctx.drawImage(props.assets.houseImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    const skyImg = props.isDaytime ? props.assets.sunImg : props.assets.moonImg;
    if (skyImg.complete) {
      ctx.drawImage(skyImg, 0.7 * TILE_SIZE, 0.7 * TILE_SIZE, 1.4 * TILE_SIZE, 1.4 * TILE_SIZE);
    }

    props.agents.forEach((agent) => {
      const assets = props.assets.agentAssets[agent.id];
      if (!assets) return;

      const x = agent.pos.x * TILE_SIZE;
      const y = agent.pos.y * TILE_SIZE;
      const AGENT_SCALE = 1.5;
      const displaySize = 32 * AGENT_SCALE; // 48px

      // Vẽ nhân vật sao cho (x, y) là trung điểm của cạnh đáy
      const drawX = x - displaySize / 2;
      const drawY = y - displaySize;

      if (agent.id === props.selectedAgentId) {
        ctx.shadowBlur = 40;
        ctx.shadowColor = "#ffffff";
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        // Tâm vòng tròn phát sáng tại (x, y - offset) để khớp thân người
        ctx.arc(x, y - displaySize / 2, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      // Vẽ bóng dưới chân tại điểm (x, y)
      ctx.ellipse(x, y, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      const frame = (Math.floor(time / 200) % 4) * 32;
      const { agentBuffer, bufferCtx } = props.assets;
      if (bufferCtx) {
        bufferCtx.clearRect(0, 0, 32, 32);
        if (assets.body.complete) bufferCtx.drawImage(assets.body, frame, 0, 32, 32, 0, 0, 32, 32);
        if (assets.outfit.complete)
          bufferCtx.drawImage(assets.outfit, frame, 0, 32, 32, 0, 0, 32, 32);
        if (assets.hair.complete) bufferCtx.drawImage(assets.hair, frame, 0, 32, 32, 0, -2, 32, 32);
        ctx.drawImage(agentBuffer, 0, 0, 32, 32, drawX, drawY, displaySize, displaySize);
      }

      ctx.shadowBlur = 0;
      const labelY = drawY - 14;
      ctx.font = "18px 'VT323'";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center"; // Căn giữa tên
      ctx.fillText(agent.name, x, labelY + 8);

      if (agent.statusIcon) {
        ctx.font = "18px Arial";
        ctx.textAlign = "left";
        // Hạ thấp icon xuống thêm nữa (từ +12 lên +22)
        ctx.fillText(agent.statusIcon, x + 10, labelY + 22);
      }
    });

    rafId = requestAnimationFrame(render);
  };

  rafId = requestAnimationFrame(render);
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
});
</script>

<template>
  <div class="relative bg-bg-deep border border-border-default p-1 w-fit inline-block">
    <div class="scanlines pointer-events-none absolute inset-0 z-10 opacity-10"></div>
    <div
      v-if="!isDaytime"
      class="absolute inset-0 bg-blue-900/20 pointer-events-none z-10 mix-blend-multiply"
    ></div>
    <canvas
      ref="canvasRef"
      :width="CANVAS_WIDTH"
      :height="CANVAS_HEIGHT"
      @mousemove="handleMouseMove"
      @click="handleCanvasClick"
      class="block max-w-full h-auto image-pixelated cursor-crosshair"
    ></canvas>
  </div>
</template>
