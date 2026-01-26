import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: false,
  target: 'node20',
  skipNodeModulesBundle: true,
});
