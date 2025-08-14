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
  margin-bottom: 20px;
}

h2 {
  margin-bottom: 10px;
  color: #333;
}

.loading {
  font-style: italic;
  color: #666;
}

.tank-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  background-color: white;
}

.tank-select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
}
</style>
