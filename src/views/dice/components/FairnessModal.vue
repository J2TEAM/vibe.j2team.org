<script setup lang="ts">
import { ref } from 'vue'
import { uuid, deriveRoll } from '../utils/crypto'
import type { RevealedPair, FairnessTab } from '../types'

const props = defineProps<{
  isOpen: boolean
  initialTab?: FairnessTab
  activeClientSeed: string
  activeServerSeedHash: string
  nonce: number
  prevSeed: RevealedPair | null
  newClientSeedInput: string
  vClientSeed: string
  vServerSeed: string
  vNonce: number
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'update:newClientSeedInput', value: string): void
  (e: 'rotate'): void
  (e: 'update:vClientSeed', value: string): void
  (e: 'update:vServerSeed', value: string): void
  (e: 'update:vNonce', value: number): void
}>()

const fairnessTab = ref<FairnessTab>(props.initialTab || 'seeds')
const copiedKey = ref('')
const vResult = ref<number | null>(null)
const vLoading = ref(false)

async function runVerify() {
  if (!props.vClientSeed || !props.vServerSeed) return
  vLoading.value = true
  vResult.value = await deriveRoll(props.vServerSeed, props.vClientSeed, props.vNonce)
  vLoading.value = false
}

function copyText(text: string, key: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      copiedKey.value = key
      setTimeout(() => {
        if (copiedKey.value === key) copiedKey.value = ''
      }, 1500)
    })
    .catch(() => {})
}

