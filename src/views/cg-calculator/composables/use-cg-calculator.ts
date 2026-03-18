import { computed, type Ref } from 'vue'
import type { WingParams, Part, CalculationResult } from '../types'

export function useCgCalculator(params: Ref<WingParams>, parts: Ref<Part[]>) {
  const results = computed((): CalculationResult => {
    const {
      span: rawSpan,
      rootChord: rawRootChord,
      tipChord: rawTipChord,
      sweep: rawSweep,
      fuseWidth: rawFuseWidth,
      chassisCog: rawChassisCog,
      chassisWeight: rawChassisWeight,
      targetCgPercent: rawTargetCgPercent,
    } = params.value

    // Safe number helper - ensure it ALWAYS returns a finite number
    const n = (val: unknown, def = 0): number => {
      if (val === null || val === undefined || val === '') return def
      const num = typeof val === 'number' ? val : Number(val)
      return isFinite(num) ? num : def
    }

    const span = n(rawSpan)
    const rootChord = n(rawRootChord)
    const tipChord = n(rawTipChord)
    const sweep = n(rawSweep)
    const fuseWidth = n(rawFuseWidth)
    const chassisCog = n(rawChassisCog)
    const chassisWeight = n(rawChassisWeight)
    const targetCgPercent = n(rawTargetCgPercent)

    // Semi-span of the swept panel
    const semiSpanPanel = Math.max(0.1, (span - fuseWidth) / 2)

    // Panel Area (trapezoid)
    const panelAreaCm2 = (((rootChord + tipChord) / 2) * semiSpanPanel) / 100
    const fuseAreaCm2 = (fuseWidth * rootChord) / 100
    const totalAreaCm2 = 2 * panelAreaCm2 + fuseAreaCm2
    const totalAreaDm2 = Math.max(0.001, totalAreaCm2 / 100)

    // MAC Length of the panel
    const chordSum = rootChord + tipChord
    const macLength =
      chordSum > 0 ? (2 / 3) * (rootChord + tipChord - (rootChord * tipChord) / chordSum) : 0

    // MAC Distance (Y position from the edge of the fuselage)
    const macYFromFuse =
      chordSum > 0 ? ((semiSpanPanel / 3) * (rootChord + 2 * tipChord)) / chordSum : 0
    const macDistance = macYFromFuse

    // MAC Leading Edge X position relative to Root Leading Edge
    const macLeX = semiSpanPanel > 0 ? sweep * (macYFromFuse / semiSpanPanel) : 0

    // Aerodynamic Center (AC) of total wing
    const acFuseX = rootChord * 0.25
    const acPanelX = macLeX + macLength * 0.25

    // Weighted average AC (Neutral Point)
    const _neutralPointX =
      totalAreaCm2 > 0 ? (fuseAreaCm2 * acFuseX + 2 * panelAreaCm2 * acPanelX) / totalAreaCm2 : 0

    const targetCgDist = macLeX + (targetCgPercent / 100) * macLength

    // Weight and Balance for Parts
    let totalMoments = chassisWeight * chassisCog
    let totalWeight = chassisWeight

    parts.value.forEach((part) => {
      const pw = n(part.weight)
      const px = n(part.x)
      totalMoments += pw * px
      totalWeight += pw
    })

    const actualCgDist = totalWeight > 0 ? totalMoments / totalWeight : 0

    // Wing Loading
    const wingLoading = totalWeight / totalAreaDm2

    // Stall Speed (Rough estimation)
    const stallSpeed = wingLoading > 0 ? Math.sqrt(wingLoading) * 2.7 : 0

    return {
      wingAreaLabel: totalAreaDm2.toFixed(2),
      macDistance: Number(macDistance.toFixed(2)),
      macLength: Number(macLength.toFixed(2)),
      targetCgDist: Number(targetCgDist.toFixed(2)),
      chassisCentroid: 0,
      totalWeight: Number(totalWeight.toFixed(2)),
      wingLoading: Number(wingLoading.toFixed(2)),
      stallSpeed: Number(stallSpeed.toFixed(0)),
      actualCgDist: Number(actualCgDist.toFixed(2)),
    }
  })

  return {
    results,
  }
}
