<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

type MainTab = 'custom' | 'modbus' | 'decoder'
type DecoderMode = 'xor' | 'modbus'
type ModbusFunctionCode = '03' | '04' | '06' | '10'

interface FieldParseResult {
  value: number | null
  error: string | null
}

interface CustomFrameResult {
  bytes: number[]
  crc: number
  hexFrame: string
  decimalArray: string
  cArray: string
  length: number
  errors: string[]
}

interface ModbusBuildResult {
  bytes: number[]
  crc: number
  crcLow: number
  crcHigh: number
  hexFrame: string
  cArray: string
  length: number
  warnings: string[]
  errors: string[]
  parsedFields: Array<{ label: string; value: string }>
}

interface DecoderResult {
  bytes: number[]
  errors: string[]
  warnings: string[]
  calculatedCrc: number | null
  receivedCrc: number | null
  receivedEnd: number | null
  ok: boolean | null
}

function clampByte(value: number): number {
  return Math.min(0xff, Math.max(0x00, value))
}

function clampWord(value: number): number {
  return Math.min(0xffff, Math.max(0x0000, value))
}

function parseHexValue(input: string): number | null {
  const normalized = input.trim()

  if (normalized.length === 0) {
    return null
  }

  const compact = normalized.replace(/^0x/i, '')

  if (!/^[0-9a-f]+$/i.test(compact)) {
    return null
  }

  const value = Number.parseInt(compact, 16)
  return Number.isNaN(value) ? null : value
}

function parseHexByte(input: string): number | null {
  const value = parseHexValue(input)

  if (value === null || value < 0x00 || value > 0xff) {
    return null
  }

  return value
}

function parseHexWord(input: string): number | null {
  const value = parseHexValue(input)

  if (value === null) {
    return null
  }

  return clampWord(value)
}

function formatHexByte(value: number): string {
  return clampByte(value).toString(16).toUpperCase().padStart(2, '0')
}

function formatHexWord(value: number): string {
  return clampWord(value).toString(16).toUpperCase().padStart(4, '0')
}

function normalizeHexInput(input: string): number[] {
  return tokenizeHexInput(input)
    .map((token) => parseHexByte(token))
    .filter((value): value is number => value !== null)
}

function calculateXorChecksum(bytes: number[]): number {
  return bytes.reduce((checksum, value) => checksum ^ clampByte(value), 0x00)
}

function calculateModbusCrc(bytes: number[]): number {
  let crc = 0xffff

  for (const value of bytes) {
    crc ^= clampByte(value)

    for (let bit = 0; bit < 8; bit += 1) {
      if ((crc & 0x0001) !== 0) {
        crc = (crc >> 1) ^ 0xa001
      } else {
        crc >>= 1
      }
    }
  }

  return crc & 0xffff
}

function formatHexFrame(bytes: number[]): string {
  return bytes.map((value) => formatHexByte(value)).join(' ')
}

function formatDecimalArray(bytes: number[]): string {
  return `[${bytes.map((value) => clampByte(value)).join(', ')}]`
}

function formatCArray(bytes: number[], variableName = 'frame'): string {
  const items = bytes.map((value) => `0x${formatHexByte(value)}`).join(', ')
  return `const uint8_t ${variableName}[] = { ${items} };`
}

