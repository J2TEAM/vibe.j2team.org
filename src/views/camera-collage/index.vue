<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { Icon } from "@iconify/vue";
import frameFunny from "./images/khung-anh-funy.png";
// --- Cấu hình Khung Mặc Định ---
const DEFAULT_FRAME = {
  id: "funny",
  name: "Vui vẻ",
  url: frameFunny,
  target: { x: 0.15, y: 0.15, w: 0.7, h: 0.65 },
};

// --- State Management ---
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stream = ref<MediaStream | null>(null);

const lastCapturedPhoto = ref("");
const mergedPreview = ref("");
const isStarting = ref(false);
const isProcessing = ref(false);
const errorMessage = ref("");

// --- Điều hướng ---
function goToHome() {
  window.location.href = "/";
}

// --- Camera Logic ---
async function startCamera() {
  errorMessage.value = "";
  isStarting.value = true;
  try {
    const media = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 1280, height: 720 },
      audio: false,
    });
    stream.value = media;
    if (videoRef.value) {
      videoRef.value.srcObject = media;
      await videoRef.value.play();
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = "Không thể truy cập camera. Vui lòng kiểm tra quyền thiết bị.";
  } finally {
    isStarting.value = false;
  }
}

// --- Image Processing ---
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Lỗi tải ảnh: " + src));
    img.src = src;
  });
}

