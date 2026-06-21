import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/client/setup.ts'],
    include: ['test/client/**/*.test.ts']
  }
})
