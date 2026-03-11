<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{ active?: boolean }>()

const SOURCE_CODE = `/*
 * Matrix OS Kernel Network Driver v1.0.3
 * Access Level: Unrestricted (0x0)
 */

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#define OBFUSCATE_KEY 0x7F
#define MAX_PAYLOAD 4096

typedef struct {
    uint32_t magic;
    uint16_t version;
    uint16_t flags;
    uint32_t payload_len;
    char payload[];
} matrix_packet_t;

void init_stealth_module() {
    printf("[*] Loading kernel hooks...\\n");
    // Hooking syscalls to hide processes
    void **sys_call_table = get_syscall_table();
    original_recv = sys_call_table[__NR_recv];
    sys_call_table[__NR_recv] = hooked_recv;
    printf("[+] Syscall hooked successfully.\\n");
}

int bypass_authentication(const char *target_ip, int port) {
    int sock;
    struct sockaddr_in server;
    matrix_packet_t *pkt;
    
    printf("[*] Initiating connection to %s:%d...\\n", target_ip, port);
    sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock == -1) {
        perror("[-] Socket creation failed");
        return -1;
    }
    
    server.sin_family = AF_INET;
    server.sin_addr.s_addr = inet_addr(target_ip);
    server.sin_port = htons(port);
    
    if (connect(sock, (struct sockaddr *)&server, sizeof(server)) < 0) {
        perror("[-] Connection failed");
        return -1;
    }
    
    printf("[+] Connected. Sending exploit payload...\\n");
    pkt = malloc(sizeof(matrix_packet_t) + MAX_PAYLOAD);
    pkt->magic = 0xDEADBEEF;
    pkt->version = 1;
    pkt->flags = 0x01; // Bypass flag
    pkt->payload_len = create_rop_chain(pkt->payload);
    
    send(sock, pkt, sizeof(matrix_packet_t) + pkt->payload_len, 0);
    
    printf("[+] Exploit deployed. Expecting reverse shell...\\n");
    free(pkt);
    return sock;
}

void enter_the_matrix() {
    printf("[!] SYSTEM COMPROMISED.\\n");
    printf("[!] ALL YOUR BASE ARE BELONG TO US.\\n");
    // Initializing quantum decryption routine
    for(int i=0; i<0xFFFFF; i++) {
        decrypt_block(&memory_bank[i]);
    }
}

// EOF //
`

const typedText = ref('')
let charIndex = 0
const preRef = ref<HTMLElement | null>(null)

function handleKeydown(e: KeyboardEvent) {
  if (!props.active) return
  // Ignore modifier keys
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape'].includes(e.key)) return

  // Speed logic: 3-6 chars per typed key
  const charsPerStroke = Math.floor(Math.random() * 4) + 3

  for (let i = 0; i < charsPerStroke; i++) {
    if (charIndex >= SOURCE_CODE.length) {
      charIndex = 0 // loop back
    }
    typedText.value += SOURCE_CODE[charIndex]
    charIndex++
  }

  nextTick(() => {
    if (preRef.value) {
      preRef.value.scrollTop = preRef.value.scrollHeight
    }
  })
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="typer-wrap" :class="{ active: active }">
    <div class="typer-header">
      // CODE STREAM // <span v-if="active" class="focus-badge">[FOCUSED]</span>
    </div>
    <pre
      ref="preRef"
      class="typer-content">{{ typedText }}<span :class="active ? 'cursor' : 'cursor-idle'">█</span></pre>
  </div>
</template>

<style scoped>
.typer-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid rgba(0, 255, 65, 0.1);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}
.typer-header {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: rgba(0, 255, 65, 0.5);
  letter-spacing: 2px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(0, 255, 65, 0.08);
  flex-shrink: 0;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.focus-badge {
  color: #00d4ff;
  font-weight: bold;
}
.typer-content {
  flex: 1;
  margin: 0;
  padding: 14px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.4;
  color: rgba(0, 255, 65, 0.85);
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 255, 65, 0.3) transparent;
}
.typer-content::-webkit-scrollbar {
  width: 4px;
}
.typer-content::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 65, 0.3);
}
.cursor {
  color: #00ff41;
  animation: typer-blink 1s step-end infinite;
}
.cursor-idle {
  color: rgba(0, 255, 65, 0.3);
}
@keyframes typer-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
