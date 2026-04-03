<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import type { CognitoConfig } from '../types'
import { AWS_REGIONS } from '../utils/demoData'

const props = defineProps<{
  /** Pre-filled when user has a saved config (reconnect flow) */
  savedConfig?: CognitoConfig | null
  isLoading?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  connect: [config: CognitoConfig]
  demo: []
}>()

const IDENTITY_POOL_PATTERN =
  /^[a-z]{2,}-[a-z]+-\d:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ROLE_ARN_PATTERN = /^arn:aws:iam::\d{12}:role\/.+$/

const form = reactive<CognitoConfig>({
  identityPoolId: props.savedConfig?.identityPoolId ?? '',
  region: props.savedConfig?.region ?? 'ap-southeast-1',
  roleArn: props.savedConfig?.roleArn ?? '',
})

const errors = reactive({ identityPoolId: '', roleArn: '' })

function validateIdentityPoolId(value: string): string {
  if (!value.trim()) return 'Identity Pool ID is required'
  if (!IDENTITY_POOL_PATTERN.test(value.trim()))
    return 'Must be in the format: ap-southeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  return ''
}

function validateRoleArn(value: string): string {
  if (!value.trim()) return 'Unauthenticated Role ARN is required'
  if (!ROLE_ARN_PATTERN.test(value.trim()))
    return 'Must be in the format: arn:aws:iam::123456789012:role/RoleName'
  return ''
}

function handleSubmit(): void {
  errors.identityPoolId = validateIdentityPoolId(form.identityPoolId)
  errors.roleArn = validateRoleArn(form.roleArn)
  if (errors.identityPoolId || errors.roleArn) return
  emit('connect', {
    identityPoolId: form.identityPoolId.trim(),
    region: form.region,
    roleArn: form.roleArn.trim(),
  })
}

function handleDemo(): void {
  emit('demo')
}

