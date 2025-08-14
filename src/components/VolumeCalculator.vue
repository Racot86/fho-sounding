<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  selectedTank: String,
  tankData: Object
});

const emit = defineEmits(['calculation-result']);

// Input values
const inputType = ref('sounding'); // 'sounding' or 'ullage'
const soundingValue = ref('');
const ullageValue = ref('');
const trimValue = ref(0);
const heelValue = ref(0);
const heelDirection = ref('port'); // 'port' or 'starboard'

// Calculation results
const calculationResult = ref(null);
const calculationError = ref('');
const isCalculating = ref(false);

// Reset inputs when tank changes
watch(() => props.selectedTank, () => {
  soundingValue.value = '';
  ullageValue.value = '';
  trimValue.value = 0;
  heelValue.value = 0;
  heelDirection.value = 'port';
  calculationResult.value = null;
  calculationError.value = '';
});

// Helper function to find the closest values in an array
const findClosestValues = (arr, target) => {
  // Sort the array numerically
  const sortedArr = [...arr].sort((a, b) => parseFloat(a) - parseFloat(b));

  // If target is less than the smallest value, return the two smallest values
  if (parseFloat(target) <= parseFloat(sortedArr[0])) {
    return [sortedArr[0], sortedArr[1]];
  }

  // If target is greater than the largest value, return the two largest values
  if (parseFloat(target) >= parseFloat(sortedArr[sortedArr.length - 1])) {
    return [sortedArr[sortedArr.length - 2], sortedArr[sortedArr.length - 1]];
  }

  // Find the closest values
  for (let i = 0; i < sortedArr.length - 1; i++) {
    if (parseFloat(sortedArr[i]) <= parseFloat(target) && parseFloat(target) <= parseFloat(sortedArr[i + 1])) {
      return [sortedArr[i], sortedArr[i + 1]];
    }
  }

  // Fallback
  return [sortedArr[0], sortedArr[1]];
};

// Linear interpolation function
const linearInterpolate = (x0, y0, x1, y1, x) => {
  if (x0 === x1) return y0;
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
};