function generateNewSeed() {
  emit('update:newClientSeedInput', uuid())
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        @click="emit('update:isOpen', false)"
      />
      <div
        class="relative w-full max-w-lg bg-bg-surface border border-border-default overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
      >
        <!-- Modal header -->
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-border-default shrink-0"
        >
          <h2 class="font-display font-bold text-text-primary flex items-center gap-2">
            <span class="text-accent-sky">🔐</span> Provably Fair
          </h2>
          <button
            class="text-text-dim hover:text-text-primary transition-colors text-lg"
            @click="emit('update:isOpen', false)"
          >
            ✕
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-border-default shrink-0">
          <button
            v-for="tab in ['seeds', 'verify', 'algorithm'] as FairnessTab[]"
            :key="tab"
            class="flex-1 py-3 text-xs font-display tracking-widest transition-all uppercase"
            :class="
              fairnessTab === tab
                ? 'text-accent-sky border-b-2 border-accent-sky bg-accent-sky/5'
                : 'text-text-dim hover:text-text-secondary'
            "
            @click="fairnessTab = tab"
          >
            {{ tab === 'seeds' ? '🌱 Seeds' : tab === 'verify' ? '🔍 Verify' : '⚙️ Algorithm' }}
          </button>
        </div>

        <!-- Tab content -->
        <div class="overflow-y-auto flex-1 p-5 space-y-5 custom-scrollbar">
          <!-- Seeds tab -->
          <template v-if="fairnessTab === 'seeds'">
            <div>
              <h3 class="text-xs text-accent-sky font-display tracking-widest mb-3 uppercase">
                // Current Seed Pair
              </h3>
              <div class="space-y-3">
                <div>
                  <div class="text-xs text-text-dim mb-1 font-display uppercase tracking-widest">
                    Client Seed
                  </div>
                  <div class="flex gap-2">
                    <code
                      class="flex-1 bg-bg-deep border border-border-default px-3 py-2 text-xs text-text-primary font-mono break-all"
                      >{{ activeClientSeed }}</code
                    >
                    <button
                      class="px-3 border border-border-default text-xs text-text-dim hover:border-accent-sky hover:text-accent-sky transition-all shrink-0"
                      @click="copyText(activeClientSeed, 'cs')"
                    >
                      {{ copiedKey === 'cs' ? '✓' : '⎘' }}
                    </button>
                  </div>
                </div>
                <div>
                  <div class="text-xs text-text-dim mb-1 font-display uppercase tracking-widest">
                    Server Seed (SHA-512 Hash)
                  </div>
                  <div class="flex gap-2">
                    <code
                      class="flex-1 bg-bg-deep border border-border-default px-3 py-2 text-xs text-text-secondary font-mono break-all"
                      >{{ activeServerSeedHash }}</code
                    >
                    <button
                      class="px-3 border border-border-default text-xs text-text-dim hover:border-accent-sky hover:text-accent-sky transition-all shrink-0"
                      @click="copyText(activeServerSeedHash, 'ssh')"
                    >
                      {{ copiedKey === 'ssh' ? '✓' : '⎘' }}
                    </button>
                  </div>
                </div>
                <div
                  class="flex items-center gap-4 text-xs font-display uppercase tracking-wider text-text-dim"
                >
                  <span
                    >Nonce: <strong class="text-text-primary">{{ nonce }}</strong></span
                  >
                </div>
              </div>
            </div>

            <!-- Rotate seeds -->
            <div class="border border-border-default bg-bg-deep p-4">
              <div class="text-xs text-text-dim font-display mb-2 uppercase tracking-widest">
                New client seed (optional)
              </div>
              <div class="flex gap-2 mb-3">
                <input
                  :value="newClientSeedInput"
                  @input="
                    emit('update:newClientSeedInput', ($event.target as HTMLInputElement).value)
                  "
                  type="text"
                  placeholder="Enter new seed or leave blank"
                  class="flex-1 bg-bg-elevated border border-border-default px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-sky font-mono"
                />
                <button
                  class="px-3 border border-border-default text-xs text-text-dim hover:border-accent-sky hover:text-accent-sky transition-all"
                  @click="generateNewSeed"
                >
                  🔀
                </button>
              </div>
              <button
                class="w-full py-3 font-display font-bold text-sm tracking-widest border border-accent-sky text-accent-sky hover:bg-accent-sky hover:text-bg-deep transition-all uppercase"
                @click="emit('rotate')"
              >
                🔄 Rotate Seeds
              </button>
              <p class="text-[10px] text-text-dim mt-2 italic">
                Sau khi rotate, server seed hiện tại sẽ được tiết lộ để bạn có thể xác minh lịch sử.
              </p>
            </div>

            <!-- Previous seed pair -->
            <div v-if="prevSeed" class="mt-4 border-t border-border-default pt-4">
              <h3 class="text-xs text-accent-amber font-display tracking-widest mb-3 uppercase">
                // Previous Seed Pair (Exposed)
              </h3>
              <div class="space-y-3">
                <div>
                  <div class="text-xs text-text-dim mb-1 font-display uppercase tracking-widest">
                    Client Seed
                  </div>
                  <code
                    class="block bg-bg-deep border border-border-default px-3 py-2 text-xs text-text-primary font-mono break-all"
                    >{{ prevSeed.clientSeed }}</code
                  >
                </div>
                <div>
                  <div class="text-xs text-text-dim mb-1 font-display uppercase tracking-widest">
                    Server Seed ✅
                  </div>
                  <div class="flex gap-2">
                    <code
                      class="flex-1 bg-bg-deep border border-accent-sky/30 px-3 py-2 text-xs text-accent-sky font-mono break-all"
                      >{{ prevSeed.serverSeed }}</code
                    >
                    <button
                      class="px-3 border border-border-default text-xs text-text-dim hover:border-accent-sky hover:text-accent-sky transition-all shrink-0"
                      @click="copyText(prevSeed!.serverSeed, 'pss')"
                    >
                      {{ copiedKey === 'pss' ? '✓' : '⎘' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Verify tab -->
          <template v-if="fairnessTab === 'verify'">
            <div class="space-y-4">
              <h3 class="text-xs text-accent-sky font-display tracking-widest mb-1 uppercase">
                // Verify Outcome
              </h3>
              <div class="space-y-3">
                <div>
                  <div class="text-xs text-text-dim mb-1 font-display uppercase tracking-widest">
                    Actual Server Seed
                  </div>
                  <input
                    :value="vServerSeed"
                    @input="emit('update:vServerSeed', ($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="Enter revealable server seed"
                    class="w-full bg-bg-deep border border-border-default px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-sky font-mono"
                  />
                </div>
                <div>
                  <div class="text-xs text-text-dim mb-1 font-display uppercase tracking-widest">
                    Client Seed
                  </div>
                  <input
                    :value="vClientSeed"
                    @input="emit('update:vClientSeed', ($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="Enter client seed"
                    class="w-full bg-bg-deep border border-border-default px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-sky font-mono"
                  />
                </div>
                <div>
                  <div class="text-xs text-text-dim mb-1 font-display uppercase tracking-widest">
                    Nonce (Roll #)
                  </div>
                  <input
                    :value="vNonce"
                    @input="
                      emit(
                        'update:vNonce',
                        parseInt(($event.target as HTMLInputElement).value) || 0,
                      )
                    "
                    type="number"
                    min="0"
                    class="w-full bg-bg-deep border border-border-default px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-sky font-mono"
                  />
                </div>
                <button
                  class="w-full py-3 font-display font-bold text-sm tracking-widest transition-all disabled:opacity-40 uppercase"
                  :class="
                    vLoading
                      ? 'bg-bg-elevated text-text-dim'
                      : 'bg-accent-sky text-bg-deep hover:brightness-110'
                  "
                  :disabled="vLoading || !vClientSeed || !vServerSeed"
                  @click="runVerify"
                >
                  {{ vLoading ? 'Calculating' : '🔍 Check Outcome' }}
                </button>
                <div
                  v-if="vResult !== null"
                  class="text-center py-6 border border-accent-sky bg-accent-sky/5 animate-fade-up"
                >
                  <div
                    class="text-xs text-text-dim font-display mb-2 uppercase tracking-widest font-bold"
                  >
                    Result for Roll #{{ vNonce }}
                  </div>
                  <div class="font-display font-bold text-6xl text-accent-sky">
                    {{ String(vResult).padStart(2, '0') }}
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Algorithm tab -->
          <template v-if="fairnessTab === 'algorithm'">
            <div class="space-y-4">
              <h3 class="text-xs text-accent-amber font-display tracking-widest mb-1 uppercase">
                // The Algorithm (HMAC-SHA512)
              </h3>
              <p class="text-xs text-text-secondary leading-relaxed tracking-wide">
                Mỗi lần roll, kết quả được tạo ra bằng HMAC-SHA512 từ
                <strong class="text-text-primary">server seed</strong> và
                <strong class="text-text-primary">client seed + nonce</strong>
              </p>
              <pre
                class="bg-bg-deep border border-border-default p-4 text-xs text-accent-amber font-mono overflow-x-auto leading-relaxed custom-scrollbar opacity-80"
              >
// Node.js / Browser (Web Crypto API)
const key = serverSeed;
const msg = clientSeed + '-' + nonce;

// HMAC-SHA512(key, msg) → hex hash
const hash = hmac_sha512(key, msg);

// Hex chars to result derivation
let index = 0;
let lucky = parseInt(hash.slice(index * 5, index * 5 + 5), 16);

// Bias prevention loop
while (lucky >= 1_000_000) {
  index++;
  lucky = parseInt(hash.slice(index * 5, index * 5 + 5), 16);
  if (index * 5 + 5 > 128) {
    lucky = 9999;
    break;
  }
}

// Result: 0-99 (integer)
result = Math.floor((lucky % 10_000) / 100);</pre
              >
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
