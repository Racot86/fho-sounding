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
  margin-top: var(--spacing-32);
}

h2 {
  margin-bottom: var(--spacing-16);
  color: var(--color-text-primary);
  font-size: var(--font-size-title-3);
  font-weight: var(--font-weight-semibold);
}

.results-card {
  border-radius: var(--border-radius-large);
  overflow: hidden;
  box-shadow: var(--shadow-medium);
  background-color: var(--color-surface);
}

.result-header {
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-16) var(--spacing-24);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-header h3 {
  margin: 0;
  font-size: var(--font-size-title-3);
  font-weight: var(--font-weight-semibold);
}

.result-summary {
  font-size: var(--font-size-callout);
  font-weight: var(--font-weight-semibold);
}

.result-details {
  padding: var(--spacing-24);
  background-color: var(--color-surface);
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-16) 0;
  border-bottom: 1px solid var(--color-border);
}

.result-row:last-child {
  border-bottom: none;
}

.result-label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-subhead);
}

.result-value {
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
}

.exact-match {
  font-size: var(--font-size-caption);
  color: var(--color-success);
  margin-left: var(--spacing-8);
  font-style: italic;
}

.calculation {
  margin-top: var(--spacing-16);
  padding-top: var(--spacing-16);
  border-top: 2px solid var(--color-border);
  font-weight: var(--font-weight-semibold);
}

.calculation .result-value {
  color: var(--color-primary);
}

/* Calculation Method Styles */
.calculation-method {
  margin-top: var(--spacing-24);
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  box-shadow: var(--shadow-small);
}

.calculation-method-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-16);
  background-color: rgba(0, 0, 0, 0.02);
  cursor: pointer;
  user-select: none;
}

.calculation-method-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  flex-grow: 1;
  font-size: var(--font-size-subhead);
}

.calculation-method-badge {
  padding: var(--spacing-4) var(--spacing-8);
  border-radius: var(--border-radius-pill);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  margin-right: var(--spacing-8);
}

.calculation-method-badge.interpolated {
  background-color: rgba(255, 149, 0, 0.1);
  color: var(--color-warning);
}

.calculation-method-badge.exact {
  background-color: rgba(52, 199, 89, 0.1);
  color: var(--color-success);
}

.toggle-icon {
  font-size: var(--font-size-footnote);
  color: var(--color-text-secondary);
  margin-left: var(--spacing-8);
}

.calculation-details {
  padding: var(--spacing-16);
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.calculation-steps {
  margin-top: var(--spacing-8);
}

.calculation-steps h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-8);
  color: var(--color-text-primary);
  font-size: var(--font-size-subhead);
  font-weight: var(--font-weight-medium);
}

.calculation-steps ol {
  margin: 0;
  padding-left: var(--spacing-24);
}

.calculation-steps li {
  margin-bottom: var(--spacing-8);
  color: var(--color-text-secondary);
  line-height: 1.4;
  font-size: var(--font-size-footnote);
}

.calculation-steps li:last-child {
  margin-bottom: 0;
}
</style>
