// Test script to verify the fix for tank key mismatch

// Simulate the tank data object with keys that include trailing periods
const tankData = {
  "COOLING WATER DRAIN TK.": {
    "0": {
      "GAUG": "0",
      "ULL": "586",
      "data": {
        "tr=0": "0.04",
        "tr=-0.5": "0.04",
        "HC3P": "0.00",
        "HC2P": "0.00",
        "HC1P": "0.00"
      }
    },
    "2": {
      "GAUG": "2",
      "ULL": "584",
      "data": {
        "tr=0": "0.06",
        "tr=-0.5": "0.07",
        "HC3P": "-0.01",
        "HC2P": "-0.01",
        "HC1P": "0.00"
      }
    }
  },
  "WASTE OIL TK.": {
    "0": {
      "GAUG": "0",
      "ULL": "579",
      "data": {
        "tr=0": "0.04",
        "tr=-0.5": "0.04",
        "HC3P": "0.00",
        "HC2P": "0.00",
        "HC1P": "0.00"
      }
    },
    "2": {
      "GAUG": "2",
      "ULL": "577",
      "data": {
        "tr=0": "0.05",
        "tr=-0.5": "0.05",
        "HC3P": "0.00",
        "HC2P": "0.00",
        "HC1P": "0.00"
      }
    }
  }
};

// Simulate the calculateVolume function with the fix
function calculateVolume(selectedTank, tankData) {
  try {
    console.log(`Calculating volume for tank: ${selectedTank}`);

    // Get the tank data for the selected tank
    let tankDataObj = tankData[selectedTank];

    // If tankDataObj is null or undefined, try to find a matching key with a trailing period
    if (!tankDataObj) {
      console.log(`Tank data not found for "${selectedTank}" using direct lookup`);

      // Look for a key that matches the selectedTank with a trailing period
      const matchingKey = Object.keys(tankData).find(key =>
        key === `${selectedTank}.` || // Exact match with trailing period
        key.toLowerCase() === selectedTank.toLowerCase() || // Case-insensitive match
        key.toLowerCase() === `${selectedTank.toLowerCase()}.` // Case-insensitive match with trailing period
      );

      if (matchingKey) {
        tankDataObj = tankData[matchingKey];
        console.log(`Found matching tank data for "${selectedTank}" using key "${matchingKey}"`);
      } else {
        console.error(`Tank data not found for "${selectedTank}". Please select a different tank.`);
        return null;
      }
    }

    // If we get here, tankDataObj is not null or undefined
    console.log(`Successfully found tank data for "${selectedTank}"`);

    // Try to use Object.entries on tankDataObj
    const entries = Object.entries(tankDataObj);
    console.log(`Found ${entries.length} entries in tank data`);

    // Return success
    return {
      success: true,
      message: `Successfully calculated volume for tank: ${selectedTank}`
    };
  } catch (error) {
    console.error(`Error calculating volume: ${error.message}`);
    return {
      success: false,
      message: `Error calculating volume: ${error.message}`
    };
  }
}

// Test cases
const testCases = [
  "COOLING WATER DRAIN TK", // Without trailing period
  "COOLING WATER DRAIN TK.", // With trailing period
  "cooling water drain tk", // Lowercase
  "WASTE OIL TK", // Without trailing period
  "WASTE OIL TK.", // With trailing period
  "NON-EXISTENT TANK" // Tank that doesn't exist
];

// Run test cases
console.log("Running test cases...\n");
for (const testCase of testCases) {
  console.log(`\n=== Test Case: "${testCase}" ===`);
  const result = calculateVolume(testCase, tankData);
  if (result && result.success) {
    console.log(`✅ Test passed: ${result.message}`);
  } else {
    console.log(`❌ Test failed: ${result ? result.message : "No result returned"}`);
  }
}
