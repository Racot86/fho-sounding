<script setup>
import { ref } from 'vue';

const props = defineProps({
  result: Object
});

// State for showing/hiding calculation details
const showCalculationDetails = ref(false);

// Toggle calculation details visibility
const toggleCalculationDetails = () => {
  showCalculationDetails.value = !showCalculationDetails.value;
};
</script>

<template>
  <div class="results-display" v-if="result">
    <h2>Calculation Results</h2>

    <div class="results-card">
      <div class="result-header">
        <h3>{{ result.tank }}</h3>
        <div class="result-summary">
          <span class="result-label">Total Volume:</span>
          <span class="result-value">{{ result.totalVolume }} m³</span>
        </div>
      </div>

      <div class="result-details">
        <div class="result-row">
          <span class="result-label">Input Type:</span>
          <span class="result-value">{{ result.inputType === 'sounding' ? 'Sounding (GAUGE)' : 'Ullage (ULL)' }}</span>
        </div>

        <div class="result-row">
          <span class="result-label">{{ result.inputType === 'sounding' ? 'Sounding' : 'Ullage' }} Value:</span>
          <span class="result-value">
            {{ result.inputValue }} cm
            <span v-if="result.calculationDetails && result.calculationDetails.isExactMatch.sounding_ullage" class="exact-match">(Exact Match)</span>
          </span>
        </div>

        <div class="result-row">
          <span class="result-label">Trim:</span>
          <span class="result-value">
            {{ result.trim }} m
            <span v-if="result.calculationDetails && result.calculationDetails.isExactMatch.trim" class="exact-match">(Exact Match)</span>
          </span>
        </div>

        <div class="result-row">
          <span class="result-label">Heel:</span>
          <span class="result-value">
            {{ result.heel.value }}°
            {{ result.heel.direction === 'port' ? 'Port' : 'Starboard' }}
            <span v-if="result.heel.value > 0 && result.calculationDetails && result.calculationDetails.isExactMatch.heel" class="exact-match">(Exact Match)</span>
          </span>
        </div>

        <div class="result-row">
          <span class="result-label">Net Volume (VNET):</span>
          <span class="result-value">{{ result.netVolume }} m³</span>
        </div>

        <div class="result-row">
          <span class="result-label">Heel Correction (VCORRH):</span>
          <span class="result-value">{{ result.heelCorrection }} m³</span>
        </div>

        <div class="result-row calculation">
          <span class="result-label">Calculation:</span>
          <span class="result-value">
            VNET + VCORRH = {{ result.netVolume }} + {{ result.heelCorrection }} = {{ result.totalVolume }} m³
          </span>
        </div>

        <!-- Calculation Method -->
        <div class="calculation-method">
          <div class="calculation-method-header" @click="toggleCalculationDetails">
            <span class="calculation-method-title">Calculation Method</span>
            <span class="calculation-method-badge" :class="{ 'interpolated': result.isInterpolated, 'exact': !result.isInterpolated }">
              {{ result.isInterpolated ? 'Interpolated' : 'Exact Match' }}
            </span>
            <span class="toggle-icon">{{ showCalculationDetails ? '▼' : '▶' }}</span>
          </div>

          <div v-if="showCalculationDetails" class="calculation-details">
            <div v-if="result.calculationDetails && result.calculationDetails.steps.length > 0" class="calculation-steps">
              <h4>Calculation Steps:</h4>
              <ol>
                <li v-for="(step, index) in result.calculationDetails.steps" :key="index">
                  {{ step }}
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-display {
  margin-top: 30px;
}

h2 {
  margin-bottom: 15px;
  color: #333;
}

.results-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.result-header {
  background-color: #4CAF50;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-header h3 {
  margin: 0;
  font-size: 18px;
}

.result-summary {
  font-size: 18px;
  font-weight: bold;
}

.result-details {
  padding: 20px;
  background-color: white;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.result-row:last-child {
  border-bottom: none;
}

.result-label {
  font-weight: bold;
  color: #555;
}

.result-value {
  color: #333;
  display: flex;
  align-items: center;
}

.exact-match {
  font-size: 12px;
  color: #4CAF50;
  margin-left: 8px;
  font-style: italic;
}

.calculation {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #eee;
  font-weight: bold;
}

.calculation .result-value {
  color: #4CAF50;
}

/* Calculation Method Styles */
.calculation-method {
  margin-top: 20px;
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
}

.calculation-method-header {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #f9f9f9;
  cursor: pointer;
  user-select: none;
}

.calculation-method-title {
  font-weight: bold;
  color: #555;
  flex-grow: 1;
}

.calculation-method-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
}

.calculation-method-badge.interpolated {
  background-color: #FFF3CD;
  color: #856404;
}

.calculation-method-badge.exact {
  background-color: #D4EDDA;
  color: #155724;
}

.toggle-icon {
  font-size: 14px;
  color: #777;
}

.calculation-details {
  padding: 15px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.calculation-steps {
  margin-top: 10px;
}

.calculation-steps h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #555;
}

.calculation-steps ol {
  margin: 0;
  padding-left: 20px;
}

.calculation-steps li {
  margin-bottom: 8px;
  color: #555;
  line-height: 1.4;
}

.calculation-steps li:last-child {
  margin-bottom: 0;
}
</style>
