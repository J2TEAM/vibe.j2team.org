<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useDialog } from "../composables/useDialog";

const { dialogState, closeDialog } = useDialog();
</script>

<template>
  <Teleport to="body">
    <div v-if="dialogState.isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm" 
        @click="dialogState.type === 'alert' ? closeDialog(true) : null"
      ></div>
      
      <!-- Modal Content -->
      <div 
        class="relative bg-bg-surface border border-border-default shadow-2xl w-full p-6 animate-fade-up"
        :class="dialogState.imageUrl ? 'max-w-md' : 'max-w-sm'"
      >
        <h3 class="font-display font-bold text-lg mb-4 text-text-primary flex items-center gap-2">
          <Icon 
            :icon="dialogState.type === 'alert' ? 'lucide:info' : (dialogState.type === 'confirm' ? 'lucide:help-circle' : 'lucide:alert-circle')" 
            class="size-5 text-accent-coral" 
          />
          {{ dialogState.title }}
        </h3>

        <!-- Optional Image (for signs) -->
        <div v-if="dialogState.imageUrl" class="mb-6 flex justify-center">
          <div class="w-full max-h-64 border border-border-default bg-bg-deep flex items-center justify-center p-4">
            <img :src="dialogState.imageUrl" class="max-w-full max-h-48 object-contain" alt="Dialog Image" />
          </div>
        </div>

        <!-- Message -->
        <p 
          class="text-text-secondary mb-6 leading-relaxed"
          :class="dialogState.imageUrl ? 'bg-bg-deep p-4 border border-border-default text-sm' : ''"
        >
          {{ dialogState.message }}
        </p>

        <!-- Optional Footer (e.g. Sign ID) -->
        <div v-if="dialogState.footer" class="mb-6">
          <div class="inline-flex bg-accent-coral/10 text-accent-coral px-3 py-1 font-mono text-xs font-bold border border-accent-coral/20">
            {{ dialogState.footer }}
          </div>
        </div>
        
        <div class="flex justify-end gap-3 font-display font-semibold text-sm">
          <button
            v-if="dialogState.type === 'confirm'"
            @click="closeDialog(false)"
            class="px-5 py-2.5 border border-border-default text-text-secondary hover:text-text-primary hover:border-text-primary transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            @click="closeDialog(true)"
            class="px-5 py-2.5 border border-accent-coral bg-accent-coral text-bg-deep hover:bg-opacity-90 transition-opacity cursor-pointer"
          >
            Đồng Ý
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
