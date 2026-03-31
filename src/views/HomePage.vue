<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import FixedCTA from '@/components/home/FixedCTA.vue'
import HeroSection from '@/components/home/HeroSection.vue'
import PagesGrid from '@/components/home/PagesGrid.vue'

const heroRef = ref<HTMLElement>()
const hideCtaRef = ref<HTMLElement>()

const StarGoalCTA = defineAsyncComponent(() => import('@/components/home/StarGoalCTA.vue'))
const TechStackSection = defineAsyncComponent(
  () => import('@/components/home/TechStackSection.vue'),
)
const ContributeSection = defineAsyncComponent(
  () => import('@/components/home/ContributeSection.vue'),
)
const RulesSection = defineAsyncComponent(() => import('@/components/home/RulesSection.vue'))
const ProductsSection = defineAsyncComponent(() => import('@/components/home/ProductsSection.vue'))
const SponsorsSection = defineAsyncComponent(() => import('@/components/home/SponsorsSection.vue'))
const SiteFooter = defineAsyncComponent(() => import('@/components/home/SiteFooter.vue'))
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div ref="heroRef">
      <HeroSection />
    </div>
    <StarGoalCTA />
    <PagesGrid />
    <TechStackSection />
    <ContributeSection />
    <RulesSection />
    <div ref="hideCtaRef">
      <ProductsSection />
      <SponsorsSection />
      <SiteFooter />
    </div>
    <FixedCTA :observe-target="heroRef" :hide-target="hideCtaRef" />
  </div>
</template>
