import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the site at https://<user>.github.io/handoff/
  base: command === 'build' ? '/handoff/' : '/',
}))
