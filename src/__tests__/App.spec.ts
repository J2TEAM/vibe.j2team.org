import { describe, it, expect, vi } from 'vitest'

vi.mock('@/data/pages-loader', () => ({
  pageComponents: {},
}))

vi.mock('@/stores/usePagesStore', () => ({
  usePagesStore: () => ({
    pages: [],
    featuredPages: [],
    pageByPath: new Map(),
    isReady: { value: true },
    init: () => Promise.resolve(),
  }),
  getPagesCacheSync: () => [],
  fetchRawPages: () => Promise.resolve([]),
}))

import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import App from '../App.vue'
import HomePage from '../views/HomePage.vue'

describe('App', () => {
  it('mounts with router', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: HomePage }],
    })

    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createHead()],
      },
    })

    expect(wrapper.html()).toBeTruthy()
  })
})
