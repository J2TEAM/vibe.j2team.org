---
description: create a new vibe coding application in the workspace
---
# Create Vibe App Workflow

This workflow guides you through generating a new vibe coding page within the `vibe.j2team.org` project.

## 1. Project Context
- **Workspace**: Current `vibe.j2team.org` repository.
- **Rules**: Vue 3 (Composition API), `<script setup lang="ts">`, TailwindCSS, no extra dependencies, no database.

## 2. Information Gathering
- Ask the user for the **Application Name** and a brief **Description/Idea**.
- Determine the folder name (e.g., `src/views/my-app-name`).

## 3. Implementation Steps
1. **Create `meta.ts`**:
   - Location: `src/views/<app-name>/meta.ts`
   - Content format:
     ```typescript
     export default {
       name: 'App Title',
       description: 'App Description',
       author: 'Author Name'
     }
     ```
2. **Create `index.vue`**:
   - Location: `src/views/<app-name>/index.vue`
   - Use `<script setup lang="ts">` and `<template>` with Tailwind classes.
   - Ensure the UI is standalone, responsive, and has a link/button back to the Home page or aligns with the Vibe style.
3. **Data/Utils (Optional)**:
   - If the app requires static data, create `src/views/<app-name>/data/data.ts`.
   - If the app requires logic functions, create `src/views/<app-name>/utils/logic.ts`.

## 4. Verification
// turbo-all
- Run `pnpm type-check` to verify TypeScript types.
- Tell the user to start the local dev server using `pnpm dev` and review their app at the generated route `http://localhost:5173/<app-name>`.