// Calculate volume based on inputs
const calculateVolume = () => {
  if (!props.selectedTank || !props.tankData) {
    calculationError.value = 'Please select a tank first';
    return;
  }

  isCalculating.value = true;
  calculationError.value = '';
  calculationResult.value = null;

  try {
    let tankDataObj = props.tankData[props.selectedTank];

    // If tankDataObj is null or undefined, try to find a matching key with a trailing period
    if (!tankDataObj) {
      // Look for a key that matches the selectedTank with a trailing period
      const matchingKey = Object.keys(props.tankData).find(key =>
        key === `${props.selectedTank}.` || // Exact match with trailing period
        key.toLowerCase() === props.selectedTank.toLowerCase() || // Case-insensitive match
        key.toLowerCase() === `${props.selectedTank.toLowerCase()}.` // Case-insensitive match with trailing period
      );

      if (matchingKey) {
        tankDataObj = props.tankData[matchingKey];
        console.log(`Found matching tank data for "${props.selectedTank}" using key "${matchingKey}"`);
      } else {
        calculationError.value = `Tank data not found for "${props.selectedTank}". Please select a different tank.`;
        isCalculating.value = false;
        return;
      }
    }

    // Determine which value to use (sounding or ullage)
    const value = inputType.value === 'sounding' ? soundingValue.value : ullageValue.value;
    if (!value) {
      calculationError.value = `Please enter a ${inputType.value} value`;
      isCalculating.value = false;
      return;
    }

    // Create an object to store calculation details for display
    const calculationDetails = {
      isExactMatch: {
        sounding_ullage: false,
        trim: false,
        heel: false
      },
      interpolation: {
        sounding_ullage: null,
        trim: null,
        heel: null
      },
      steps: []
    };

    // IMPORTANT: Use the correct key based on input type
    // For sounding input, we use the "GAUG" key in the tank data
    // For ullage input, we use the "ULL" key in the tank data
    // This ensures that we get different values for sounding vs ullage
    const lookupKey = inputType.value === 'sounding' ? 'GAUG' : 'ULL';

    // Get all available values and filter for entries that have the correct key
    const availableEntries = Object.entries(tankDataObj).filter(([_, entry]) => entry[lookupKey] !== undefined);

    // Map to get the actual values for the selected key
    const availableValues = availableEntries.map(([key, entry]) => ({
      key,
      value: entry[lookupKey]
    }));

    // Sort by the lookup value
    availableValues.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

    // Find the closest values for interpolation based on the input value
    let lowerEntry, upperEntry;

    // IMPORTANT: Check for exact match first
    // This is crucial for accuracy when the input value exactly matches a value in the data
    // Without this check, the application would interpolate between the exact match and the next value,
    // which would give an incorrect result (e.g., for ullage 477, it would return 465.54 instead of 464.98)
    const exactMatch = availableValues.find(entry => parseFloat(entry.value) === parseFloat(value));
    if (exactMatch) {
      // If we have an exact match, use it for both lower and upper entries
      // This will result in no interpolation (returning the exact value)
      // The linearInterpolate function will return y0 when x0 === x1
      lowerEntry = exactMatch;
      upperEntry = exactMatch;
      calculationDetails.isExactMatch.sounding_ullage = true;
      calculationDetails.steps.push(`Exact match found for ${inputType.value} value ${value}: Entry ${exactMatch.key}`);
    }
    // If input value is less than the smallest available value
    else if (parseFloat(value) <= parseFloat(availableValues[0].value)) {
      lowerEntry = availableValues[0];
      upperEntry = availableValues[1];
      calculationDetails.steps.push(`${inputType.value} value ${value} is below the smallest available value ${lowerEntry.value}. Using entries ${lowerEntry.key} and ${upperEntry.key} for interpolation.`);
    }
    // If input value is greater than the largest available value
    else if (parseFloat(value) >= parseFloat(availableValues[availableValues.length - 1].value)) {
      lowerEntry = availableValues[availableValues.length - 2];
      upperEntry = availableValues[availableValues.length - 1];
      calculationDetails.steps.push(`${inputType.value} value ${value} is above the largest available value ${upperEntry.value}. Using entries ${lowerEntry.key} and ${upperEntry.key} for interpolation.`);
    }
    // Find the closest values
    else {
      for (let i = 0; i < availableValues.length - 1; i++) {
        if (parseFloat(availableValues[i].value) <= parseFloat(value) &&
            parseFloat(value) <= parseFloat(availableValues[i + 1].value)) {
          lowerEntry = availableValues[i];
          upperEntry = availableValues[i + 1];
          calculationDetails.steps.push(`${inputType.value} value ${value} is between ${lowerEntry.value} and ${upperEntry.value}. Using entries ${lowerEntry.key} and ${upperEntry.key} for interpolation.`);
          break;
        }
      }
    }

    // Get the keys for the tank data entries
    const lowerValue = lowerEntry.key;
    const upperValue = upperEntry.key;

    // Get the data for these values
    const lowerData = tankDataObj[lowerValue].data;
    const upperData = tankDataObj[upperValue].data;

    // Find the closest trim values
    const availableTrimKeys = Object.keys(lowerData).filter(key => key.startsWith('tr='));

    // Extract trim values from keys
    const trimValues = availableTrimKeys.map(key => parseFloat(key.replace('tr=', '')));

    // Check for exact trim match first
    const exactTrimMatch = trimValues.find(trim => parseFloat(trim) === parseFloat(trimValue.value));
    let lowerTrim, upperTrim;

    if (exactTrimMatch !== undefined) {
      lowerTrim = exactTrimMatch;
      upperTrim = exactTrimMatch;
      calculationDetails.isExactMatch.trim = true;
      calculationDetails.steps.push(`Exact match found for trim value ${trimValue.value}`);
    } else {
      [lowerTrim, upperTrim] = findClosestValues(trimValues, trimValue.value);
      calculationDetails.steps.push(`Trim value ${trimValue.value} is between ${lowerTrim} and ${upperTrim}. Will interpolate.`);
    }

    const lowerTrimKey = `tr=${lowerTrim}`;
    const upperTrimKey = `tr=${upperTrim}`;

    // STEP 1: First, we need to perform a 2D interpolation for sounding/ullage and trim

    // Get the volumes at the lower and upper sounding/ullage values for the lower trim
    const lowerSULowerTrimVolume = parseFloat(lowerData[lowerTrimKey]);
    const upperSULowerTrimVolume = parseFloat(upperData[lowerTrimKey]);

    // Get the volumes at the lower and upper sounding/ullage values for the upper trim
    const lowerSUUpperTrimVolume = parseFloat(lowerData[upperTrimKey]);
    const upperSUUpperTrimVolume = parseFloat(upperData[upperTrimKey]);

    // IMPORTANT: Get the actual GAUG/ULL values for interpolation
    // Instead of using the entry keys (which are just indices), we use the actual measurement values
    // This ensures correct interpolation based on the selected input type (sounding or ullage)
    const lowerLookupValue = parseFloat(tankDataObj[lowerValue][lookupKey]);
    const upperLookupValue = parseFloat(tankDataObj[upperValue][lookupKey]);

    // Interpolate along the sounding/ullage dimension for the lower trim
    let interpolatedLowerTrimVolume;
    if (calculationDetails.isExactMatch.sounding_ullage) {
      interpolatedLowerTrimVolume = lowerSULowerTrimVolume;
      calculationDetails.steps.push(`Using exact ${inputType.value} value: Volume at trim=${lowerTrim} is ${interpolatedLowerTrimVolume}`);
    } else {
      interpolatedLowerTrimVolume = linearInterpolate(
        lowerLookupValue,
        lowerSULowerTrimVolume,
        upperLookupValue,
        upperSULowerTrimVolume,
        parseFloat(value)
      );
      calculationDetails.interpolation.sounding_ullage = {
        x0: lowerLookupValue,
        y0: lowerSULowerTrimVolume,
        x1: upperLookupValue,
        y1: upperSULowerTrimVolume,
        x: parseFloat(value),
        result: interpolatedLowerTrimVolume
      };
      calculationDetails.steps.push(`Interpolated volume at trim=${lowerTrim}: ${interpolatedLowerTrimVolume.toFixed(2)}`);
    }

    // Interpolate along the sounding/ullage dimension for the upper trim
    let interpolatedUpperTrimVolume;
    if (calculationDetails.isExactMatch.sounding_ullage) {
      interpolatedUpperTrimVolume = lowerSUUpperTrimVolume;
    } else {
      interpolatedUpperTrimVolume = linearInterpolate(
        lowerLookupValue,
        lowerSUUpperTrimVolume,
        upperLookupValue,
        upperSUUpperTrimVolume,
        parseFloat(value)
      );
      calculationDetails.steps.push(`Interpolated volume at trim=${upperTrim}: ${interpolatedUpperTrimVolume.toFixed(2)}`);
    }

    // Now interpolate along the trim dimension
    let finalNetVolume;
    if (calculationDetails.isExactMatch.trim) {
      finalNetVolume = interpolatedLowerTrimVolume;
      calculationDetails.steps.push(`Using exact trim value: Final net volume is ${finalNetVolume.toFixed(2)}`);
    } else {
      finalNetVolume = linearInterpolate(
        lowerTrim,
        interpolatedLowerTrimVolume,
        upperTrim,
        interpolatedUpperTrimVolume,
        parseFloat(trimValue.value)
      );
      calculationDetails.interpolation.trim = {
        x0: lowerTrim,
        y0: interpolatedLowerTrimVolume,
        x1: upperTrim,
        y1: interpolatedUpperTrimVolume,
        x: parseFloat(trimValue.value),
        result: finalNetVolume
      };
      calculationDetails.steps.push(`Interpolated final net volume for trim=${trimValue.value}: ${finalNetVolume.toFixed(2)}`);
    }

    // STEP 2: Now handle heel correction with a similar approach
    let heelCorrection = 0;

    if (parseFloat(heelValue.value) > 0) {
      // Check for exact heel match first
      const heelValues = [1, 2, 3]; // Available heel values in the data
      const exactHeelMatch = heelValues.find(heel => parseFloat(heel) === parseFloat(heelValue.value));

      // Determine the heel keys based on direction
      const heelSuffix = heelDirection.value === 'port' ? 'P' : 'S';

      if (exactHeelMatch !== undefined) {
        // Exact heel match, but still need to interpolate for sounding/ullage
        calculationDetails.isExactMatch.heel = true;
        const exactHeelKey = `HC${exactHeelMatch}${heelSuffix}`;

        if (lowerData[exactHeelKey] && upperData[exactHeelKey]) {
          const lowerHeelCorrection = parseFloat(lowerData[exactHeelKey]);
          const upperHeelCorrection = parseFloat(upperData[exactHeelKey]);

          if (calculationDetails.isExactMatch.sounding_ullage) {
            heelCorrection = lowerHeelCorrection;
            calculationDetails.steps.push(`Using exact ${inputType.value} and heel values: Heel correction is ${heelCorrection.toFixed(2)}`);
          } else {
            heelCorrection = linearInterpolate(
              lowerLookupValue,
              lowerHeelCorrection,
              upperLookupValue,
              upperHeelCorrection,
              parseFloat(value)
            );
            calculationDetails.steps.push(`Interpolated heel correction for exact heel=${heelValue.value}${heelSuffix}: ${heelCorrection.toFixed(2)}`);
          }
        }
      } else {
        // Fractional heel value, need to perform 3D interpolation
        const lowerHeelValue = Math.floor(parseFloat(heelValue.value));
        const upperHeelValue = Math.ceil(parseFloat(heelValue.value));

        const lowerHeelKey = `HC${lowerHeelValue}${heelSuffix}`;
        const upperHeelKey = `HC${upperHeelValue}${heelSuffix}`;

        if (lowerData[lowerHeelKey] && lowerData[upperHeelKey] &&
            upperData[lowerHeelKey] && upperData[upperHeelKey]) {

          // STEP 2.1: Interpolate heel correction for the lower sounding/ullage value
          const lowerSULowerHeelCorr = parseFloat(lowerData[lowerHeelKey]);
          const lowerSUUpperHeelCorr = parseFloat(lowerData[upperHeelKey]);

          let interpolatedLowerSUHeelCorr;
          interpolatedLowerSUHeelCorr = linearInterpolate(
            lowerHeelValue,
            lowerSULowerHeelCorr,
            upperHeelValue,
            lowerSUUpperHeelCorr,
            parseFloat(heelValue.value)
          );
          calculationDetails.steps.push(`Interpolated heel correction at lower ${inputType.value} for heel=${heelValue.value}${heelSuffix}: ${interpolatedLowerSUHeelCorr.toFixed(2)}`);

          // STEP 2.2: Interpolate heel correction for the upper sounding/ullage value
          const upperSULowerHeelCorr = parseFloat(upperData[lowerHeelKey]);
          const upperSUUpperHeelCorr = parseFloat(upperData[upperHeelKey]);

          let interpolatedUpperSUHeelCorr;
          interpolatedUpperSUHeelCorr = linearInterpolate(
            lowerHeelValue,
            upperSULowerHeelCorr,
            upperHeelValue,
            upperSUUpperHeelCorr,
            parseFloat(heelValue.value)
          );
          calculationDetails.steps.push(`Interpolated heel correction at upper ${inputType.value} for heel=${heelValue.value}${heelSuffix}: ${interpolatedUpperSUHeelCorr.toFixed(2)}`);

          // STEP 2.3: Interpolate along the sounding/ullage dimension
          if (calculationDetails.isExactMatch.sounding_ullage) {
            heelCorrection = interpolatedLowerSUHeelCorr;
          } else {
            heelCorrection = linearInterpolate(
              lowerLookupValue,
              interpolatedLowerSUHeelCorr,
              upperLookupValue,
              interpolatedUpperSUHeelCorr,
              parseFloat(value)
            );
          }

          calculationDetails.interpolation.heel = {
            heel_values: [lowerHeelValue, upperHeelValue],
            sounding_ullage_values: [lowerLookupValue, upperLookupValue],
            result: heelCorrection
          };

          calculationDetails.steps.push(`Final interpolated heel correction for heel=${heelValue.value}${heelSuffix}: ${heelCorrection.toFixed(2)}`);
        }
      }
    } else {
      calculationDetails.steps.push(`No heel correction needed (heel value is 0)`);
    }

    // Calculate final volume
    const finalVolume = finalNetVolume + heelCorrection;
    calculationDetails.steps.push(`Final volume calculation: ${finalNetVolume.toFixed(2)} + ${heelCorrection.toFixed(2)} = ${finalVolume.toFixed(2)}`);

    // Validate the final volume
    if (finalVolume < 0) {
      calculationError.value = 'Invalid volume calculation result. The calculated volume is negative. Please check your inputs.';
      return;
    }

    // Set the result
    calculationResult.value = {
      tank: props.selectedTank,
      inputType: inputType.value,
      inputValue: value,
      trim: trimValue.value,
      heel: {
        value: heelValue.value,
        direction: heelDirection.value
      },
      netVolume: finalNetVolume.toFixed(2),
      heelCorrection: heelCorrection.toFixed(2),
      totalVolume: finalVolume.toFixed(2),
      calculationDetails: calculationDetails,
      isInterpolated: !calculationDetails.isExactMatch.sounding_ullage ||
                      !calculationDetails.isExactMatch.trim ||
                      (parseFloat(heelValue.value) > 0 && !calculationDetails.isExactMatch.heel)
    };

    // Emit the result
    emit('calculation-result', calculationResult.value);
  } catch (error) {
    console.error('Calculation error:', error);
    calculationError.value = 'Error calculating volume. Please check your inputs.';
  } finally {
    isCalculating.value = false;
  }
};

