# Tank Volume Calculator

A Vue.js application for calculating tank volumes based on sounding (GAUGE) or ullage (ULL) measurements, with trim and heel corrections.

## Description

This application allows users to:
- Select a tank from available tank data
- Input either sounding (GAUGE) or ullage (ULL) measurements
- Specify trim and heel values
- Calculate the tank volume with interpolation for values not in the data tables

The calculation follows the formula: `VOLUME = VNET + VCORRH` where:
- VNET: Net volume for a certain trim, with no heeling
- VCORRH: Volume correction for a given heel angle

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fho-sounding
```

2. Install dependencies:
```bash
npm install
```

### Web Application

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

### Desktop Application (Neutralino)

The application can also be run as a desktop application using Neutralino.js.

5. Update Neutralino binaries and client library (if needed):
```bash
npm run neu-update
```

6. Build the application for Neutralino:
```bash
npm run neu-build
```

7. Run the desktop application:
```bash
npm run neu-run
```

8. Build a release version for distribution:
```bash
npm run neu-release
```

## Usage

1. **Select a Tank**: Choose a tank from the dropdown menu.
2. **Choose Input Type**: Select either Sounding (GAUGE) or Ullage (ULL) as your input type.
3. **Enter Values**:
   - Enter the sounding or ullage value in centimeters
   - Enter the trim value in meters (positive for by stern, negative for by bow)
   - Enter the heel value in degrees and select the direction (port or starboard)
4. **Calculate Volume**: Click the "Calculate Volume" button to get the result.
5. **View Results**: The calculation results will be displayed, showing:
   - Net volume (VNET)
   - Heel correction (VCORRH)
   - Total volume (VNET + VCORRH)

## Features

- **Tank Selection**: Choose from multiple available tanks.
- **Flexible Input**: Use either sounding (GAUGE) or ullage (ULL) measurements.
- **Interpolation**: Automatically interpolates for values not exactly matching the data tables.
- **Detailed Results**: Provides a breakdown of the calculation process.
- **Responsive Design**: Works on various screen sizes.

## Technical Details

### Abbreviations

- **L.C.G**: Longitudinal center of gravity from AP ('+' fore, '-' aft), m
- **T.C.G**: Transverse center of gravity from ship's centerline ('+' port, '-' starboard), m
- **V.C.G**: Height of the center of gravity above base line, m
- **FILL**: Fill degree at even keel, %
- **Tr=***: Net volume for a certain trim, with no heeling, m³
- **H*P**: Volume correction for a given heel angle to port side at even keel, (* means 1 or 2,etc), m³
- **H*S**: Volume correction for a given heel angle to starboard at even keel, (* means 1 or 2,etc), m³
- **IMOM**: Transverse moment of inertia of free surface, m⁴
- **GAUGE**: The sounding pipe length between liquid surface and bottom of sounding pipe, cm
- **ULL**: The sounding pipe length between liquid surface and top of sounding pipe, cm

### Implementation

The application is built with:
- **Vue 3**: Using the Composition API with `<script setup>`
- **Vite**: For fast development and optimized builds
- **JSON Data**: Tank data is stored in JSON files in the `tank_data` directory

The calculation logic includes:
1. Finding the closest sounding/ullage values in the data
   - Exact matches are prioritized to ensure accuracy
   - For non-exact matches, interpolation is performed between the closest values
2. Interpolating for the net volume based on trim
3. Applying heel correction based on direction and value
4. Calculating the final volume as VNET + VCORRH

### Interpolation Logic

The application implements a comprehensive multi-dimensional interpolation approach:

1. **Sounding/Ullage Interpolation**: 
   - First checks for exact matches in the data
   - If no exact match, performs linear interpolation between the closest values

2. **Trim Interpolation**:
   - Checks for exact matches in the available trim values
   - If no exact match, performs linear interpolation between the closest trim values
   - Combines with sounding/ullage interpolation for proper 2D interpolation

3. **Heel Interpolation**:
   - Checks for exact matches in the available heel values (1°, 2°, 3°)
   - For fractional heel values (e.g., 1.5°), performs interpolation between the closest heel values
   - Combines with sounding/ullage interpolation for proper 3D interpolation

### Calculation Display

The application provides detailed information about the calculation process:

1. **Exact Match Indicators**: 
   - Shows "(Exact Match)" next to input values that exactly match values in the data
   - Helps users understand when interpolation is or isn't being used

2. **Calculation Method**:
   - Displays whether the calculation used exact matches or interpolation
   - Shows a badge indicating "Exact Match" or "Interpolated"

3. **Detailed Calculation Steps**:
   - Provides a step-by-step breakdown of the calculation process
   - Shows intermediate values and interpolation steps
   - Helps users understand how the final volume was calculated

### Important Implementation Notes

- **Exact Match Handling**: When a user enters values that exactly match values in the tank data, the application uses those exact values without interpolation. This ensures precise results for values that are directly available in the data tables.
- **Interpolation**: For values not exactly matching the data tables, the application performs linear interpolation between the closest values to provide accurate estimates.
- **Multi-dimensional Interpolation**: The application properly handles interpolation across all three dimensions (sounding/ullage, trim, and heel) to ensure accurate results in all scenarios.

## Neutralino Desktop Application

The Tank Volume Calculator can be run as a desktop application using [Neutralinojs](https://neutralino.js.org/), a lightweight and portable desktop application development framework.

### Features

- **Cross-platform**: Runs on Windows, macOS, and Linux
- **Lightweight**: Small binary size and low memory footprint
- **Native APIs**: Access to file system and OS-specific features
- **Offline usage**: Works without an internet connection

### Development Workflow

1. Make changes to the Vue application as usual
2. Run `npm run neu-build` to build the application
3. Run `npm run neu-run` to run the application as a desktop app

### Distribution

To create a distributable package:

1. Run `npm run neu-release` to build a release version of the application
2. The distributable files will be generated in the `dist` directory
3. Follow the [Neutralino distribution guide](https://neutralino.js.org/docs/distribution/overview) for platform-specific packaging instructions

### Troubleshooting

If you encounter issues with the Neutralino integration:

1. **WebSocket Connection Errors**: If you see errors like `Invalid url for WebSocket ws://localhost:undefined?connectToken=undefined`, make sure you're running the application with `npm run neu-run` and not directly opening the HTML file
2. **Missing Files**: Ensure that the tank data files are being copied to the `dist/tank_data` directory during the build process
3. **Updates**: Make sure you have the latest version of Neutralino by running `npm run neu-update`
4. **Configuration**: Verify that the `neutralino.config.json` file is correctly configured
5. **Logs**: Check the `neutralinojs.log` file in the project root for detailed error messages

For more information on Neutralino integration, see the [NEUTRALINO_INTEGRATION.md](NEUTRALINO_INTEGRATION.md) file.

## License

[MIT License](LICENSE)