const showSetupGuide = ref(false)
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center px-4 py-12">
    <div class="w-full max-w-lg animate-fade-up">
      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="mb-4 flex justify-center">
          <div
            class="flex size-16 items-center justify-center border border-accent-coral bg-bg-surface"
          >
            <Icon icon="lucide:shield-check" class="size-8 text-accent-coral" />
          </div>
        </div>
        <h1 class="font-display text-2xl font-bold text-text-primary">
          Connect via <span class="text-accent-amber">AWS Cognito</span>
        </h1>
        <p class="mt-2 text-sm text-text-secondary">
          Uses temporary credentials from a Cognito Identity Pool — no long-lived keys required.
        </p>
      </div>

      <!-- Auth error from parent -->
      <div v-if="errorMessage" class="mb-4 flex gap-2.5 border border-red-500/40 bg-red-500/5 p-3">
        <Icon icon="lucide:alert-circle" class="mt-0.5 size-4 shrink-0 text-red-400" />
        <p class="text-xs leading-relaxed text-red-300">{{ errorMessage }}</p>
      </div>

      <!-- Auth Form -->
      <div class="border border-border-default bg-bg-surface p-6">
        <form @submit.prevent="handleSubmit">
          <!-- Identity Pool ID -->
          <div class="mb-4">
            <label
              for="identityPoolId"
              class="mb-1.5 flex items-center gap-1.5 font-display text-xs tracking-wide text-text-secondary"
            >
              <Icon icon="lucide:fingerprint" class="size-3.5" />
              IDENTITY POOL ID
              <span class="text-accent-coral">*</span>
            </label>
            <input
              id="identityPoolId"
              v-model="form.identityPoolId"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              class="w-full border border-border-default bg-bg-deep px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
              :class="{ 'border-red-500': errors.identityPoolId }"
              @blur="errors.identityPoolId = validateIdentityPoolId(form.identityPoolId)"
            />
            <p v-if="errors.identityPoolId" class="mt-1 text-xs text-red-400">
              {{ errors.identityPoolId }}
            </p>
            <p class="mt-1 text-xs text-text-dim">
              Found in AWS Console → Cognito → Identity Pools → your pool → Identity pool ID
            </p>
          </div>

          <!-- Unauthenticated Role ARN -->
          <div class="mb-4">
            <label
              for="roleArn"
              class="mb-1.5 flex items-center gap-1.5 font-display text-xs tracking-wide text-text-secondary"
            >
              <Icon icon="lucide:shield" class="size-3.5" />
              UNAUTHENTICATED ROLE ARN
              <span class="text-accent-coral">*</span>
            </label>
            <input
              id="roleArn"
              v-model="form.roleArn"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="arn:aws:iam::123456789012:role/MyAwsDashboardUnauthRole"
              class="w-full border border-border-default bg-bg-deep px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
              :class="{ 'border-red-500': errors.roleArn }"
              @blur="errors.roleArn = validateRoleArn(form.roleArn)"
            />
            <p v-if="errors.roleArn" class="mt-1 text-xs text-red-400">
              {{ errors.roleArn }}
            </p>
            <p class="mt-1 text-xs text-text-dim">
              ARN of the IAM role attached to the Identity Pool's unauthenticated access
            </p>
          </div>

          <!-- Region -->
          <div class="mb-6">
            <label
              for="region"
              class="mb-1.5 flex items-center gap-1.5 font-display text-xs tracking-wide text-text-secondary"
            >
              <Icon icon="lucide:globe" class="size-3.5" />
              REGION
            </label>
            <select
              id="region"
              v-model="form.region"
              class="w-full border border-border-default bg-bg-deep px-3 py-2.5 text-sm text-text-primary focus:border-accent-coral focus:outline-none"
            >
              <option v-for="r in AWS_REGIONS" :key="r.value" :value="r.value">
                {{ r.label }}
              </option>
            </select>
          </div>

          <!-- Security note -->
          <div class="mb-5 flex gap-2.5 border border-accent-sky/30 bg-accent-sky/5 p-3">
            <Icon icon="lucide:shield" class="mt-0.5 size-4 shrink-0 text-accent-sky" />
            <div class="text-xs leading-relaxed text-text-secondary">
              <p>
                <strong class="text-accent-sky">Secure by design:</strong> No access keys are
                entered or stored. Cognito issues short-lived STS credentials kept in memory only.
                Session auto-expires in <strong class="text-accent-sky">5 minutes</strong>.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <button
            type="submit"
            :disabled="isLoading"
            class="flex w-full items-center justify-center gap-2 bg-accent-coral px-4 py-3 font-display text-sm font-semibold text-bg-deep transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon
              :icon="isLoading ? 'lucide:loader-circle' : 'lucide:plug'"
              class="size-4"
              :class="{ 'animate-spin': isLoading }"
            />
            {{ isLoading ? 'Connecting…' : 'Connect via Cognito' }}
          </button>
        </form>

        <div class="mt-3 flex items-center gap-3">
          <div class="h-px flex-1 bg-border-default" />
          <span class="text-xs text-text-dim">or</span>
          <div class="h-px flex-1 bg-border-default" />
        </div>

        <button
          type="button"
          class="mt-3 flex w-full items-center justify-center gap-2 border border-border-default bg-bg-elevated px-4 py-3 font-display text-sm text-text-secondary transition-colors hover:border-accent-sky hover:text-accent-sky"
          @click="handleDemo"
        >
          <Icon icon="lucide:layout-dashboard" class="size-4" />
          Try with Demo Data
        </button>
      </div>

      <!-- Setup guide toggle -->
      <div class="mt-4">
        <button
          type="button"
          class="flex w-full items-center justify-between text-xs text-text-dim hover:text-text-secondary"
          @click="showSetupGuide = !showSetupGuide"
        >
          <span class="flex items-center gap-1.5">
            <Icon icon="lucide:book-open" class="size-3.5" />
            How to set up a Cognito Identity Pool
          </span>
          <Icon
            icon="lucide:chevron-down"
            class="size-3.5 transition-transform duration-200"
            :class="{ 'rotate-180': showSetupGuide }"
          />
        </button>

        <div
          v-if="showSetupGuide"
          class="mt-3 space-y-2 border border-border-default bg-bg-surface p-4 text-xs text-text-secondary"
        >
          <p class="font-semibold text-text-primary">Quick setup (5 steps):</p>
          <ol class="list-decimal space-y-1.5 pl-4">
            <li>
              Open <strong>AWS Console → Cognito → Identity Pools</strong> and click
              <em>Create identity pool</em>.
            </li>
            <li>Enable <strong>Guest access (unauthenticated identities)</strong>.</li>
            <li>
              On the IAM role step, create (or attach) a role with only:
              <code class="ml-1 bg-bg-deep px-1 py-0.5 font-mono">ce:GetCostAndUsage</code>
            </li>
            <li>
              Copy the <strong>Identity Pool ID</strong> (e.g.
              <code class="font-mono">ap-southeast-1:xxxx…</code>) and the
              <strong>unauthenticated Role ARN</strong> from the IAM console, then paste both above.
            </li>
            <li>
              Select the matching <strong>Region</strong> and click <em>Connect via Cognito</em>.
            </li>
          </ol>
          <p class="mt-2 text-text-dim">
            No long-lived keys are created. Sessions expire automatically after 5 minutes.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
