// Test script to reproduce the volume calculation error

// Load the tank data
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to load tank data
async function loadTankData() {
  const tankDataDir = path.join(__dirname, 'tank_data');
  const tankData = {};

  try {
    // Get all JSON files in the tank_data directory
    const files = fs.readdirSync(tankDataDir).filter(file => file.endsWith('.json'));

    console.log(`Found ${files.length} tank data files`);

    // Load each tank data file
    for (const file of files) {
      try {
        const filePath = path.join(tankDataDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Extract tank name from filename
        const tankName = file.replace('.json', '');

        // Log the structure of the data
        console.log(`\nFile: ${file}`);
        console.log(`Tank name: ${tankName}`);
        console.log(`Top-level keys: ${Object.keys(data)}`);

        // Method 1: Merge using spread operator
        // tankData = { ...tankData, ...data };

        // Method 2: Merge using Object.assign
        Object.assign(tankData, data);
      } catch (err) {
        console.error(`Error loading ${file}:`, err);
      }
    }

    return tankData;
  } catch (err) {
    console.error('Error loading tank data:', err);
    return null;
  }
}

// Function to simulate volume calculation
function calculateVolume(tankData, tankName, inputType, value, trim, heel, heelDirection) {
  try {
    console.log(`\nCalculating volume for tank: ${tankName}`);
    console.log(`Input type: ${inputType}, Value: ${value}, Trim: ${trim}, Heel: ${heel}, Direction: ${heelDirection}`);

    // Check if tank exists in the data
    if (!tankData[tankName]) {
      console.error(`Tank "${tankName}" not found in tank data`);
      console.log('Available tanks:', Object.keys(tankData));
      return null;
    }

    const tankDataObj = tankData[tankName];
    console.log(`Tank data object keys: ${Object.keys(tankDataObj)}`);

    // Get all available values for the selected input type
    const lookupKey = inputType === 'sounding' ? 'GAUG' : 'ULL';
    const availableEntries = Object.entries(tankDataObj).filter(([_, entry]) => entry[lookupKey] !== undefined);

    if (availableEntries.length === 0) {
      console.error(`No entries found with ${lookupKey} key`);
      return null;
    }

    console.log(`Found ${availableEntries.length} entries with ${lookupKey} key`);

    // Map to get the actual values for the selected key
    const availableValues = availableEntries.map(([key, entry]) => ({
      key,
      value: entry[lookupKey]
    }));

    // Sort by the lookup value
    availableValues.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

    console.log(`Available ${lookupKey} values:`, availableValues.map(entry => `${entry.key}: ${entry.value}`).join(', '));

    // Find the closest values for interpolation
    let lowerEntry, upperEntry;

    // Check for exact match
    const exactMatch = availableValues.find(entry => parseFloat(entry.value) === parseFloat(value));
    if (exactMatch) {
      console.log(`Exact match found for ${inputType} value ${value}: Entry ${exactMatch.key}`);
      lowerEntry = exactMatch;
      upperEntry = exactMatch;
    }
    // If input value is less than the smallest available value
    else if (parseFloat(value) <= parseFloat(availableValues[0].value)) {
      lowerEntry = availableValues[0];
      upperEntry = availableValues[1];
      console.log(`${inputType} value ${value} is below the smallest available value ${lowerEntry.value}. Using entries ${lowerEntry.key} and ${upperEntry.key} for interpolation.`);
    }
    // If input value is greater than the largest available value
    else if (parseFloat(value) >= parseFloat(availableValues[availableValues.length - 1].value)) {
      lowerEntry = availableValues[availableValues.length - 2];
      upperEntry = availableValues[availableValues.length - 1];
      console.log(`${inputType} value ${value} is above the largest available value ${upperEntry.value}. Using entries ${lowerEntry.key} and ${upperEntry.key} for interpolation.`);
    }
    // Find the closest values
    else {
      for (let i = 0; i < availableValues.length - 1; i++) {
        if (parseFloat(availableValues[i].value) <= parseFloat(value) &&
            parseFloat(value) <= parseFloat(availableValues[i + 1].value)) {
          lowerEntry = availableValues[i];
          upperEntry = availableValues[i + 1];
          console.log(`${inputType} value ${value} is between ${lowerEntry.value} and ${upperEntry.value}. Using entries ${lowerEntry.key} and ${upperEntry.key} for interpolation.`);
          break;
        }
      }
    }

    if (!lowerEntry || !upperEntry) {
      console.error('Could not find appropriate entries for interpolation');
      return null;
    }

    // Get the keys for the tank data entries
    const lowerValue = lowerEntry.key;
    const upperValue = upperEntry.key;

    // Get the data for these values
    const lowerData = tankDataObj[lowerValue].data;
    const upperData = tankDataObj[upperValue].data;

    if (!lowerData || !upperData) {
      console.error('Missing data for interpolation entries');
      console.log('Lower entry data:', lowerData);
      console.log('Upper entry data:', upperData);
      return null;
    }

    console.log('Calculation successful');
    return {
      tank: tankName,
      inputType,
      inputValue: value,
      trim,
      heel: {
        value: heel,
        direction: heelDirection
      },
      // For simplicity, we're not doing the actual interpolation here
      // Just checking if we can access the necessary data
      lowerEntry,
      upperEntry,
      lowerData,
      upperData
    };
  } catch (error) {
    console.error('Calculation error:', error);
    return null;
  }
}

// Main function
async function main() {
  // Load tank data
  const tankData = await loadTankData();

  if (!tankData) {
    console.error('Failed to load tank data');
    return;
  }

  console.log('\nAvailable tanks:', Object.keys(tankData));

  // Test cases
  const testCases = [
    {
      tankName: 'COOLING WATER DRAIN TK.',
      inputType: 'sounding',
      value: '100',
      trim: 0,
      heel: 0,
      heelDirection: 'port'
    },
    {
      tankName: 'WASTE OIL TK.',
      inputType: 'ullage',
      value: '200',
      trim: 0.5,
      heel: 1,
      heelDirection: 'starboard'
    }
  ];

  // Run test cases
  for (const testCase of testCases) {
    const result = calculateVolume(
      tankData,
      testCase.tankName,
      testCase.inputType,
      testCase.value,
      testCase.trim,
      testCase.heel,
      testCase.heelDirection
    );

    if (result) {
      console.log(`\nTest case for ${testCase.tankName} succeeded`);
    } else {
      console.error(`\nTest case for ${testCase.tankName} failed`);
    }
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
});
