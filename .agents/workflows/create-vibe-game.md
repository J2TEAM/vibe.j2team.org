---
description: create an advanced interactive game or application in the vibe.j2team.org workspace
---
# Create Advanced Vibe Game Workflow

This workflow guides you through generating a new, complex vibe coding game or application within the `vibe.j2team.org` project. It incorporates advanced architectural patterns and strict deployment constraints.

## 1. Project Context
- **Workspace**: Current `vibe.j2team.org` repository.
- **Rules**: Vue 3 (Composition API), `<script setup lang="ts">`, TailwindCSS, no extra dependencies, **no database (stateless/localStorage only)**.

## 2. Information Gathering
- Ask the user for the **Application Name** and a extremely detailed **Description/Idea**.
- Determine the folder name (e.g., `src/views/my-game-name`).

## 3. Implementation Steps
1. **Create `meta.ts`**:
   - Location: `src/views/<app-name>/meta.ts`
   - Content format:
     ```typescript
     export default {
       name: 'Game Title',
       description: 'Game Description',
       author: 'Author Name'
     }
     ```
2. **Create `index.vue` (Multi-Screen Architecture)**:
   - Location: `src/views/<app-name>/index.vue`
   - The application **must** use a virtual router state (e.g., `currentScreen = ref<'home' | 'setup' | 'play' | 'result'>('home')`) to manage multiple views within this single component.
   - Use high-contrast modern aesthetics (Vibe style), animations (`animate-fade-in`), and interactive elements.
3. **Data/Utils Management**:
   - Must extract heavy logic such as Local Storage management into `src/views/<app-name>/utils/storage.ts`.
   - Must extract static content corpus into `src/views/<app-name>/data/data.ts`.
4. **Footer Requirement**:
   - Always include a small footer in the application UI that contains credit to `vietprogrammer`.

## 4. Verification
- Use Antigravity Browser Subagents to visually and interactively test the UI flow from Home -> Setup -> Play -> Result. 
- Run `pnpm type-check` to verify TypeScript types. Do not proceed until the build is 100% green.

## 5. Deployment (CRITICAL REQUISITE)
**Before committing any code**, you MUST strictly execute the following steps for authentication:
1. Run `gh auth switch` to switch to the **namnhcntt** account. Do not use `ospgroupvn` or any other account.
2. Run standard git config setups for this specific repo:
   ```bash
   git config user.name "namnhcntt"
   git config user.email "namnhcntt@users.noreply.github.com"
   ```
3. Checkout a new feature branch `feature/<app-name>`.
4. Commit the new application adhering to Conventional Commits.
5. Setup the default GitHub CLI repository (if not already set):
   ```bash
   gh repo set-default J2TEAM/vibe.j2team.org
   ```
6. If pushing to J2TEAM directly results in 403 Forbidden, automatically fallback to:
   - `gh repo fork --remote-name fork`
   - `git push fork feature/<app-name>`
   - `gh pr create --head <your-github-username>:feature/<app-name>`
