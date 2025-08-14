// Focused test script for WASTE OIL TK. volume calculation

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

// Function to simulate volume calculation with detailed logging
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

    console.log(`Available ${lookupKey} values (sorted):`, availableValues.map(entry => `${entry.key}: ${entry.value}`).join(', '));

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
    else if (parseFloat(value) < parseFloat(availableValues[0].value)) {
      console.log(`${inputType} value ${value} is less than the smallest available value ${availableValues[0].value}`);
      lowerEntry = availableValues[0];
      upperEntry = availableValues[1];
      console.log(`Using entries ${lowerEntry.key} (${lowerEntry.value}) and ${upperEntry.key} (${upperEntry.value}) for interpolation.`);
    }
    // If input value is greater than the largest available value
    else if (parseFloat(value) > parseFloat(availableValues[availableValues.length - 1].value)) {
      console.log(`${inputType} value ${value} is greater than the largest available value ${availableValues[availableValues.length - 1].value}`);
      lowerEntry = availableValues[availableValues.length - 2];
      upperEntry = availableValues[availableValues.length - 1];
      console.log(`Using entries ${lowerEntry.key} (${lowerEntry.value}) and ${upperEntry.key} (${upperEntry.value}) for interpolation.`);
    }
    // Find the closest values
    else {
      for (let i = 0; i < availableValues.length - 1; i++) {
        if (parseFloat(availableValues[i].value) <= parseFloat(value) &&
            parseFloat(value) <= parseFloat(availableValues[i + 1].value)) {
          lowerEntry = availableValues[i];
          upperEntry = availableValues[i + 1];
          console.log(`${inputType} value ${value} is between ${lowerEntry.value} and ${upperEntry.value}`);
          console.log(`Using entries ${lowerEntry.key} (${lowerEntry.value}) and ${upperEntry.key} (${upperEntry.value}) for interpolation.`);
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

    // Find the closest trim values
    const availableTrimKeys = Object.keys(lowerData).filter(key => key.startsWith('tr='));

    // Extract trim values from keys
    const trimValues = availableTrimKeys.map(key => parseFloat(key.replace('tr=', '')));

    console.log(`Available trim values:`, trimValues);

    // Check for exact trim match
    const exactTrimMatch = trimValues.find(t => parseFloat(t) === parseFloat(trim));
    let lowerTrim, upperTrim;

    if (exactTrimMatch !== undefined) {
      console.log(`Exact match found for trim value ${trim}`);
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

      console.log(`Trim value ${trim} is between ${lowerTrim} and ${upperTrim}. Will interpolate.`);
    }

    const lowerTrimKey = `tr=${lowerTrim}`;
    const upperTrimKey = `tr=${upperTrim}`;

    // Get the volumes at the lower and upper sounding/ullage values for the lower trim
    const lowerSULowerTrimVolume = parseFloat(lowerData[lowerTrimKey]);
    const upperSULowerTrimVolume = parseFloat(upperData[lowerTrimKey]);

    // Get the volumes at the lower and upper sounding/ullage values for the upper trim
    const lowerSUUpperTrimVolume = parseFloat(lowerData[upperTrimKey]);
    const upperSUUpperTrimVolume = parseFloat(upperData[upperTrimKey]);

    console.log(`Volume values for interpolation:`);
    console.log(`Lower ${inputType}, Lower Trim: ${lowerSULowerTrimVolume}`);
    console.log(`Upper ${inputType}, Lower Trim: ${upperSULowerTrimVolume}`);
    console.log(`Lower ${inputType}, Upper Trim: ${lowerSUUpperTrimVolume}`);
    console.log(`Upper ${inputType}, Upper Trim: ${upperSUUpperTrimVolume}`);

    // Get the actual GAUG/ULL values for interpolation
    const lowerLookupValue = parseFloat(tankDataObj[lowerValue][lookupKey]);
    const upperLookupValue = parseFloat(tankDataObj[upperValue][lookupKey]);

    console.log(`Actual ${lookupKey} values for interpolation: ${lowerLookupValue} and ${upperLookupValue}`);

    // Interpolate along the sounding/ullage dimension for the lower trim
    let interpolatedLowerTrimVolume;
    if (lowerEntry === upperEntry) {
      interpolatedLowerTrimVolume = lowerSULowerTrimVolume;
      console.log(`Using exact ${inputType} value: Volume at trim=${lowerTrim} is ${interpolatedLowerTrimVolume}`);
    } else {
      try {
        interpolatedLowerTrimVolume = linearInterpolate(
          lowerLookupValue,
          lowerSULowerTrimVolume,
          upperLookupValue,
          upperSULowerTrimVolume,
          parseFloat(value)
        );
        console.log(`Interpolated volume at trim=${lowerTrim}: ${interpolatedLowerTrimVolume.toFixed(2)}`);
      } catch (error) {
        console.error(`Error interpolating volume for lower trim:`, error);
        return null;
      }
    }

    // Interpolate along the sounding/ullage dimension for the upper trim
    let interpolatedUpperTrimVolume;
    if (lowerEntry === upperEntry) {
      interpolatedUpperTrimVolume = lowerSUUpperTrimVolume;
    } else {
      try {
        interpolatedUpperTrimVolume = linearInterpolate(
          lowerLookupValue,
          lowerSUUpperTrimVolume,
          upperLookupValue,
          upperSUUpperTrimVolume,
          parseFloat(value)
        );
        console.log(`Interpolated volume at trim=${upperTrim}: ${interpolatedUpperTrimVolume.toFixed(2)}`);
      } catch (error) {
        console.error(`Error interpolating volume for upper trim:`, error);
        return null;
      }
    }

    // Now interpolate along the trim dimension
    let finalNetVolume;
    if (lowerTrim === upperTrim) {
      finalNetVolume = interpolatedLowerTrimVolume;
      console.log(`Using exact trim value: Final net volume is ${finalNetVolume.toFixed(2)}`);
    } else {
      try {
        finalNetVolume = linearInterpolate(
          lowerTrim,
          interpolatedLowerTrimVolume,
          upperTrim,
          interpolatedUpperTrimVolume,
          parseFloat(trim)
        );
        console.log(`Interpolated final net volume for trim=${trim}: ${finalNetVolume.toFixed(2)}`);
      } catch (error) {
        console.error(`Error interpolating final net volume:`, error);
        return null;
      }
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

          console.log(`Heel correction values for interpolation:`);
          console.log(`Lower ${inputType}, Heel=${heel}${heelSuffix}: ${lowerHeelCorrection}`);
          console.log(`Upper ${inputType}, Heel=${heel}${heelSuffix}: ${upperHeelCorrection}`);

          if (lowerEntry === upperEntry) {
            heelCorrection = lowerHeelCorrection;
            console.log(`Using exact ${inputType} and heel values: Heel correction is ${heelCorrection.toFixed(2)}`);
          } else {
            try {
              heelCorrection = linearInterpolate(
                lowerLookupValue,
                lowerHeelCorrection,
                upperLookupValue,
                upperHeelCorrection,
                parseFloat(value)
              );
              console.log(`Interpolated heel correction for exact heel=${heel}${heelSuffix}: ${heelCorrection.toFixed(2)}`);
            } catch (error) {
              console.error(`Error interpolating heel correction:`, error);
              return null;
            }
          }
        } else {
          console.error(`Missing heel correction data for heel=${heel}${heelSuffix}`);
          console.log(`Available keys in lower data:`, Object.keys(lowerData));
          console.log(`Available keys in upper data:`, Object.keys(upperData));
          return null;
        }
      } else {
        // Fractional heel value, need to perform 3D interpolation
        const lowerHeelValue = Math.floor(parseFloat(heel));
        const upperHeelValue = Math.ceil(parseFloat(heel));

        const lowerHeelKey = `HC${lowerHeelValue}${heelSuffix}`;
        const upperHeelKey = `HC${upperHeelValue}${heelSuffix}`;

        console.log(`Heel value ${heel} is between ${lowerHeelValue} and ${upperHeelValue}`);
        console.log(`Using heel keys ${lowerHeelKey} and ${upperHeelKey}`);

        if (lowerData[lowerHeelKey] && lowerData[upperHeelKey] &&
            upperData[lowerHeelKey] && upperData[upperHeelKey]) {

          // Interpolate heel correction for the lower sounding/ullage value
          const lowerSULowerHeelCorr = parseFloat(lowerData[lowerHeelKey]);
          const lowerSUUpperHeelCorr = parseFloat(lowerData[upperHeelKey]);

          console.log(`Heel correction values for interpolation:`);
          console.log(`Lower ${inputType}, Lower Heel: ${lowerSULowerHeelCorr}`);
          console.log(`Lower ${inputType}, Upper Heel: ${lowerSUUpperHeelCorr}`);

          let interpolatedLowerSUHeelCorr;
          try {
            interpolatedLowerSUHeelCorr = linearInterpolate(
              lowerHeelValue,
              lowerSULowerHeelCorr,
              upperHeelValue,
              lowerSUUpperHeelCorr,
              parseFloat(heel)
            );
            console.log(`Interpolated heel correction at lower ${inputType} for heel=${heel}${heelSuffix}: ${interpolatedLowerSUHeelCorr.toFixed(2)}`);
          } catch (error) {
            console.error(`Error interpolating heel correction for lower ${inputType}:`, error);
            return null;
          }

          // Interpolate heel correction for the upper sounding/ullage value
          const upperSULowerHeelCorr = parseFloat(upperData[lowerHeelKey]);
          const upperSUUpperHeelCorr = parseFloat(upperData[upperHeelKey]);

          console.log(`Upper ${inputType}, Lower Heel: ${upperSULowerHeelCorr}`);
          console.log(`Upper ${inputType}, Upper Heel: ${upperSUUpperHeelCorr}`);

          let interpolatedUpperSUHeelCorr;
          try {
            interpolatedUpperSUHeelCorr = linearInterpolate(
              lowerHeelValue,
              upperSULowerHeelCorr,
              upperHeelValue,
              upperSUUpperHeelCorr,
              parseFloat(heel)
            );
            console.log(`Interpolated heel correction at upper ${inputType} for heel=${heel}${heelSuffix}: ${interpolatedUpperSUHeelCorr.toFixed(2)}`);
          } catch (error) {
            console.error(`Error interpolating heel correction for upper ${inputType}:`, error);
            return null;
          }

          // Interpolate along the sounding/ullage dimension
          if (lowerEntry === upperEntry) {
            heelCorrection = interpolatedLowerSUHeelCorr;
          } else {
            try {
              heelCorrection = linearInterpolate(
                lowerLookupValue,
                interpolatedLowerSUHeelCorr,
                upperLookupValue,
                interpolatedUpperSUHeelCorr,
                parseFloat(value)
              );
              console.log(`Final interpolated heel correction for heel=${heel}${heelSuffix}: ${heelCorrection.toFixed(2)}`);
            } catch (error) {
              console.error(`Error interpolating final heel correction:`, error);
              return null;
            }
          }
        } else {
          console.error(`Missing heel correction data for interpolation`);
          console.log(`Available keys in lower data:`, Object.keys(lowerData));
          console.log(`Available keys in upper data:`, Object.keys(upperData));
          return null;
        }
      }
    } else {
      console.log(`No heel correction needed (heel value is 0)`);
    }

    // Calculate final volume
    const finalVolume = finalNetVolume + heelCorrection;
    console.log(`Final volume calculation: ${finalNetVolume.toFixed(2)} + ${heelCorrection.toFixed(2)} = ${finalVolume.toFixed(2)}`);

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
    return null;
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
      value: '100',  // A value that should be within the range
      trim: 0,
      heel: 0,
      heelDirection: 'port'
    },
    {
      inputType: 'ullage',
      value: '200',  // The value from our original test
      trim: 0.5,
      heel: 1,
      heelDirection: 'starboard'
    },
    {
      inputType: 'ullage',
      value: '600',  // A value that should be outside the range
      trim: 0,
      heel: 0,
      heelDirection: 'port'
    },
    {
      inputType: 'sounding',
      value: '100',  // A sounding value for comparison
      trim: 0,
      heel: 0,
      heelDirection: 'port'
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

    if (result) {
      console.log(`\nTest case for ${tankName} with ${testCase.inputType} = ${testCase.value} succeeded`);
      console.log(`Result:`, result);
    } else {
      console.error(`\nTest case for ${tankName} with ${testCase.inputType} = ${testCase.value} failed`);
    }
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
});