// Toggle between sounding and ullage input
const toggleInputType = () => {
  if (inputType.value === 'sounding') {
    inputType.value = 'ullage';
    soundingValue.value = '';
  } else {
    inputType.value = 'sounding';
    ullageValue.value = '';
  }
  calculationResult.value = null;
};
</script>

<template>
  <div class="volume-calculator">
    <h2>Volume Calculator</h2>

    <div v-if="!selectedTank" class="no-tank-selected">
      Please select a tank first
    </div>

    <div v-else class="calculator-form">
      <!-- Input Type Toggle -->
      <div class="input-group">
        <label>Input Type</label>
        <div class="segmented-control">
          <button
            :class="{ active: inputType === 'sounding' }"
            @click="toggleInputType"
            type="button"
          >
            Sounding (GAUGE)
          </button>
          <button
            :class="{ active: inputType === 'ullage' }"
            @click="toggleInputType"
            type="button"
          >
            Ullage (ULL)
          </button>
        </div>
      </div>

      <!-- Sounding/Ullage Input -->
      <div class="input-group" v-if="inputType === 'sounding'">
        <label for="sounding">Sounding (cm)</label>
        <input
          id="sounding"
          v-model="soundingValue"
          type="number"
          min="0"
          step="0.1"
          placeholder="Enter sounding value"
        />
      </div>

      <div class="input-group" v-else>
        <label for="ullage">Ullage (cm)</label>
        <input
          id="ullage"
          v-model="ullageValue"
          type="number"
          min="0"
          step="0.1"
          placeholder="Enter ullage value"
        />
      </div>

      <!-- Trim Input -->
      <div class="input-group">
        <label for="trim">Trim (m)</label>
        <input
          id="trim"
          v-model="trimValue"
          type="number"
          step="0.1"
          placeholder="Enter trim value"
        />
        <small>Positive: by stern, Negative: by bow</small>
      </div>

      <!-- Heel Input -->
      <div class="input-group">
        <label for="heel">Heel (degrees)</label>
        <div class="heel-inputs">
          <input
            id="heel"
            v-model="heelValue"
            type="number"
            min="0"
            step="0.1"
            placeholder="Enter heel value"
          />
          <select v-model="heelDirection" class="direction-select">
            <option value="port">Port (P)</option>
            <option value="starboard">Starboard (S)</option>
          </select>
        </div>
      </div>

      <!-- Calculate Button -->
      <div class="button-group">
        <button
          @click="calculateVolume"
          :disabled="isCalculating || !selectedTank"
          class="calculate-button"
        >
          {{ isCalculating ? 'Calculating...' : 'Calculate Volume' }}
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="calculationError" class="error-message">
        {{ calculationError }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.volume-calculator {
  margin-bottom: var(--spacing-24);
  padding: var(--spacing-24);
  border-radius: var(--border-radius-large);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-small);
}

