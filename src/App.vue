<script setup>
import { ref, onMounted } from 'vue';
import TankSelector from './components/TankSelector.vue';
import VolumeCalculator from './components/VolumeCalculator.vue';
import ResultsDisplay from './components/ResultsDisplay.vue';

// Helper function to extract tank name from filename
const extractTankName = (filename) => {
  // Remove the .json extension
  let tankName = filename.replace('.json', '');

  // Check if the tank name has a trailing period that's not part of the actual name
  // This happens because some filenames have double periods (e.g., "E L.O.SUMP.TK..json")
  // But in the UI we want to display them without the extra period (e.g., "E L.O.SUMP.TK.")
  if (tankName.endsWith('.') && filename.endsWith('..json')) {
    // Remove the trailing period
    tankName = tankName.slice(0, -1);
  }

  console.log(`App - Extracted tank name from ${filename}: ${tankName}`);
  return tankName;
};

const selectedTank = ref('');
const tankData = ref({});
const availableTanks = ref([]);
const calculationResult = ref(null);
const loading = ref(true);
const error = ref('');

// Load tank data when component is mounted
onMounted(async () => {
  try {
    loading.value = true;
    error.value = '';

    // Comprehensive list of all tank data files in the tank_data directory
    const allTankFiles = [
      'BILGE HOLDING TK..json',
      'BILGE SETT. TK..json',
      'COOLING WATER DRAIN TK..json',
      'DISPOSAL WATER TK..json',
      'E L.O.SUMP.TK..json',
      'F.O. DRAIN TK..json',
      'F.O. OVERFLOW TK..json',
      'F.O.PURIF.SLUDGE TK..json',
      'IMDG TK..json',
      'L.O.PURIF.SLUDGE TK..json',
      'M.G.O. DRAIN TK..json',
      'M.G.O.SERV.TK..json',
      'M.G.O.TK.(P).json',
      'M.G.O.TK.(S).json',
      'NO.1 B.W.B.TK..json',
      'NO.1 F.O..json',
      'NO.1 S.W.B.TK.(P).json',
      'NO.1 S.W.B.TK.(S).json',
      'NO.1 V.L.S.F.O.TK.(P).json',
      'NO.1 V.L.S.F.O.TK.(S).json',
      'NO.2 B.W.B.TK.(P).json',
      'NO.2 B.W.B.TK.(S).json',
      'NO.2 F.O..json',
      'NO.2 S.W.B.TK.(P).json',
      'NO.2 S.W.B.TK.(S).json',
      'NO.2 V.L.S.F.O.TK.(P).json',
      'NO.2 V.L.S.F.O.TK.(S).json',
      'NO.3 B.W.B.TK.(P).json',
      'NO.3 B.W.B.TK.(S).json',
      'NO.3 F.O..json',
      'NO.3 S.W.B.TK.(P).json',
      'NO.3 S.W.B.TK.(S).json',
      'NO.3 V.L.S.F.O.TK.(P).json',
      'NO.3 V.L.S.F.O.TK.(S).json',
      'NO.4 B.W.B.TK.(P).json',
      'NO.4 B.W.B.TK.(S).json',
      'NO.4 F.O..json',
      'NO.4 S.W.B.TK.(P).json',
      'NO.4 S.W.B.TK.(S).json',
      'NO.4 U.L.S.F.O.TK.(P).json',
      'NO.4 U.L.S.F.O.TK.(S).json',
      'NO.5 B.W.B.TK.(P).json',
      'NO.5 B.W.B.TK.(S).json',
      'NO.5 S.W.B.TK.(P).json',
      'NO.5 S.W.B.TK.(S).json',
      'NO.6 B.W.B.TK.(P).json',
      'NO.6 B.W.B.TK.(S).json',
      'NO.6 S.W.B.TK.(P).json',
      'NO.6 S.W.B.TK.(S).json',
      'NO.7 S.W.B.TK.(P).json',
      'NO.7 S.W.B.TK.(S).json',
      'SEWAGE HOLDING TK..json',
      'SLUDGE SETT. TK..json',
      'SLUDGE TK..json',
      'T L.O. SUMP.TK..json',
      'UREA DRAIN TK..json',
      'WASTE OIL TK..json'
    ];

    console.log(`App - Loading ${allTankFiles.length} tank data files`);

    // Clear the available tanks array
    availableTanks.value = [];

    // Load each tank data file
    for (const file of allTankFiles) {
      try {
        // Use relative path to access tank_data directory
        const response = await fetch(`../tank_data/${file}`);
        if (!response.ok) {
          console.warn(`File ${file} not found or not accessible`);
          continue;
        }
        const data = await response.json();

        // Extract tank name from filename using helper function
        const tankName = extractTankName(file);
        availableTanks.value.push(tankName);

        // Each tank data file has the tank name as the top-level key
        // We need to preserve this structure when merging the data
        // This ensures that data from different tanks doesn't overwrite each other
        Object.assign(tankData.value, data);

        console.log(`Successfully loaded tank data file: ${file}`);
      } catch (err) {
        console.error(`Error loading ${file}:`, err);
      }
    }

    // Log the availableTanks array after all files are loaded
    console.log('App - availableTanks after loading:', availableTanks.value);
    loading.value = false;
  } catch (err) {
    console.error('Error loading tank data:', err);
    error.value = 'Failed to load tank data. Please try again.';
    loading.value = false;
  }
});

