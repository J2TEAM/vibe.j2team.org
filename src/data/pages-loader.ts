// Static Vite glob — must remain at module scope
export const pageComponents = import.meta.glob<{ default: object }>('@/views/*/index.vue')
