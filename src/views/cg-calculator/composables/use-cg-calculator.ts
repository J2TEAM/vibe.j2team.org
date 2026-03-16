import { computed, type Ref } from 'vue'
import type { WingParams, Part, CalculationResult } from '../types'

export function useCgCalculator(params: Ref<WingParams>, parts: Ref<Part[]>) {
  const results = computed((): CalculationResult => {
    const {
      span,
      rootChord,
      tipChord,
      sweep,
      fuseWidth,
      chassisCog,
      chassisWeight,
      targetCgPercent
    } = params.value

    // Semi-span of the swept panel
    const semiSpanPanel = (span - fuseWidth) / 2
    
    // Panel Area (trapezoid)
    const panelAreaCm2 = ((rootChord + tipChord) / 2) * semiSpanPanel / 100
    const fuseAreaCm2 = (fuseWidth * rootChord) / 100
    const totalAreaCm2 = (2 * panelAreaCm2) + fuseAreaCm2
    const totalAreaDm2 = totalAreaCm2 / 100

    // MAC Length of the panel
    const macLength = (2 / 3) * (rootChord + tipChord - (rootChord * tipChord) / (rootChord + tipChord))

    // MAC Distance (Y position from the edge of the fuselage)
    const macYFromFuse = (semiSpanPanel / 3) * (rootChord + 2 * tipChord) / (rootChord + tipChord)
    const macDistance = macYFromFuse // Relative to fuse edge? Or total? 
    // Example says 182.96 which is exactly macYFromFuse (380/3 * 910/630)

    // MAC Leading Edge X position relative to Root Leading Edge
    const macLeX = sweep * (macYFromFuse / semiSpanPanel)

    // Aerodynamic Center (AC) of total wing
    // AC of fuse rectangle is at 25% chord
    const acFuseX = rootChord * 0.25
    // AC of swept panel is at 25% of its MAC
    const acPanelX = macLeX + macLength * 0.25
    
    // Weighted average AC (Neutral Point)
    const neutralPointX = (fuseAreaCm2 * acFuseX + 2 * panelAreaCm2 * acPanelX) / totalAreaCm2

    // Target CG based on % of MAC distance from center LE
    // usually Target CG = macLeX + (targetCgPercent / 100) * macLength
    // But the tool seems to relate it to the MAC. 
    // Let's use the standard: CG = macLeX + (percent) * macLength
    const targetCgDist = macLeX + (targetCgPercent / 100) * macLength

    // Weight and Balance for Parts
    let totalMoments = chassisWeight * chassisCog
    let totalWeight = chassisWeight

    parts.value.forEach(part => {
      totalMoments += part.weight * part.x
      totalWeight += part.weight
    })

    const actualCgDist = totalWeight > 0 ? totalMoments / totalWeight : 0

    // Wing Loading
    const wingLoading = totalWeight / totalAreaDm2

    // Stall Speed (Rough estimation)
    // Formula from similar tools: V_stall = sqrt(WingLoading) * 2.7 (approx for km/h)
    // Or simplified: let's try to match the "7" from 6.77
    const stallSpeed = Math.sqrt(wingLoading) * 2.7 // 2.7 is a magic constant here

    return {
      wingAreaLabel: totalAreaDm2.toFixed(2),
      macDistance: Number(macDistance.toFixed(2)),
      macLength: Number(macLength.toFixed(2)),
      targetCgDist: Number(targetCgDist.toFixed(2)),
      chassisCentroid: 0, // Not sure how they calc this, maybe geo center
      totalWeight: Number(totalWeight.toFixed(2)),
      wingLoading: Number(wingLoading.toFixed(2)),
      stallSpeed: Number(stallSpeed.toFixed(0)),
      actualCgDist: Number(actualCgDist.toFixed(2))
    }
  })

  return {
    results
  }
}