function tokenizeHexInput(input: string): string[] {
  return input
    .replace(/[\r\n,;]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

function normalizeByteField(input: string): string {
  const value = parseHexValue(input)
  return value === null ? input.trim().toUpperCase() : formatHexByte(clampByte(value))
}

function normalizeWordField(input: string): string {
  const value = parseHexValue(input)
  return value === null ? input.trim().toUpperCase() : formatHexWord(clampWord(value))
}

function parseRequiredByte(input: string, label: string): FieldParseResult {
  const raw = input.trim()

  if (raw.length === 0) {
    return { value: null, error: `${label} is required.` }
  }

  const exactValue = parseHexByte(raw)

  if (exactValue !== null) {
    return { value: exactValue, error: null }
  }

  const parsedValue = parseHexValue(raw)

  if (parsedValue === null) {
    return { value: null, error: `${label} must be a valid HEX byte.` }
  }

  return { value: clampByte(parsedValue), error: `${label} was clamped to 0xFF.` }
}

function parseRequiredWord(input: string, label: string): FieldParseResult {
  const raw = input.trim()

  if (raw.length === 0) {
    return { value: null, error: `${label} is required.` }
  }

  const parsedValue = parseHexValue(raw)

  if (parsedValue === null) {
    return { value: null, error: `${label} must be a valid HEX word.` }
  }

  if (parsedValue > 0xffff) {
    return { value: 0xffff, error: `${label} was clamped to 0xFFFF.` }
  }

  return { value: parsedValue, error: null }
}

function splitWordList(input: string): { values: number[]; invalidTokens: string[] } {
  const tokens = tokenizeHexInput(input)
  const values: number[] = []
  const invalidTokens: string[] = []

  for (const token of tokens) {
    const value = parseHexWord(token)

    if (value === null) {
      invalidTokens.push(token)
      continue
    }

    values.push(value)
  }

  return { values, invalidTokens }
}

async function copyText(key: string, text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
  copiedKey.value = key
  window.setTimeout(() => {
    if (copiedKey.value === key) {
      copiedKey.value = null
    }
  }, 1600)
}

const activeTab = ref<MainTab>('custom')
const copiedKey = ref<string | null>(null)

const customBin = ref('08')
const customAdr = ref('01')
const customCmd = ref('01')
const customEnd = ref('07')
const customData = ref<string[]>(Array.from({ length: 10 }, () => '00'))

const modbusSlaveAddress = ref('01')
const modbusFunctionCode = ref<ModbusFunctionCode>('03')
const modbusStartAddress = ref('0000')
const modbusQuantity = ref('0002')
const modbusSingleRegisterValue = ref('0001')
const modbusMultipleRegisterValues = ref('000A 000B')

const decoderMode = ref<DecoderMode>('xor')
const decoderInput = ref('08 01 01 00 00 00 00 00 00 00 00 00 00 08 07')

const functionLabels: Record<ModbusFunctionCode, string> = {
  '03': '0x03 Read Holding Registers',
  '04': '0x04 Read Input Registers',
  '06': '0x06 Write Single Register',
  '10': '0x10 Write Multiple Registers',
}

const customFrameResult = computed<CustomFrameResult>(() => {
  const errors: string[] = []

  const bin = parseRequiredByte(customBin.value, 'BIN')
  const adr = parseRequiredByte(customAdr.value, 'ADR')
  const cmd = parseRequiredByte(customCmd.value, 'CMD')
  const end = parseRequiredByte(customEnd.value, 'END')

  if (bin.error) errors.push(bin.error)
  if (adr.error) errors.push(adr.error)
  if (cmd.error) errors.push(cmd.error)
  if (end.error) errors.push(end.error)

  const dataBytes = customData.value.map((item, index) => {
    const result = parseRequiredByte(item, `DATA[${index}]`)
    if (result.error) {
      errors.push(result.error)
    }
    return result.value
  })

  const safeBytes = [
    bin.value ?? 0x00,
    adr.value ?? 0x00,
    cmd.value ?? 0x00,
    ...dataBytes.map((value) => value ?? 0x00),
  ]
  const crc = calculateXorChecksum(safeBytes)
  const frame = [...safeBytes, crc, end.value ?? 0x00]

  return {
    bytes: frame,
    crc,
    hexFrame: formatHexFrame(frame),
    decimalArray: formatDecimalArray(frame),
    cArray: formatCArray(frame, 'customFrame'),
    length: frame.length,
    errors,
  }
})

const modbusBuildResult = computed<ModbusBuildResult>(() => {
  const errors: string[] = []
  const warnings: string[] = []

  const slave = parseRequiredByte(modbusSlaveAddress.value, 'Slave address')
  const startAddress = parseRequiredWord(modbusStartAddress.value, 'Start address')
  const quantity = parseRequiredWord(modbusQuantity.value, 'Quantity')

  if (slave.error) errors.push(slave.error)
  if (startAddress.error) errors.push(startAddress.error)
  if (quantity.error) warnings.push(quantity.error)

  const functionCodeValue = Number.parseInt(modbusFunctionCode.value, 16)
  const payload: number[] = []
  const parsedFields: Array<{ label: string; value: string }> = [
    { label: 'Slave', value: `0x${formatHexByte(slave.value ?? 0x00)}` },
    { label: 'Function', value: functionLabels[modbusFunctionCode.value] },
    { label: 'Start Address', value: `0x${formatHexWord(startAddress.value ?? 0x0000)}` },
  ]

  const quantityValue = quantity.value ?? 0x0000

  if (modbusFunctionCode.value === '03' || modbusFunctionCode.value === '04') {
    payload.push((quantityValue >> 8) & 0xff, quantityValue & 0xff)
    parsedFields.push({ label: 'Quantity', value: `0x${formatHexWord(quantityValue)}` })
  }

  if (modbusFunctionCode.value === '06') {
    const registerValue = parseRequiredWord(modbusSingleRegisterValue.value, 'Register value')

    if (registerValue.error) {
      warnings.push(registerValue.error)
    }

    const safeValue = registerValue.value ?? 0x0000
    payload.push((safeValue >> 8) & 0xff, safeValue & 0xff)
    parsedFields.push({ label: 'Register Value', value: `0x${formatHexWord(safeValue)}` })
  }

  if (modbusFunctionCode.value === '10') {
    const split = splitWordList(modbusMultipleRegisterValues.value)

    if (split.invalidTokens.length > 0) {
      errors.push(`Invalid register value(s): ${split.invalidTokens.join(', ')}`)
    }

    const effectiveValues: number[] = []
    for (let index = 0; index < quantityValue; index += 1) {
      const nextValue = split.values[index]
      effectiveValues.push(nextValue === undefined ? 0x0000 : nextValue)
    }

    if (split.values.length < quantityValue) {
      warnings.push(
        `Padded ${quantityValue - split.values.length} missing register value(s) with 0x0000.`,
      )
    }

    if (split.values.length > quantityValue) {
      warnings.push(
        `Ignored ${split.values.length - quantityValue} extra register value(s) beyond quantity.`,
      )
    }

    const byteCount = clampByte(quantityValue * 2)
    payload.push((quantityValue >> 8) & 0xff, quantityValue & 0xff, byteCount)

    for (const value of effectiveValues) {
      payload.push((value >> 8) & 0xff, value & 0xff)
    }

    parsedFields.push({ label: 'Quantity', value: `0x${formatHexWord(quantityValue)}` })
    parsedFields.push({ label: 'Byte Count', value: `0x${formatHexByte(byteCount)}` })
    parsedFields.push({
      label: 'Register Values',
      value:
        effectiveValues.length > 0
          ? effectiveValues.map((value) => `0x${formatHexWord(value)}`).join(', ')
          : 'None',
    })
  }

  const baseFrame = [
    slave.value ?? 0x00,
    functionCodeValue,
    ((startAddress.value ?? 0x0000) >> 8) & 0xff,
    (startAddress.value ?? 0x0000) & 0xff,
    ...payload,
  ]
  const crc = calculateModbusCrc(baseFrame)
  const crcLow = crc & 0xff
  const crcHigh = (crc >> 8) & 0xff
  const frame = [...baseFrame, crcLow, crcHigh]

  return {
    bytes: frame,
    crc,
    crcLow,
    crcHigh,
    hexFrame: formatHexFrame(frame),
    cArray: formatCArray(frame, 'modbusFrame'),
    length: frame.length,
    warnings,
    errors,
    parsedFields,
  }
})

const decoderResult = computed<DecoderResult>(() => {
  const errors: string[] = []
  const warnings: string[] = []
  const tokens = tokenizeHexInput(decoderInput.value)
  const invalidTokens = tokens.filter((token) => parseHexByte(token) === null)

  if (tokens.length === 0) {
    errors.push('Paste at least one HEX byte to decode.')
  }

  if (invalidTokens.length > 0) {
    errors.push(`Invalid byte token(s): ${invalidTokens.join(', ')}`)
  }

  const bytes = normalizeHexInput(decoderInput.value)

  if (errors.length > 0) {
    return {
      bytes,
      errors,
      warnings,
      calculatedCrc: null,
      receivedCrc: null,
      receivedEnd: null,
      ok: null,
    }
  }

  if (decoderMode.value === 'xor') {
    if (bytes.length < 2) {
      return {
        bytes,
        errors: ['Custom XOR mode requires at least CRC and END bytes.'],
        warnings,
        calculatedCrc: null,
        receivedCrc: null,
        receivedEnd: null,
        ok: null,
      }
    }

    const payload = bytes.slice(0, -2)
    const receivedCrc = bytes[bytes.length - 2] ?? null
    const receivedEnd = bytes[bytes.length - 1] ?? null
    const calculatedCrc = calculateXorChecksum(payload)

    return {
      bytes,
      errors,
      warnings,
      calculatedCrc,
      receivedCrc,
      receivedEnd,
      ok: receivedCrc !== null ? calculatedCrc === receivedCrc : null,
    }
  }

  if (bytes.length < 3) {
    return {
      bytes,
      errors: ['Modbus CRC mode requires at least one payload byte and two CRC bytes.'],
      warnings,
      calculatedCrc: null,
      receivedCrc: null,
      receivedEnd: null,
      ok: null,
    }
  }

  const payload = bytes.slice(0, -2)
  const crcLow = bytes[bytes.length - 2] ?? 0x00
  const crcHigh = bytes[bytes.length - 1] ?? 0x00
  const receivedCrc = crcLow | (crcHigh << 8)
  const calculatedCrc = calculateModbusCrc(payload)

  return {
    bytes,
    errors,
    warnings,
    calculatedCrc,
    receivedCrc,
    receivedEnd: null,
    ok: calculatedCrc === receivedCrc,
  }
})

const decoderByteRows = computed(() =>
  decoderResult.value.bytes.map((value, index) => ({
    index,
    hex: formatHexByte(value),
    dec: clampByte(value),
  })),
)

function addDataByte(): void {
  customData.value.push('00')
}

function removeDataByte(index: number): void {
  customData.value.splice(index, 1)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-6 border border-border-default bg-bg-surface p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="max-w-3xl">
            <div
              class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-xs text-text-secondary"
            >
              <Icon icon="lucide:radio-tower" class="size-4 text-accent-coral" />
              <span>Industrial Communication Tool</span>
            </div>
            <a
              href="https://www.facebook.com/vnmh.mta/"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
            >
              <Icon icon="lucide:user-round" class="size-4" />
              <span>by Vu Nguyen Minh Hung</span>
              <Icon icon="lucide:external-link" class="size-4" />
            </a>
            <h1
              class="mt-6 font-display text-4xl font-bold text-accent-coral min-[375px]:text-5xl sm:text-6xl"
            >
              Protocol Frame Builder
            </h1>
            <p class="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
              Build and verify UART / RS485 / Modbus RTU frames for embedded debugging.
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <RouterLink
              to="/"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-5 py-2.5 text-sm font-medium text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
            >
              <Icon icon="lucide:house" class="size-4" />
              <span>Back to Home</span>
            </RouterLink>
          </div>
        </div>

        <div class="border border-border-default bg-bg-elevated p-2">
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              :class="
                activeTab === 'custom'
                  ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                  : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral'
              "
              class="border px-4 py-3 text-sm font-medium transition"
              @click="activeTab = 'custom'"
            >
              Custom Frame
            </button>
            <button
              :class="
                activeTab === 'modbus'
                  ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                  : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-accent-amber'
              "
              class="border px-4 py-3 text-sm font-medium transition"
              @click="activeTab = 'modbus'"
            >
              Modbus RTU
            </button>
            <button
              :class="
                activeTab === 'decoder'
                  ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                  : 'border-border-default text-text-secondary hover:border-accent-sky hover:text-accent-sky'
              "
              class="border px-4 py-3 text-sm font-medium transition"
              @click="activeTab = 'decoder'"
            >
              CRC Checker
            </button>
          </div>
        </div>
      </div>

      <section v-if="activeTab === 'custom'" class="mt-8">
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="mb-2 flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            Custom RS485 / UART Frame Builder
          </h2>
          <p class="mb-6 text-sm text-text-secondary">
            Practical binary frame builder for
            <span class="font-mono text-text-primary">BIN | ADR | CMD | DATA[] | CRC | END</span>.
            The checksum is XOR over every byte except the final END byte.
          </p>

          <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.12fr_1fr]">
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="mb-2 block text-xs text-text-dim">BIN (HEX)</label>
                  <input
                    v-model="customBin"
                    type="text"
                    class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm focus:border-accent-coral focus:outline-none"
                    @blur="customBin = normalizeByteField(customBin)"
                  />
                </div>
                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="mb-2 block text-xs text-text-dim">ADR (HEX)</label>
                  <input
                    v-model="customAdr"
                    type="text"
                    class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm focus:border-accent-coral focus:outline-none"
                    @blur="customAdr = normalizeByteField(customAdr)"
                  />
                </div>
                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="mb-2 block text-xs text-text-dim">CMD (HEX)</label>
                  <input
                    v-model="customCmd"
                    type="text"
                    class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm focus:border-accent-coral focus:outline-none"
                    @blur="customCmd = normalizeByteField(customCmd)"
                  />
                </div>
                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="mb-2 block text-xs text-text-dim">END (HEX)</label>
                  <input
                    v-model="customEnd"
                    type="text"
                    class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm focus:border-accent-coral focus:outline-none"
                    @blur="customEnd = normalizeByteField(customEnd)"
                  />
                </div>
              </div>

              <div class="border border-border-default bg-bg-elevated p-4">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div class="text-xs text-text-dim">DATA Bytes (HEX)</div>
                    <div class="text-sm text-text-secondary">
                      Add or remove payload bytes as needed.
                    </div>
                  </div>
                  <button
                    class="inline-flex items-center gap-2 border border-border-default px-3 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
                    @click="addDataByte"
                  >
                    <Icon icon="lucide:plus" class="size-4" />
                    <span>Add Byte</span>
                  </button>
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div
                    v-for="(byteValue, index) in customData"
                    :key="`custom-data-${index}`"
                    class="border border-border-default bg-bg-surface p-3"
                  >
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <label class="text-xs text-text-dim">DATA[{{ index }}]</label>
                      <button
                        class="inline-flex items-center gap-1 text-xs text-text-dim transition hover:text-accent-coral"
                        @click="removeDataByte(index)"
                      >
                        <Icon icon="lucide:trash-2" class="size-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                    <input
                      v-model="customData[index]"
                      type="text"
                      class="w-full border border-border-default bg-bg-elevated px-3 py-2 font-mono text-sm focus:border-accent-coral focus:outline-none"
                      @blur="customData[index] = normalizeByteField(byteValue)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="border border-border-default bg-bg-elevated p-5">
                <div class="mb-2 text-xs text-text-dim">HEX Frame</div>
                <div class="break-words font-mono text-lg leading-8 text-accent-coral sm:text-xl">
                  {{ customFrameResult.hexFrame }}
                </div>
                <div class="mt-4 flex flex-wrap gap-3">
                  <button
                    class="inline-flex items-center gap-2 border border-border-default px-3 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
                    @click="copyText('custom-hex', customFrameResult.hexFrame)"
                  >
                    <Icon icon="lucide:copy" class="size-4" />
                    <span>{{ copiedKey === 'custom-hex' ? 'Copied' : 'Copy HEX Frame' }}</span>
                  </button>
                  <button
                    class="inline-flex items-center gap-2 border border-border-default px-3 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
                    @click="copyText('custom-c-array', customFrameResult.cArray)"
                  >
                    <Icon icon="lucide:braces" class="size-4" />
                    <span>{{ copiedKey === 'custom-c-array' ? 'Copied' : 'Copy C Array' }}</span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="border border-border-default bg-bg-elevated p-4">
                  <div class="mb-1 text-xs text-text-dim">CRC (XOR)</div>
                  <div class="font-mono text-xl text-text-primary">
                    0x{{ formatHexByte(customFrameResult.crc) }}
                  </div>
                </div>
                <div class="border border-border-default bg-bg-elevated p-4">
                  <div class="mb-1 text-xs text-text-dim">Frame Length</div>
                  <div class="font-mono text-xl text-text-primary">
                    {{ customFrameResult.length }} bytes
                  </div>
                </div>
              </div>

              <div class="border border-border-default bg-bg-elevated p-4">
                <div class="mb-2 text-xs text-text-dim">Decimal Array</div>
                <div class="break-all font-mono text-sm text-text-primary">
                  {{ customFrameResult.decimalArray }}
                </div>
              </div>

              <div class="border border-border-default bg-bg-elevated p-4">
                <div class="mb-2 text-xs text-text-dim">C Byte Array</div>
                <div class="break-all font-mono text-sm text-text-primary">
                  {{ customFrameResult.cArray }}
                </div>
              </div>

              <div
                v-if="customFrameResult.errors.length > 0"
                class="border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"
              >
                <div class="mb-2 flex items-center gap-2 font-medium">
                  <Icon icon="lucide:triangle-alert" class="size-4" />
                  <span>Input Notes</span>
                </div>
                <ul class="space-y-1">
                  <li v-for="item in customFrameResult.errors" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'modbus'" class="mt-8">
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="mb-2 flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
            Modbus RTU Builder
          </h2>
          <p class="mb-6 text-sm text-text-secondary">
            Build practical Modbus RTU request frames with CRC-16 Modbus (<span
              class="font-mono text-text-primary"
              >0xA001</span
            >, init <span class="font-mono text-text-primary">0xFFFF</span>), appended as
            <span class="font-mono text-text-primary">CRC_L CRC_H</span>.
          </p>

          <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="mb-2 block text-xs text-text-dim">Slave Address (HEX)</label>
                  <input
                    v-model="modbusSlaveAddress"
                    type="text"
                    class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm focus:border-accent-amber focus:outline-none"
                    @blur="modbusSlaveAddress = normalizeByteField(modbusSlaveAddress)"
                  />
                </div>
                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="mb-2 block text-xs text-text-dim">Function Code</label>
                  <select
                    v-model="modbusFunctionCode"
                    class="w-full border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-accent-amber focus:outline-none"
                  >
                    <option
                      v-for="entry in Object.entries(functionLabels)"
                      :key="entry[0]"
                      :value="entry[0]"
                    >
                      {{ entry[1] }}
                    </option>
                  </select>
                </div>
                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="mb-2 block text-xs text-text-dim">Start Address (HEX)</label>
                  <input
                    v-model="modbusStartAddress"
                    type="text"
                    class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm focus:border-accent-amber focus:outline-none"
                    @blur="modbusStartAddress = normalizeWordField(modbusStartAddress)"
                  />
                </div>
                <div class="border border-border-default bg-bg-elevated p-4">
                  <label class="mb-2 block text-xs text-text-dim">Quantity (HEX)</label>
                  <input
                    v-model="modbusQuantity"
                    type="text"
                    class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm focus:border-accent-amber focus:outline-none"
                    @blur="modbusQuantity = normalizeWordField(modbusQuantity)"
                  />
                </div>
              </div>

              <div
                v-if="modbusFunctionCode === '06'"
                class="border border-border-default bg-bg-elevated p-4"
              >
                <label class="mb-2 block text-xs text-text-dim">Register Value (HEX)</label>
                <input
                  v-model="modbusSingleRegisterValue"
                  type="text"
                  class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm focus:border-accent-amber focus:outline-none"
                  @blur="modbusSingleRegisterValue = normalizeWordField(modbusSingleRegisterValue)"
                />
              </div>

              <div
                v-if="modbusFunctionCode === '10'"
                class="border border-border-default bg-bg-elevated p-4"
              >
                <label class="mb-2 block text-xs text-text-dim">
                  Register Values (HEX words)
                </label>
                <textarea
                  v-model="modbusMultipleRegisterValues"
                  rows="7"
                  class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm focus:border-accent-amber focus:outline-none"
                  placeholder="000A 000B 000C"
                />
                <p class="mt-2 text-xs text-text-secondary">
                  Separate values with spaces, commas, or new lines. Missing values are padded with
                  0x0000.
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <div class="border border-border-default bg-bg-elevated p-5">
                <div class="mb-2 text-xs text-text-dim">HEX Frame</div>
                <div class="break-words font-mono text-lg leading-8 text-accent-amber sm:text-xl">
                  {{ modbusBuildResult.hexFrame }}
                </div>
                <div class="mt-4 flex flex-wrap gap-3">
                  <button
                    class="inline-flex items-center gap-2 border border-border-default px-3 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
                    @click="copyText('modbus-hex', modbusBuildResult.hexFrame)"
                  >
                    <Icon icon="lucide:copy" class="size-4" />
                    <span>{{ copiedKey === 'modbus-hex' ? 'Copied' : 'Copy HEX Frame' }}</span>
                  </button>
                  <button
                    class="inline-flex items-center gap-2 border border-border-default px-3 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
                    @click="copyText('modbus-c-array', modbusBuildResult.cArray)"
                  >
                    <Icon icon="lucide:braces" class="size-4" />
                    <span>{{ copiedKey === 'modbus-c-array' ? 'Copied' : 'Copy C Array' }}</span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="border border-border-default bg-bg-elevated p-4">
                  <div class="mb-1 text-xs text-text-dim">CRC Low / High</div>
                  <div class="font-mono text-base text-text-primary">
                    0x{{ formatHexByte(modbusBuildResult.crcLow) }} / 0x{{
                      formatHexByte(modbusBuildResult.crcHigh)
                    }}
                  </div>
                </div>
                <div class="border border-border-default bg-bg-elevated p-4">
                  <div class="mb-1 text-xs text-text-dim">Frame Length</div>
                  <div class="font-mono text-base text-text-primary">
                    {{ modbusBuildResult.length }} bytes
                  </div>
                </div>
              </div>

              <div class="border border-border-default bg-bg-elevated p-4">
                <div class="mb-2 text-xs text-text-dim">Parsed Fields</div>
                <div class="space-y-2">
                  <div
                    v-for="item in modbusBuildResult.parsedFields"
                    :key="item.label"
                    class="border border-border-default bg-bg-surface p-3"
                  >
                    <div class="mb-1 text-xs text-text-dim">{{ item.label }}</div>
                    <div class="break-all font-mono text-sm text-text-primary">
                      {{ item.value }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="border border-border-default bg-bg-elevated p-4">
                <div class="mb-2 text-xs text-text-dim">C Byte Array</div>
                <div class="break-all font-mono text-sm text-text-primary">
                  {{ modbusBuildResult.cArray }}
                </div>
              </div>

              <div
                v-if="modbusBuildResult.errors.length > 0 || modbusBuildResult.warnings.length > 0"
                class="space-y-3"
              >
                <div
                  v-if="modbusBuildResult.errors.length > 0"
                  class="border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"
                >
                  <div class="mb-2 flex items-center gap-2 font-medium">
                    <Icon icon="lucide:triangle-alert" class="size-4" />
                    <span>Errors</span>
                  </div>
                  <ul class="space-y-1">
                    <li v-for="item in modbusBuildResult.errors" :key="item">{{ item }}</li>
                  </ul>
                </div>
                <div
                  v-if="modbusBuildResult.warnings.length > 0"
                  class="border border-accent-amber/30 bg-accent-amber/10 p-4 text-sm text-amber-100"
                >
                  <div class="mb-2 flex items-center gap-2 font-medium">
                    <Icon icon="lucide:info" class="size-4" />
                    <span>Warnings</span>
                  </div>
                  <ul class="space-y-1">
                    <li v-for="item in modbusBuildResult.warnings" :key="item">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else class="mt-8">
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="mb-2 flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
            Frame Decoder / CRC Checker
          </h2>
          <p class="mb-6 text-sm text-text-secondary">
            Paste frames with spaces, commas, new lines, or <span class="font-mono">0x</span>
            prefixes. Decode bytes and verify either custom XOR checksum or Modbus CRC-16.
          </p>

          <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_1fr]">
            <div class="space-y-4">
              <div class="border border-border-default bg-bg-elevated p-4">
                <div class="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    :class="
                      decoderMode === 'xor'
                        ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                        : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral'
                    "
                    class="border px-4 py-3 text-sm font-medium transition"
                    @click="decoderMode = 'xor'"
                  >
                    XOR Custom Checksum
                  </button>
                  <button
                    :class="
                      decoderMode === 'modbus'
                        ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                        : 'border-border-default text-text-secondary hover:border-accent-sky hover:text-accent-sky'
                    "
                    class="border px-4 py-3 text-sm font-medium transition"
                    @click="decoderMode = 'modbus'"
                  >
                    Modbus CRC-16
                  </button>
                </div>

                <label class="mb-2 block text-xs text-text-dim">Paste HEX Frame</label>
                <textarea
                  v-model="decoderInput"
                  rows="10"
                  class="w-full border border-border-default bg-bg-surface px-4 py-3 font-mono text-sm focus:border-accent-sky focus:outline-none"
                  placeholder="01 03 00 00 00 02 C4 0B"
                />
                <div class="mt-4 flex flex-wrap gap-2">
                  <button
                    class="border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-secondary transition hover:border-accent-sky hover:text-accent-sky"
                    @click="decoderInput = '08 01 01 00 00 00 00 00 00 00 00 00 00 08 07'"
                  >
                    Custom Example
                  </button>
                  <button
                    class="border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-secondary transition hover:border-accent-sky hover:text-accent-sky"
                    @click="decoderInput = '01 03 00 00 00 02 C4 0B'"
                  >
                    Modbus Example
                  </button>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="border border-border-default bg-bg-elevated p-5">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <div class="text-xs text-text-dim">CRC Status</div>
                  <div
                    v-if="decoderResult.ok !== null"
                    :class="
                      decoderResult.ok
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                        : 'border-red-400/30 bg-red-400/10 text-red-100'
                    "
                    class="inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-medium"
                  >
                    <Icon
                      :icon="decoderResult.ok ? 'lucide:shield-check' : 'lucide:shield-x'"
                      class="size-4"
                    />
                    <span>{{ decoderResult.ok ? 'OK' : 'FAIL' }}</span>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="border border-border-default bg-bg-surface p-4">
                    <div class="mb-1 text-xs text-text-dim">Calculated CRC</div>
                    <div class="font-mono text-base text-text-primary">
                      <template v-if="decoderResult.calculatedCrc !== null">
                        0x{{
                          decoderMode === 'xor'
                            ? formatHexByte(decoderResult.calculatedCrc)
                            : formatHexWord(decoderResult.calculatedCrc)
                        }}
                      </template>
                      <template v-else>--</template>
                    </div>
                  </div>
                  <div class="border border-border-default bg-bg-surface p-4">
                    <div class="mb-1 text-xs text-text-dim">Received CRC</div>
                    <div class="font-mono text-base text-text-primary">
                      <template v-if="decoderResult.receivedCrc !== null">
                        0x{{
                          decoderMode === 'xor'
                            ? formatHexByte(decoderResult.receivedCrc)
                            : formatHexWord(decoderResult.receivedCrc)
                        }}
                      </template>
                      <template v-else>--</template>
                    </div>
                  </div>
                </div>

                <div
                  v-if="decoderMode === 'xor' && decoderResult.receivedEnd !== null"
                  class="mt-4 border border-border-default bg-bg-surface p-4"
                >
                  <div class="mb-1 text-xs text-text-dim">Received END Byte</div>
                  <div class="font-mono text-base text-text-primary">
                    0x{{ formatHexByte(decoderResult.receivedEnd) }}
                  </div>
                </div>
              </div>

              <div
                v-if="decoderResult.errors.length > 0 || decoderResult.warnings.length > 0"
                class="space-y-3"
              >
                <div
                  v-if="decoderResult.errors.length > 0"
                  class="border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"
                >
                  <div class="mb-2 flex items-center gap-2 font-medium">
                    <Icon icon="lucide:triangle-alert" class="size-4" />
                    <span>Errors</span>
                  </div>
                  <ul class="space-y-1">
                    <li v-for="item in decoderResult.errors" :key="item">{{ item }}</li>
                  </ul>
                </div>
                <div
                  v-if="decoderResult.warnings.length > 0"
                  class="border border-accent-sky/30 bg-accent-sky/10 p-4 text-sm text-sky-100"
                >
                  <div class="mb-2 flex items-center gap-2 font-medium">
                    <Icon icon="lucide:info" class="size-4" />
                    <span>Warnings</span>
                  </div>
                  <ul class="space-y-1">
                    <li v-for="item in decoderResult.warnings" :key="item">{{ item }}</li>
                  </ul>
                </div>
              </div>

              <div class="border border-border-default bg-bg-elevated p-4">
                <div class="mb-3 text-xs text-text-dim">Parsed Byte Table</div>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  <div
                    v-for="row in decoderByteRows"
                    :key="row.index"
                    class="border border-border-default bg-bg-surface p-3"
                  >
                    <div class="text-xs text-text-dim">Byte {{ row.index }}</div>
                    <div class="mt-1 font-mono text-sm text-accent-sky">0x{{ row.hex }}</div>
                    <div class="mt-1 font-mono text-xs text-text-secondary">{{ row.dec }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-8">
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="mb-2 flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            Engineering Reference
          </h2>
          <p class="mb-6 text-sm text-text-secondary">
            Compact notes for practical serial debugging on embedded systems.
          </p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="mb-2 text-xs text-accent-coral">UART</div>
              <p class="text-sm text-text-secondary">
                UART frames are timed with a start bit, data bits, optional parity, and stop bits.
                The payload bytes shown here are the bytes that ride inside that stream.
              </p>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="mb-2 text-xs text-accent-amber">RS485</div>
              <p class="text-sm text-text-secondary">
                RS485 is often half-duplex. Firmware usually toggles DE/RE to switch between
                transmit and receive direction on the shared differential bus.
              </p>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="mb-2 text-xs text-accent-sky">Custom Frames</div>
              <p class="text-sm text-text-secondary">
                Many proprietary protocols use a start byte, address, command, payload, checksum,
                and end byte. XOR checksum is simple but only catches limited errors.
              </p>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="mb-2 text-xs text-accent-coral">Modbus RTU</div>
              <p class="text-sm text-text-secondary">
                Modbus RTU has no dedicated start or end byte. Frame boundaries depend on a silent
                interval of 3.5 character times between frames.
              </p>
            </div>
            <div class="border border-border-default bg-bg-elevated p-4">
              <div class="mb-2 text-xs text-accent-amber">Endianness</div>
              <p class="text-sm text-text-secondary">
                Modbus register fields are big-endian inside the payload, while CRC bytes are
                appended little-endian as CRC_L then CRC_H.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
