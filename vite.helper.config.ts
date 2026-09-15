import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node20',
    outDir: 'out/helper',
    emptyOutDir: true,
    lib: {
      entry: 'src/core/helper.ts',
      formats: ['es'],
      fileName: () => 'teleprompter-helper.js',
    },
    rollupOptions: {
      external: [/^node:/],
    },
  },
});
