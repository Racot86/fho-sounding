// Test script to verify the fix for negative volume calculation

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Linear interpolation function
const linearInterpolate = (x0, y0, x1, y1, x) => {
  if (x0 === x1) return y0;
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
};

// Function to load specific tank data
async function loadTankData(tankFileName) {
  try {
    const filePath = path.join(__dirname, 'tank_data', tankFileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (err) {
    console.error(`Error loading tank data:`, err);
    return null;
  }
}

// Function to simulate volume calculation with the fix for negative volumes
function calculateVolume(tankData, tankName, inputType, value, trim, heel, heelDirection) {
  try {
    console.log(`\nCalculating volume for tank: ${tankName}`);
    console.log(`Input type: ${inputType}, Value: ${value}, Trim: ${trim}, Heel: ${heel}, Direction: ${heelDirection}`);

    // Check if tank exists in the data
    if (!tankData[tankName]) {
      console.error(`Tank "${tankName}" not found in tank data`);
      return { error: `Tank "${tankName}" not found in tank data` };
    }

    const tankDataObj = tankData[tankName];

    // Get all available values for the selected input type
    const lookupKey = inputType === 'sounding' ? 'GAUG' : 'ULL';
    const availableEntries = Object.entries(tankDataObj).filter(([_, entry]) => entry[lookupKey] !== undefined);

    if (availableEntries.length === 0) {
      console.error(`No entries found with ${lookupKey} key`);
      return { error: `No entries found with ${lookupKey} key` };
    }

    // Map to get the actual values for the selected key
    const availableValues = availableEntries.map(([key, entry]) => ({
      key,
      value: entry[lookupKey]
    }));

    // Sort by the lookup value
    availableValues.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

    // Find the closest values for interpolation
    let lowerEntry, upperEntry;

    // Check for exact match
    const exactMatch = availableValues.find(entry => parseFloat(entry.value) === parseFloat(value));
    if (exactMatch) {
      lowerEntry = exactMatch;
      upperEntry = exactMatch;
    }
    // If input value is less than the smallest available value
    else if (parseFloat(value) < parseFloat(availableValues[0].value)) {
      lowerEntry = availableValues[0];
      upperEntry = availableValues[1];
    }
    // If input value is greater than the largest available value
    else if (parseFloat(value) > parseFloat(availableValues[availableValues.length - 1].value)) {
      lowerEntry = availableValues[availableValues.length - 2];
      upperEntry = availableValues[availableValues.length - 1];
    }
    // Find the closest values
    else {
      for (let i = 0; i < availableValues.length - 1; i++) {
        if (parseFloat(availableValues[i].value) <= parseFloat(value) &&
            parseFloat(value) <= parseFloat(availableValues[i + 1].value)) {
          lowerEntry = availableValues[i];
          upperEntry = availableValues[i + 1];
          break;
        }
      }
    }

    if (!lowerEntry || !upperEntry) {
      console.error('Could not find appropriate entries for interpolation');
      return { error: 'Could not find appropriate entries for interpolation' };
    }

    // Get the keys for the tank data entries
    const lowerValue = lowerEntry.key;
    const upperValue = upperEntry.key;

    // Get the data for these values
    const lowerData = tankDataObj[lowerValue].data;
    const upperData = tankDataObj[upperValue].data;

    if (!lowerData || !upperData) {
      console.error('Missing data for interpolation entries');
      return { error: 'Missing data for interpolation entries' };
    }

    // Find the closest trim values
    const availableTrimKeys = Object.keys(lowerData).filter(key => key.startsWith('tr='));

    // Extract trim values from keys
    const trimValues = availableTrimKeys.map(key => parseFloat(key.replace('tr=', '')));

    // Check for exact trim match
    const exactTrimMatch = trimValues.find(t => parseFloat(t) === parseFloat(trim));
    let lowerTrim, upperTrim;

    if (exactTrimMatch !== undefined) {
      lowerTrim = exactTrimMatch;
      upperTrim = exactTrimMatch;
    } else {
      // Find the closest values
      trimValues.sort((a, b) => a - b);

      if (parseFloat(trim) <= trimValues[0]) {
        lowerTrim = trimValues[0];
        upperTrim = trimValues[1];
      } else if (parseFloat(trim) >= trimValues[trimValues.length - 1]) {
        lowerTrim = trimValues[trimValues.length - 2];
        upperTrim = trimValues[trimValues.length - 1];
      } else {
        for (let i = 0; i < trimValues.length - 1; i++) {
          if (trimValues[i] <= parseFloat(trim) && parseFloat(trim) <= trimValues[i + 1]) {
            lowerTrim = trimValues[i];
            upperTrim = trimValues[i + 1];
            break;
          }
        }
      }
    }

    const lowerTrimKey = `tr=${lowerTrim}`;
    const upperTrimKey = `tr=${upperTrim}`;

    // Get the volumes at the lower and upper sounding/ullage values for the lower trim
    const lowerSULowerTrimVolume = parseFloat(lowerData[lowerTrimKey]);
    const upperSULowerTrimVolume = parseFloat(upperData[lowerTrimKey]);

    // Get the volumes at the lower and upper sounding/ullage values for the upper trim
    const lowerSUUpperTrimVolume = parseFloat(lowerData[upperTrimKey]);
    const upperSUUpperTrimVolume = parseFloat(upperData[upperTrimKey]);

    // Get the actual GAUG/ULL values for interpolation
    const lowerLookupValue = parseFloat(tankDataObj[lowerValue][lookupKey]);
    const upperLookupValue = parseFloat(tankDataObj[upperValue][lookupKey]);

    // Interpolate along the sounding/ullage dimension for the lower trim
    let interpolatedLowerTrimVolume;
    if (lowerEntry === upperEntry) {
      interpolatedLowerTrimVolume = lowerSULowerTrimVolume;
    } else {
      interpolatedLowerTrimVolume = linearInterpolate(
        lowerLookupValue,
        lowerSULowerTrimVolume,
        upperLookupValue,
        upperSULowerTrimVolume,
        parseFloat(value)
      );
    }

    // Interpolate along the sounding/ullage dimension for the upper trim
    let interpolatedUpperTrimVolume;
    if (lowerEntry === upperEntry) {
      interpolatedUpperTrimVolume = lowerSUUpperTrimVolume;
    } else {
      interpolatedUpperTrimVolume = linearInterpolate(
        lowerLookupValue,
        lowerSUUpperTrimVolume,
        upperLookupValue,
        upperSUUpperTrimVolume,
        parseFloat(value)
      );
    }

    // Now interpolate along the trim dimension
    let finalNetVolume;
    if (lowerTrim === upperTrim) {
      finalNetVolume = interpolatedLowerTrimVolume;
    } else {
      finalNetVolume = linearInterpolate(
        lowerTrim,
        interpolatedLowerTrimVolume,
        upperTrim,
        interpolatedUpperTrimVolume,
        parseFloat(trim)
      );
    }

    // Handle heel correction
    let heelCorrection = 0;

    if (parseFloat(heel) > 0) {
      // Determine the heel keys based on direction
      const heelSuffix = heelDirection === 'port' ? 'P' : 'S';

      // Check for exact heel match
      const heelValues = [1, 2, 3]; // Available heel values in the data
      const exactHeelMatch = heelValues.find(h => parseFloat(h) === parseFloat(heel));

      if (exactHeelMatch !== undefined) {
        // Exact heel match, but still need to interpolate for sounding/ullage
        const exactHeelKey = `HC${exactHeelMatch}${heelSuffix}`;

        if (lowerData[exactHeelKey] && upperData[exactHeelKey]) {
          const lowerHeelCorrection = parseFloat(lowerData[exactHeelKey]);
          const upperHeelCorrection = parseFloat(upperData[exactHeelKey]);

          if (lowerEntry === upperEntry) {
            heelCorrection = lowerHeelCorrection;
          } else {
            heelCorrection = linearInterpolate(
              lowerLookupValue,
              lowerHeelCorrection,
              upperLookupValue,
              upperHeelCorrection,
              parseFloat(value)
            );
          }
        }
      } else {
        // Fractional heel value, need to perform 3D interpolation
        const lowerHeelValue = Math.floor(parseFloat(heel));
        const upperHeelValue = Math.ceil(parseFloat(heel));

        const lowerHeelKey = `HC${lowerHeelValue}${heelSuffix}`;
        const upperHeelKey = `HC${upperHeelValue}${heelSuffix}`;

        if (lowerData[lowerHeelKey] && lowerData[upperHeelKey] &&
            upperData[lowerHeelKey] && upperData[upperHeelKey]) {

          // Interpolate heel correction for the lower sounding/ullage value
          const lowerSULowerHeelCorr = parseFloat(lowerData[lowerHeelKey]);
          const lowerSUUpperHeelCorr = parseFloat(lowerData[upperHeelKey]);

          let interpolatedLowerSUHeelCorr = linearInterpolate(
            lowerHeelValue,
            lowerSULowerHeelCorr,
            upperHeelValue,
            lowerSUUpperHeelCorr,
            parseFloat(heel)
          );

          // Interpolate heel correction for the upper sounding/ullage value
          const upperSULowerHeelCorr = parseFloat(upperData[lowerHeelKey]);
          const upperSUUpperHeelCorr = parseFloat(upperData[upperHeelKey]);

          let interpolatedUpperSUHeelCorr = linearInterpolate(
            lowerHeelValue,
            upperSULowerHeelCorr,
            upperHeelValue,
            upperSUUpperHeelCorr,
            parseFloat(heel)
          );

          // Interpolate along the sounding/ullage dimension
          if (lowerEntry === upperEntry) {
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
        }
      }
    }

    // Calculate final volume
    const finalVolume = finalNetVolume + heelCorrection;
    console.log(`Final volume calculation: ${finalNetVolume.toFixed(2)} + ${heelCorrection.toFixed(2)} = ${finalVolume.toFixed(2)}`);

    // Validate the final volume (THIS IS THE FIX WE IMPLEMENTED)
    if (finalVolume < 0) {
      const errorMessage = 'Invalid volume calculation result. The calculated volume is negative. Please check your inputs.';
      console.error(errorMessage);
      return { error: errorMessage };
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
      netVolume: finalNetVolume.toFixed(2),
      heelCorrection: heelCorrection.toFixed(2),
      totalVolume: finalVolume.toFixed(2)
    };
  } catch (error) {
    console.error('Calculation error:', error);
    return { error: 'Error calculating volume. Please check your inputs.' };
  }
}

// Main function
async function main() {
  // Load tank data for WASTE OIL TK.
  const tankData = await loadTankData('WASTE OIL TK..json');

  if (!tankData) {
    console.error('Failed to load tank data');
    return;
  }

  const tankName = 'WASTE OIL TK.';

  // Test cases with different ullage values
  const testCases = [
    {
      inputType: 'ullage',
      value: '600',  // A value that should result in a negative volume
      trim: 0,
      heel: 0,
      heelDirection: 'port',
      expectedResult: 'error'  // We expect an error for this case
    },
    {
      inputType: 'ullage',
      value: '100',  // A value that should be valid
      trim: 0,
      heel: 0,
      heelDirection: 'port',
      expectedResult: 'success'  // We expect success for this case
    }
  ];

  // Run test cases
  for (const testCase of testCases) {
    console.log(`\n========== TEST CASE: ${testCase.inputType} = ${testCase.value} ==========`);
    const result = calculateVolume(
      tankData,
      tankName,
      testCase.inputType,
      testCase.value,
      testCase.trim,
      testCase.heel,
      testCase.heelDirection
    );

    if (result.error) {
      console.log(`Result: Error - ${result.error}`);
      if (testCase.expectedResult === 'error') {
        console.log('✅ Test passed: Expected an error and got one');
      } else {
        console.log('❌ Test failed: Expected success but got an error');
      }
    } else {
      console.log(`Result: Success - Volume = ${result.totalVolume}`);
      if (testCase.expectedResult === 'success') {
        console.log('✅ Test passed: Expected success and got it');
      } else {
        console.log('❌ Test failed: Expected an error but got success');
      }
    }
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
});
