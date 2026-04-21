<script setup lang="ts">
import { Icon } from '@iconify/vue'
import JsonPayloadBuilder from './JsonPayloadBuilder.vue'

import { useMockStudioContext } from '../composables/useMockStudioContext'

const {
  RULE_METHODS,
  rules,
  activeRule,
  activeRuleId,
  activeRuleIndex,
  addRule,
  addRuleMatcher,
  removeRuleMatcher,
  addStatusMapEntry,
  removeStatusMapEntry,
  moveActiveRule,
  cloneActiveRule,
  removeActiveRule,
} = useMockStudioContext()

interface StatusBodyTemplate {
  id: string
  label: string
  value: string
}

const STATUS_BODY_TEMPLATES: StatusBodyTemplate[] = [
  {
    id: 'success',
    label: 'Success JSON',
    value: '{\n  "ok": true,\n  "message": "Success",\n  "statusKey": "{{statusKey}}"\n}',
  },
  {
    id: 'error',
    label: 'Error JSON',
    value: '{\n  "ok": false,\n  "error": "bad_request",\n  "path": "{{request.endpoint}}"\n}',
  },
  {
    id: 'list',
    label: 'List JSON',
    value: '{\n  "items": [],\n  "meta": {\n    "requestedAt": "{{timestamp}}"\n  }\n}',
  },
]

const STATUS_BODY_TOKENS = [
  '{{statusKey}}',
  '{{request.endpoint}}',
  '{{request.method}}',
  '{{timestamp}}',
  '{{query.status}}',
  '{{header.x-mock-status}}',
  '{{body.statusKey}}',
]
</script>

