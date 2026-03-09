<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import type { Message } from "../types";

const props = defineProps<{
  messages: Message[];
  isProcessing: boolean;
}>();

const emit = defineEmits(["send"]);

const userInput = ref("");
const messagesEndRef = ref<HTMLElement | null>(null);

const handleSend = () => {
  const text = userInput.value.trim();
  if (!text || props.isProcessing) return;
  emit("send", text);
  userInput.value = "";
};

watch(
  () => props.messages.length,
  async () => {
    await nextTick();
    messagesEndRef.value?.scrollIntoView({ behavior: "smooth" });
  }
);
</script>

<template>
  <div class="bg-bg-surface flex-1 flex flex-col overflow-hidden border border-border-default min-w-0">
    <div class="bg-bg-elevated p-3 text-xs text-text-primary font-display font-bold border-b border-border-default flex justify-between tracking-widest uppercase italic">
      <span class="flex items-center gap-2">
        <span class="w-2 h-2 bg-accent-coral animate-pulse"></span>
        Hệ thống
      </span>
      <span class="text-accent-sky">ONLINE</span>
    </div>
    <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-border-default text-lg font-pixel">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['flex flex-col relative', msg.sender === 'user' ? 'items-end' : 'items-start']"
      >
        <span class="font-display text-[10px] mb-1.5 text-text-dim tracking-widest font-bold uppercase">
          <span class="text-accent-coral mr-1">//</span>
          {{ msg.sender === 'user' ? 'NGƯỜI DÙNG' : (msg.agentName || 'AI AGENT') }}
        </span>
        <div
          :class="[
            'p-4 text-lg max-w-[92%] border transition-all duration-300',
            msg.sender === 'user'
              ? 'bg-bg-elevated border-accent-sky text-text-primary'
              : 'bg-bg-deep border-border-default text-text-secondary hover:border-accent-coral',
          ]"
        >
          <template v-for="(part, i) in msg.text.split('```')" :key="i">
            <div
              v-if="i % 2 === 1"
              class="my-4 p-4 bg-black/40 border-l-2 border-accent-amber font-mono text-xs text-accent-amber overflow-x-auto"
            >
              {{ part.trim() }}
            </div>
            <span v-else class="whitespace-pre-wrap leading-relaxed">{{ part }}</span>
          </template>
        </div>
      </div>
      <div v-if="isProcessing" class="flex items-center gap-2 text-xs text-accent-amber font-display font-bold mt-2 animate-pulse">
        <span class="tracking-widest italic">// ĐANG TRUY XUẤT DỮ LIỆU...</span>
      </div>
      <div ref="messagesEndRef"></div>
    </div>
    <div class="p-4 bg-bg-deep border-t border-border-default shrink-0">
      <div class="flex gap-2 items-stretch">
        <input
          v-model="userInput"
          @keyup.enter="handleSend"
          placeholder="Nhập câu hỏi tại đây..."
          class="flex-1 min-w-0 bg-bg-surface border border-border-default p-3 text-lg font-pixel outline-none text-text-primary focus:border-accent-coral transition-colors"
        />
        <button
          @click="handleSend"
          :disabled="isProcessing || !userInput.trim()"
          class="bg-accent-coral text-bg-deep px-6 py-2 font-display font-bold text-xs uppercase tracking-widest transition-all hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          GỬI
        </button>
      </div>
    </div>
  </div>
</template>