h2 {
  margin-bottom: var(--spacing-16);
  color: var(--color-text-primary);
  font-size: var(--font-size-title-3);
  font-weight: var(--font-weight-semibold);
}

.no-tank-selected {
  font-style: italic;
  color: var(--color-text-secondary);
  margin: var(--spacing-24) 0;
  font-size: var(--font-size-callout);
}

.calculator-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-24);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.input-group label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-subhead);
}

.input-group input, .input-group select {
  padding: var(--spacing-16);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-medium);
  font-size: var(--font-size-body);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  transition: all 0.2s ease;
}

.input-group input:focus, .input-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(142, 142, 147, 0.1);
}

.input-group small {
  font-size: var(--font-size-footnote);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-4);
}

.heel-inputs {
  display: flex;
  gap: var(--spacing-16);
}

.heel-inputs input {
  flex: 1;
}

.direction-select {
  width: 150px;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2386868B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right var(--spacing-16) center;
  background-size: 16px;
  padding-right: var(--spacing-48);
}

.segmented-control {
  display: flex;
  border-radius: var(--border-radius-pill);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
}

.segmented-control button {
  flex: 1;
  padding: var(--spacing-8) var(--spacing-16);
  border: none;
  border-radius: 0;
  background-color: transparent;
  color: var(--color-text-primary);
  font-size: var(--font-size-callout);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.segmented-control button:first-child {
  border-right: 1px solid var(--color-border);
}

.segmented-control button.active {
  background-color: var(--color-primary);
  color: white;
}

.button-group {
  margin-top: var(--spacing-16);
}

.calculate-button {
  width: 100%;
  padding: var(--spacing-16);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-pill);
  font-size: var(--font-size-callout);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.calculate-button:hover {
  opacity: 0.9;
}

.calculate-button:disabled {
  background-color: var(--color-border);
  color: var(--color-text-secondary);
  cursor: not-allowed;
  opacity: 0.7;
}

.error-message {
  color: var(--color-error);
  margin-top: var(--spacing-16);
  font-size: var(--font-size-callout);
  padding: var(--spacing-16);
  background-color: rgba(255, 59, 48, 0.1);
  border-radius: var(--border-radius-medium);
}
</style>