// Handle tank selection
const handleTankSelection = (tank) => {
  selectedTank.value = tank;
  calculationResult.value = null;
};

// Handle calculation result
const handleCalculationResult = (result) => {
  calculationResult.value = result;
  // No need to scroll to results in horizontal layout
};
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>CMA CGM Tiga</h1>
      <h2>Tank Volume Calculator</h2>
      <p class="app-description">
        Calculate tank volume based on sounding (GAUGE) or ullage (ULL) measurements,
        with trim and heel corrections.
      </p>
    </header>

    <main class="app-content">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading tank data...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="location.reload()">Reload</button>
      </div>

      <div v-else class="calculator-container">
        <TankSelector
          v-model:selectedTank="selectedTank"
          :availableTanks="availableTanks"
          @update:selectedTank="handleTankSelection"
          class="tank-selector-container"
        />

        <div class="calculator-content">
          <div class="input-section">
            <VolumeCalculator
              :selectedTank="selectedTank"
              :tankData="tankData"
              @calculation-result="handleCalculationResult"
            />
          </div>

          <div class="results-section">
            <ResultsDisplay
              :result="calculationResult"
            />
          </div>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>&copy; 2025 CMA CGM Tiga</p>
    </footer>
  </div>
</template>

<style>
/* App-specific styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-24);
  background-color: var(--color-background);
}

.app-header {
  text-align: center;
  margin-bottom: var(--spacing-32);
  padding-bottom: var(--spacing-24);
  border-bottom: 1px solid var(--color-border);
}

h1 {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-16);
}

.app-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-callout);
  max-width: 800px;
  margin: 0 auto;
}

.app-content {
  background-color: var(--color-surface);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  padding: var(--spacing-32);
  margin-bottom: var(--spacing-32);
}

.calculator-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-24);
}

.tank-selector-container {
  width: 100%;
  margin-bottom: var(--spacing-24);
}

.calculator-content {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-32);
}

.input-section {
  flex: 1;
  min-width: 0;
}

.results-section {
  flex: 1;
  min-width: 0;
}

/* Responsive design for smaller screens */
@media (max-width: 900px) {
  .app-container {
    max-width: 800px;
    padding: var(--spacing-16);
  }

  .calculator-content {
    flex-direction: column;
    gap: var(--spacing-24);
  }

  .input-section,
  .results-section {
    width: 100%;
  }

  .app-content {
    padding: var(--spacing-24);
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-48) 0;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--color-primary);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-16);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: var(--spacing-32);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  max-width: 600px;
  margin: 0 auto;
}

.error-title {
  color: var(--color-error);
  margin-bottom: var(--spacing-16);
  font-size: var(--font-size-title-2);
}

.error-message {
  font-size: var(--font-size-callout);
  margin-bottom: var(--spacing-24);
  color: var(--color-text-secondary);
}

.troubleshooting {
  background-color: rgba(255, 149, 0, 0.1);
  padding: var(--spacing-16);
  border-radius: var(--border-radius-medium);
  margin-bottom: var(--spacing-24);
  text-align: left;
}

.troubleshooting h4 {
  color: var(--color-warning);
  margin-top: 0;
  margin-bottom: var(--spacing-8);
}

.technical-details {
  margin-bottom: var(--spacing-24);
  text-align: left;
}

.technical-details summary {
  cursor: pointer;
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-8) 0;
}

.technical-details p {
  background-color: rgba(0, 0, 0, 0.03);
  padding: var(--spacing-16);
  border-radius: var(--border-radius-medium);
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text-secondary);
  font-size: var(--font-size-footnote);
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-16);
  margin-top: var(--spacing-24);
}

.error-container button {
  padding: 10px var(--spacing-16);
}

.retry-button {
  background-color: var(--color-primary);
  color: white;
}

.retry-button:hover {
  opacity: 0.9;
}

.reload-button {
  background-color: var(--color-info);
  color: white;
}

.reload-button:hover {
  opacity: 0.9;
}

.app-footer {
  text-align: center;
  padding-top: var(--spacing-24);
  color: var(--color-text-secondary);
  font-size: var(--font-size-footnote);
}
</style>
