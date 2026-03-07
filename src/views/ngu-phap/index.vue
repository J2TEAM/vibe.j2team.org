<template>
  <div class="grammar-page">
    <div class="back-link">
      <a href="/">⬅ Quay lại trang chủ</a>
    </div>

    <main class="container">
      <h1>công cụ sửa ngữ pháp và dịch thông minh (nhất thế giới)</h1>
      
      <div class="config">
        <input v-model="apiKey" type="password" placeholder="nhập API key của bạn vào đây và bấm Enter" @keyup.enter="generateText" />
        <select v-model="modelName">
          <option value="gpt-5">OpenAI GPT-5</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
        </select>
      </div>

      <textarea v-model="inputText" placeholder="🗣️muốn nói gì nói đi" @keydown.enter.prevent="generateText"></textarea>
      
      <div class="status" :style="{ opacity: statusMessage ? '1' : '0' }">{{ statusMessage }}</div>
      
      <div class="result">
        <div v-for="(res, index) in results" :key="index" class="result-block" :style="{ animationDelay: (index * 0.2) + 's' }">
          {{ res }}
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models";
const openAIEndpoint = "https://api.openai.com/v1/chat/completions";

const apiKey = ref('');
const modelName = ref('gemini-2.5-flash');
const inputText = ref('');
const statusMessage = ref('');
const results = ref([]);
const STORAGE_KEY = 'ngu_phap_api_key';

const editorPrompt = `
You are an expert multilingual assistant.
If input is EN/FR: Correct grammar, paraphrase naturally.
If other language: Translate to natural and professional English.
Output ONLY the rewritten/translated sentences. Separate with \\n---\\n
`;

onMounted(() => {
  const savedKey = localStorage.getItem(STORAGE_KEY);
  if (savedKey) apiKey.value = savedKey;
});

const generateText = async () => {
  const text = inputText.value.trim();
  const currentKey = apiKey.value.trim();
  if (!currentKey) return alert("API key đâu?");
  localStorage.setItem(STORAGE_KEY, currentKey);
  if (!text) return;

  statusMessage.value = "đang xử lý...";
  results.value = [];

  try {
    let content = "";
    if (modelName.value.startsWith("gemini")) {
      const response = await fetch(`${geminiEndpoint}/${modelName.value}:generateContent?key=${currentKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${editorPrompt}\n\nUser input:\n${text}` }] }] })
      });
      const data = await response.json();
      content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } else {
      const response = await fetch(openAIEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentKey}` },
        body: JSON.stringify({ model: modelName.value, messages: [{ role: "system", content: editorPrompt }, { role: "user", content: text }] })
      });
      const data = await response.json();
      content = data.choices?.[0]?.message?.content?.trim() || "";
    }

    statusMessage.value = "";
    const parts = content.split(/\n---\n+/).filter(Boolean);
    results.value = parts.length ? parts.map(p => p.trim()) : ["⚠️ Lỗi cmnr"];
  } catch (err) {
    statusMessage.value = "Error: " + err.message;
  }
};
</script>

<style scoped>
.grammar-page {
  background: #49494B; color: #FAFAFA; display: flex; flex-direction: column; align-items: center; padding: 3rem 1rem; min-height: 100vh; font-family: sans-serif;
}
.back-link { width: 100%; max-width: 800px; margin-bottom: 2rem; }
.back-link a { color: #FFA8BC; text-decoration: none; font-weight: bold; }
.container { width: 100%; max-width: 800px; }
input, select, textarea { width: 100%; background: #72629B; color: white; border: none; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
textarea { min-height: 180px; }
.result-block { background: #72629B; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; white-space: pre-wrap; }
</style>