async function processMerge(photoBase64: string) {
  if (!photoBase64) return;
  isProcessing.value = true;
  try {
    const [userImg, frameImg] = await Promise.all([
      loadImage(photoBase64),
      loadImage(DEFAULT_FRAME.url),
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = frameImg.width;
    canvas.height = frameImg.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const target = {
      x: canvas.width * DEFAULT_FRAME.target.x,
      y: canvas.height * DEFAULT_FRAME.target.y,
      w: canvas.width * DEFAULT_FRAME.target.w,
      h: canvas.height * DEFAULT_FRAME.target.h,
    };

    const scale = Math.max(target.w / userImg.width, target.h / userImg.height);
    const dw = userImg.width * scale;
    const dh = userImg.height * scale;
    const dx = target.x + (target.w - dw) / 2;
    const dy = target.y + (target.h - dh) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(target.x, target.y, target.w, target.h);
    ctx.clip();
    ctx.drawImage(userImg, dx, dy, dw, dh);
    ctx.restore();

    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
    mergedPreview.value = canvas.toDataURL("image/png", 1.0);
  } catch (err) {
    console.error(err);
    errorMessage.value = "Lỗi xử lý hình ảnh Photobooth.";
  } finally {
    isProcessing.value = false;
  }
}

async function capture() {
  if (!videoRef.value || !canvasRef.value) return;
  const video = videoRef.value;
  const canvas = canvasRef.value;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  const photo = canvas.toDataURL("image/jpeg", 0.9);
  lastCapturedPhoto.value = photo;
  await processMerge(photo);
}

function download() {
  if (!mergedPreview.value) return;
  const a = document.createElement("a");
  a.download = `photobooth-${Date.now()}.png`;
  a.href = mergedPreview.value;
  a.click();
}

onBeforeUnmount(() => {
  if (stream.value) stream.value.getTracks().forEach((t) => t.stop());
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 p-4 font-sans text-slate-200 md:p-8">
    <div class="mx-auto max-w-6xl">
      <header class="mb-10 relative">
        <button
          @click="goToHome"
          class="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-orange-500 transition-all cursor-pointer border border-slate-800 group"
        >
          <Icon icon="lucide:home" class="size-4 group-hover:scale-110 transition-transform" />
          <span class="hidden sm:inline">TRANG CHỦ</span>
        </button>

        <div class="text-center">
          <h1 class="text-4xl font-black italic tracking-tighter text-orange-500 uppercase">
            AI Photobooth
          </h1>
          <p class="mt-2 text-sm text-slate-500 uppercase tracking-[0.3em]">
            Chụp ảnh & Nhận quà tức thì
          </p>
        </div>
      </header>

      <div class="grid gap-10 lg:grid-cols-2 items-start">
        <div class="flex flex-col items-center">
          <div class="flex items-center justify-between w-full mb-4 px-4">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
              >Máy chụp ảnh</span
            >
            <div v-if="stream" class="flex items-center gap-1.5">
              <span class="size-1.5 bg-red-500 rounded-full animate-pulse"></span>
              <span class="text-[10px] text-red-500 font-bold uppercase">Live</span>
            </div>
          </div>

          <div
            class="relative w-full aspect-square overflow-hidden rounded-[3rem] border-4 border-slate-800 bg-black shadow-2xl"
          >
            <video
              ref="videoRef"
              class="h-full w-full object-cover scale-x-[-1]"
              autoplay
              muted
              playsinline
            />

            <div
              v-if="!stream"
              class="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-xl"
            >
              <button
                @click="startCamera"
                :disabled="isStarting"
                class="flex items-center gap-3 rounded-3xl bg-orange-600 px-12 py-5 font-black text-white shadow-xl hover:bg-orange-500 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon v-if="!isStarting" icon="lucide:camera" class="size-6" />
                <Icon v-else icon="lucide:loader-2" class="size-6 animate-spin" />
                {{ isStarting ? "ĐANG KHỞI TẠO..." : "MỞ MÁY CHỤP" }}
              </button>
            </div>

            <button
              v-if="stream"
              @click="capture"
              class="absolute bottom-10 left-1/2 -translate-x-1/2 flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-white/20 bg-white text-slate-900 shadow-2xl hover:scale-110 active:scale-75 transition-all cursor-pointer z-10"
            >
              <Icon icon="lucide:aperture" class="size-10" />
            </button>
          </div>
          <p
            v-if="errorMessage"
            class="mt-4 text-sm text-red-400 font-medium bg-red-400/10 px-4 py-1 rounded-full text-center border border-red-500/20"
          >
            {{ errorMessage }}
          </p>
        </div>

        <div class="flex flex-col">
          <div class="flex items-center justify-between w-full mb-4 px-4">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
              >Ảnh Photobooth</span
            >
            <button
              v-if="mergedPreview"
              @click="
                mergedPreview = '';
                lastCapturedPhoto = '';
              "
              class="text-[10px] text-slate-400 hover:text-orange-500 underline underline-offset-4 uppercase font-bold transition-colors cursor-pointer"
            >
              Chụp lại
            </button>
          </div>

          <div
            class="relative w-full aspect-square flex items-center justify-center rounded-[3rem] border-4 border-dashed border-slate-800 bg-slate-900/20 overflow-hidden shadow-inner"
          >
            <img
              v-if="mergedPreview"
              :src="mergedPreview"
              :class="{ 'opacity-50': isProcessing }"
              class="h-full w-full object-contain animate-in fade-in zoom-in-95 duration-500 transition-opacity"
            />

            <div v-else class="text-center opacity-30 px-10">
              <Icon
                icon="lucide:sparkles"
                class="size-20 mx-auto mb-4 text-orange-500 opacity-50"
              />
              <p class="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                Tạo dáng thật tươi và nhấn nút
                <Icon icon="lucide:aperture" class="inline size-3" /> để nhận ảnh
              </p>
            </div>

            <button
              v-if="mergedPreview && !isProcessing"
              @click="download"
              class="absolute bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-2xl hover:bg-orange-400 active:scale-90 transition-all cursor-pointer"
            >
              <Icon icon="lucide:download" class="size-8" />
            </button>

            <div
              v-if="isProcessing"
              class="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            >
              <Icon icon="lucide:loader-2" class="size-10 animate-spin text-orange-500" />
            </div>
          </div>

          <div
            class="mt-8 p-6 bg-slate-900/40 rounded-3xl border border-slate-800 flex items-start gap-4"
          >
            <div class="bg-orange-500/10 p-2 rounded-xl">
              <Icon icon="lucide:lightbulb" class="size-5 text-orange-500" />
            </div>
            <div class="text-xs text-slate-400 leading-relaxed">
              <span class="block font-bold text-slate-300 uppercase mb-1">Mẹo nhỏ:</span>
              Đứng cách camera khoảng 1 mét và đảm bảo ánh sáng rạng rỡ. Ảnh của bạn sẽ được tự động
              lồng vào khung hình kỷ niệm!
            </div>
          </div>
        </div>
      </div>
    </div>

    <canvas ref="canvasRef" class="hidden" />
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Hiệu ứng mượt mà cho ảnh mới hiện ra */
.animate-in {
  animation: zoomIn 0.5s ease-out;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
