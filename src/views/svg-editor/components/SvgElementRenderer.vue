<script setup lang="ts">
import type { SvgElement } from '../types'

defineProps<{
  el: SvgElement
}>()

function elTransform(el: SvgElement): string | undefined {
  const transforms: string[] = []
  if (el.transform) transforms.push(el.transform)
  if (el.rotation) {
    const cx = el.cx ?? ((el.x ?? 0) + (el.width ?? 0) / 2)
    const cy = el.cy ?? ((el.y ?? 0) + (el.height ?? 0) / 2)
    transforms.push(`rotate(${el.rotation} ${cx} ${cy})`)
  }
  return transforms.length > 0 ? transforms.join(' ') : undefined
}
</script>

<template>
  <g v-if="el.visible" :transform="elTransform(el)">
    <rect v-if="el.type === 'rect'" :x="el.x" :y="el.y" :width="el.width" :height="el.height" :fill="el.fill" :stroke="el.stroke" :stroke-width="el.strokeWidth" :opacity="el.opacity" :stroke-dasharray="el.strokeDasharray || undefined" :stroke-linecap="el.lineCap" :stroke-linejoin="el.lineJoin" :fill-rule="el.fillRule" />
    <circle v-if="el.type === 'circle'" :cx="el.cx" :cy="el.cy" :r="el.r" :fill="el.fill" :stroke="el.stroke" :stroke-width="el.strokeWidth" :opacity="el.opacity" :stroke-dasharray="el.strokeDasharray || undefined" :fill-rule="el.fillRule" />
    <ellipse v-if="el.type === 'ellipse'" :cx="el.cx" :cy="el.cy" :rx="el.rx" :ry="el.ry" :fill="el.fill" :stroke="el.stroke" :stroke-width="el.strokeWidth" :opacity="el.opacity" :stroke-dasharray="el.strokeDasharray || undefined" :fill-rule="el.fillRule" />
    <line v-if="el.type === 'line'" :x1="el.x1" :y1="el.y1" :x2="el.x2" :y2="el.y2" :stroke="el.stroke" :stroke-width="el.strokeWidth" :opacity="el.opacity" :stroke-dasharray="el.strokeDasharray || undefined" :stroke-linecap="el.lineCap" />
    <path v-if="el.type === 'path'" :d="el.d" :fill="el.fill" :stroke="el.stroke" :stroke-width="el.strokeWidth" :opacity="el.opacity" :stroke-dasharray="el.strokeDasharray || undefined" :stroke-linecap="el.lineCap" :stroke-linejoin="el.lineJoin" :fill-rule="el.fillRule" />
    <polygon v-if="el.type === 'polygon'" :points="el.points" :fill="el.fill" :stroke="el.stroke" :stroke-width="el.strokeWidth" :opacity="el.opacity" :stroke-dasharray="el.strokeDasharray || undefined" :fill-rule="el.fillRule" />
    <text v-if="el.type === 'text'" :x="el.x" :y="el.y" :font-size="el.fontSize" :font-family="el.fontFamily" :fill="el.fill" :stroke="el.stroke" :stroke-width="el.strokeWidth" :opacity="el.opacity">{{ el.text }}</text>
    <image v-if="el.type === 'image'" :id="el.id" :x="el.x" :y="el.y" :width="el.width" :height="el.height" :href="el.href" :opacity="el.opacity" />
    
    <template v-if="el.type === 'group' && el.children">
      <SvgElementRenderer v-for="child in el.children" :key="child.id" :el="child" />
    </template>
  </g>
</template>
