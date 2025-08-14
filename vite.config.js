import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-tank-data',
      closeBundle() {
        // Create tank_data directory in dist if it doesn't exist
        const distTankDataDir = resolve(__dirname, 'dist/tank_data')
        if (!fs.existsSync(distTankDataDir)) {
          fs.mkdirSync(distTankDataDir, { recursive: true })
        }

        // Copy all files from tank_data to dist/tank_data
        const tankDataDir = resolve(__dirname, 'tank_data')
        const files = fs.readdirSync(tankDataDir)

        files.forEach(file => {
          const srcFile = resolve(tankDataDir, file)
          const destFile = resolve(distTankDataDir, file)
          fs.copyFileSync(srcFile, destFile)
        })
      }
    }
  ],
})
