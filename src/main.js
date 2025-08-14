import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { init } from '@neutralinojs/lib'

// Initialize Neutralino
init()

// Create and mount Vue app
const app = createApp(App)
app.mount('#app')

// Add event handler for app exit
window.addEventListener('beforeunload', () => {
  if (window.NL_ARGS) { // Check if running in Neutralino environment
    window.Neutralino.app.exit()
  }
})