<template>
  <article class="border border-border-default bg-bg-surface p-5 animate-fade-up animate-delay-3">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <h2 class="mr-auto font-display text-xl font-semibold"><span class="mr-2 text-accent-amber">//</span>Rulebook</h2>
      <button
        type="button"
        class="inline-flex items-center gap-1 border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:border-accent-coral hover:text-text-primary"
        @click="addRule"
      >
        <Icon icon="lucide:plus" class="size-3.5" />
        New Rule
      </button>
    </div>

    <div class="mb-4 border border-border-default bg-bg-deep p-3 text-xs text-text-secondary">
      <p class="font-display tracking-wide text-text-primary">Cách rule engine hoạt động</p>
      <p class="mt-1">1) Rule được đọc từ trên xuống dưới, rule khớp đầu tiên sẽ được dùng.</p>
      <p class="mt-1">2) Matcher hỗ trợ wildcard bằng <span class="font-mono">*</span> hoặc regex với tiền tố <span class="font-mono">re:</span>.</p>
      <p class="mt-1">3) Status key được ưu tiên theo Header → Query → Body path → Default status key.</p>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="rule in rules"
        :key="rule.id"
        type="button"
        class="inline-flex items-center gap-2 border px-3 py-1.5 text-xs transition"
        :class="
          activeRuleId === rule.id
            ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
            : 'border-border-default bg-bg-deep text-text-secondary hover:border-accent-coral hover:text-text-primary'
        "
        @click="activeRuleId = rule.id"
      >
        <span class="font-display tracking-wide">{{ rule.name }}</span>
        <span class="text-[10px]" :class="rule.enabled ? 'text-accent-sky' : 'text-text-dim'">{{ rule.enabled ? 'ON' : 'OFF' }}</span>
      </button>
    </div>

    <div v-if="activeRule" class="space-y-4 border border-border-default bg-bg-deep p-4">
      <div class="grid gap-3 sm:grid-cols-[1fr_150px]">
        <label class="space-y-1">
          <span class="font-display text-xs tracking-wide text-text-secondary">Rule Name</span>
          <input v-model="activeRule.name" class="w-full border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-accent-coral focus:outline-none" />
        </label>
        <label class="space-y-1">
          <span class="font-display text-xs tracking-wide text-text-secondary">Method</span>
          <select
            v-model="activeRule.method"
            class="w-full border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
          >
            <option v-for="method in RULE_METHODS" :key="method" :value="method">{{ method }}</option>
          </select>
        </label>
      </div>

      <label class="block space-y-1">
        <span class="font-display text-xs tracking-wide text-text-secondary">Endpoint Pattern</span>
        <input
          v-model="activeRule.endpointPattern"
          class="w-full border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
          placeholder="/api/tasks*"
        />
      </label>

      <label class="block space-y-1">
        <span class="font-display text-xs tracking-wide text-text-secondary">Mô tả</span>
        <input v-model="activeRule.description" class="w-full border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-accent-coral focus:outline-none" />
      </label>

      <div class="grid gap-3 sm:grid-cols-3">
        <label class="space-y-1">
          <span class="font-display text-xs tracking-wide text-text-secondary">Header key</span>
          <input
            v-model="activeRule.statusSelectorHeader"
            class="w-full border border-border-default bg-bg-surface px-2 py-1.5 text-xs focus:border-accent-coral focus:outline-none"
            placeholder="x-mock-status"
          />
        </label>
        <label class="space-y-1">
          <span class="font-display text-xs tracking-wide text-text-secondary">Query key</span>
          <input
            v-model="activeRule.statusSelectorQuery"
            class="w-full border border-border-default bg-bg-surface px-2 py-1.5 text-xs focus:border-accent-coral focus:outline-none"
            placeholder="status"
          />
        </label>
        <label class="space-y-1">
          <span class="font-display text-xs tracking-wide text-text-secondary">Body path</span>
          <input
            v-model="activeRule.statusSelectorBodyPath"
            class="w-full border border-border-default bg-bg-surface px-2 py-1.5 text-xs focus:border-accent-coral focus:outline-none"
            placeholder="statusKey"
          />
        </label>
      </div>

      <p class="text-[11px] text-text-dim">Ví dụ Body path: user.profile.status, hoặc items.0.code</p>

      <div class="grid gap-4 lg:grid-cols-3">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="font-display text-xs tracking-wide text-text-secondary">Query matchers</p>
            <button type="button" class="border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary" @click="addRuleMatcher('query')">+</button>
          </div>
          <p class="text-[11px] text-text-dim">Hỗ trợ: exact, wildcard (*) và regex (re:...)</p>
          <div v-for="matcher in activeRule.queryMatchers" :key="matcher.id" class="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input v-model="matcher.key" class="border border-border-default bg-bg-surface px-2 py-1 text-xs focus:border-accent-coral focus:outline-none" placeholder="key" />
            <input v-model="matcher.expected" class="border border-border-default bg-bg-surface px-2 py-1 text-xs focus:border-accent-coral focus:outline-none" placeholder="expected" />
            <button type="button" class="border border-border-default px-2 text-text-secondary hover:border-accent-coral hover:text-text-primary" @click="removeRuleMatcher('query', matcher.id)"><Icon icon="lucide:x" class="size-3.5" /></button>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="font-display text-xs tracking-wide text-text-secondary">Header matchers</p>
            <button type="button" class="border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary" @click="addRuleMatcher('header')">+</button>
          </div>
          <p class="text-[11px] text-text-dim">Tên header không phân biệt hoa thường</p>
          <div v-for="matcher in activeRule.headerMatchers" :key="matcher.id" class="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input v-model="matcher.key" class="border border-border-default bg-bg-surface px-2 py-1 text-xs focus:border-accent-coral focus:outline-none" placeholder="key" />
            <input v-model="matcher.expected" class="border border-border-default bg-bg-surface px-2 py-1 text-xs focus:border-accent-coral focus:outline-none" placeholder="expected" />
            <button type="button" class="border border-border-default px-2 text-text-secondary hover:border-accent-coral hover:text-text-primary" @click="removeRuleMatcher('header', matcher.id)"><Icon icon="lucide:x" class="size-3.5" /></button>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="font-display text-xs tracking-wide text-text-secondary">Body matchers</p>
            <button type="button" class="border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary" @click="addRuleMatcher('body')">+</button>
          </div>
          <p class="text-[11px] text-text-dim">Path đi theo dot notation: a.b.c hoặc list.0.id</p>
          <div v-for="matcher in activeRule.bodyMatchers" :key="matcher.id" class="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input v-model="matcher.path" class="border border-border-default bg-bg-surface px-2 py-1 text-xs focus:border-accent-coral focus:outline-none" placeholder="path" />
            <input v-model="matcher.expected" class="border border-border-default bg-bg-surface px-2 py-1 text-xs focus:border-accent-coral focus:outline-none" placeholder="expected" />
            <button type="button" class="border border-border-default px-2 text-text-secondary hover:border-accent-coral hover:text-text-primary" @click="removeRuleMatcher('body', matcher.id)"><Icon icon="lucide:x" class="size-3.5" /></button>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <p class="font-display text-xs tracking-wide text-text-secondary">Status Map</p>
          <button
            type="button"
            class="inline-flex items-center gap-1 border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary"
            @click="addStatusMapEntry"
          >
            <Icon icon="lucide:plus" class="size-3" />
            Add status
          </button>
        </div>
        <p class="text-[11px] text-text-dim">
          Muốn test custom response: chọn status key ở Request Simulator → Quick Custom Response → Apply qua Query/Header/Body.
        </p>

        <div v-for="entry in activeRule.statusMap" :key="entry.id" class="space-y-2 border border-border-default bg-bg-surface p-3">
          <div class="grid gap-2 sm:grid-cols-[1fr_120px_1fr_auto]">
            <input v-model="entry.key" class="border border-border-default bg-bg-deep px-2 py-1.5 text-xs focus:border-accent-coral focus:outline-none" placeholder="key (ok/forbidden)" />
            <input v-model.number="entry.status" type="number" min="100" max="599" class="border border-border-default bg-bg-deep px-2 py-1.5 text-xs focus:border-accent-coral focus:outline-none" placeholder="status" />
            <input v-model="entry.message" class="border border-border-default bg-bg-deep px-2 py-1.5 text-xs focus:border-accent-coral focus:outline-none" placeholder="message" />
            <button type="button" class="border border-border-default px-2 text-text-secondary hover:border-accent-coral hover:text-text-primary" @click="removeStatusMapEntry(entry.id)"><Icon icon="lucide:trash-2" class="size-4" /></button>
          </div>
          <JsonPayloadBuilder
            v-model="entry.body"
            title="Response Body"
            helper-text="Chế độ compact: JSON/Form + template + token."
            :editor-rows="5"
            :templates="STATUS_BODY_TEMPLATES"
            :token-buttons="STATUS_BODY_TOKENS"
            default-field-key="ok"
            default-field-value="true"
            compact
          />
        </div>

        <label class="block space-y-1">
          <span class="font-display text-xs tracking-wide text-text-secondary">Default status key</span>
          <select
            v-model="activeRule.defaultStatusKey"
            class="w-full border border-border-default bg-bg-surface px-2 py-1.5 text-xs focus:border-accent-coral focus:outline-none"
          >
            <option v-for="entry in activeRule.statusMap" :key="entry.id" :value="entry.key">{{ entry.key }} → {{ entry.status }}</option>
          </select>
        </label>
      </div>

      <div class="flex flex-wrap items-center gap-2 border-t border-border-default pt-3">
        <label class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary">
          <input v-model="activeRule.enabled" type="checkbox" />
          Rule enabled
        </label>
        <button type="button" class="border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary" :disabled="activeRuleIndex <= 0" @click="moveActiveRule('up')">Move up</button>
        <button type="button" class="border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary" :disabled="activeRuleIndex >= rules.length - 1" @click="moveActiveRule('down')">Move down</button>
        <button type="button" class="border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:border-accent-sky hover:text-text-primary" @click="cloneActiveRule">Clone</button>
        <button type="button" class="border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:border-accent-coral hover:text-text-primary" @click="removeActiveRule">Delete</button>
      </div>
    </div>
  </article>
</template>
