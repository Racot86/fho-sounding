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

        // Merge the data into the tankData object
        tankData.value = { ...tankData.value, ...data };

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
      <h1>Tank Volume Calculator</h1>
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
      <p>&copy; 2025 Tank Volume Calculator</p>
    </footer>
  </div>
</template>

<style>
/* Global styles */
:root {
  --primary-color: #4CAF50;
  --primary-dark: #45a049;
  --text-color: #333;
  --light-gray: #f5f5f5;
  --border-color: #ddd;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--light-gray);
}
</style>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

h1 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

.app-description {
  color: #666;
}

.app-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-bottom: 30px;
}

.calculator-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tank-selector-container {
  width: 100%;
  margin-bottom: 20px;
}

.calculator-content {
  display: flex;
  flex-direction: row;
  gap: 30px;
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
    padding: 15px;
  }

  .calculator-content {
    flex-direction: column;
    gap: 20px;
  }

  .input-section,
  .results-section {
    width: 100%;
  }

  .app-content {
    padding: 20px;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--primary-color);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 30px;
  color: #f44336;
}

.error-container button {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.app-footer {
  text-align: center;
  padding-top: 20px;
  color: #777;
  font-size: 14px;
}
</style>
