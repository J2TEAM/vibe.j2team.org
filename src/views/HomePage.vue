<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import BackToTop from '@/components/BackToTop.vue'
import HeroSection from '@/components/home/HeroSection.vue'
import PagesGrid from '@/components/home/PagesGrid.vue'

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
    <HeroSection />
    <PagesGrid />
    <TechStackSection />
    <ContributeSection />
    <RulesSection />
    <ProductsSection />
    <SponsorsSection />
    <SiteFooter />
    <BackToTop />
  </div>
</template>
