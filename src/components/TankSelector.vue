<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  selectedTank: String,
  availableTanks: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:selectedTank']);

const tanks = ref([]);
const loading = ref(true);

// Watch for changes in availableTanks prop
watch(() => props.availableTanks, (newTanks) => {
  console.log('TankSelector - availableTanks changed:', newTanks);
  if (newTanks && newTanks.length > 0) {
    tanks.value = newTanks;
    console.log('TankSelector - tanks updated:', tanks.value);
    loading.value = false;
  }
}, { immediate: true });

// Fallback to hardcoded list if availableTanks is empty
onMounted(async () => {
  if (props.availableTanks && props.availableTanks.length > 0) {
    tanks.value = props.availableTanks;
    loading.value = false;
  } else {
    try {
      // In a real application, we would fetch this from an API
      // For this demo, we'll hardcode the tank names as a fallback
      // Make sure these match the format of the tank names extracted by the extractTankName function in App.vue
      tanks.value = [
        'E L.O.SUMP.TK',
        'F.O. DRAIN TK',
        'F.O. OVERFLOW TK',
        'M.G.O.SERV.TK',
        'M.G.O.TK.(P)',
        'M.G.O.TK.(S)',
        'NO.1 V.L.S.F.O.TK.(P)',
        'NO.1 V.L.S.F.O.TK.(S)',
        'NO.2 V.L.S.F.O.TK.(P)',
        'NO.2 V.L.S.F.O.TK.(S)',
        'NO.3 V.L.S.F.O.TK.(P)',
        'NO.3 V.L.S.F.O.TK.(S)',
        'NO.4 U.L.S.F.O.TK.(P)',
        'NO.4 U.L.S.F.O.TK.(S)',
        'SLUDGE TK',
        'WASTE OIL TK'
      ];
      console.log('TankSelector - fallback tanks list:', tanks.value);
      loading.value = false;
    } catch (error) {
      console.error('Error loading tanks:', error);
      loading.value = false;
    }
  }
});

const selectTank = (tank) => {
  emit('update:selectedTank', tank);
};
</script>

<template>
  <div class="tank-selector">
    <h2>Select Tank</h2>
    <div v-if="loading" class="loading">Loading tanks...</div>
    <div v-else class="tank-list">
      <select
        :value="selectedTank"
        @change="selectTank($event.target.value)"
        class="tank-select"
      >
        <option value="" disabled selected>Select a tank</option>
        <option v-for="tank in tanks" :key="tank" :value="tank">
          {{ tank }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.tank-selector {
  margin-bottom: var(--spacing-24);
}

h2 {
  margin-bottom: var(--spacing-16);
  color: var(--color-text-primary);
  font-size: var(--font-size-title-3);
  font-weight: var(--font-weight-semibold);
}

.loading {
  font-style: italic;
  color: var(--color-text-secondary);
  font-size: var(--font-size-callout);
}

.tank-list {
  position: relative;
}

.tank-select {
  width: 100%;
  padding: var(--spacing-16);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-medium);
  font-size: var(--font-size-body);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2386868B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right var(--spacing-16) center;
  background-size: 16px;
  padding-right: var(--spacing-48);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tank-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(142, 142, 147, 0.1);
}

.tank-select option {
  padding: var(--spacing-8);
  font-size: var(--font-size-body);
}
</style>
