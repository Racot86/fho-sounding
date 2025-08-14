# Neutralinojs Integration

This document describes how the FHO Sounding Calculator application has been integrated with Neutralinojs to create a desktop application.

## Overview

[Neutralinojs](https://neutralino.js.org/) is a lightweight and portable desktop application development framework that allows you to build cross-platform applications using web technologies (HTML, CSS, and JavaScript). This integration enables the FHO Sounding Calculator to run as a native desktop application on Windows, macOS, and Linux.

## Project Structure

The integration adds the following files and directories to the project:

- `neutralino.config.json`: Configuration file for the Neutralino application
- `public/neutralino.js`: Neutralino client library
- `public/neutralino.d.ts`: TypeScript definitions for the Neutralino client library

## Building and Running

The following npm scripts have been added to the project:

- `npm run neu-update`: Updates the Neutralino binaries and client library
- `npm run neu-build`: Builds the Vue app with Vite and then builds the Neutralino app
- `npm run neu-run`: Runs the Neutralino app
- `npm run neu-release`: Builds the Vue app and then builds a release version of the Neutralino app

### Development Workflow

1. Make changes to the Vue application as usual
2. Run `npm run neu-build` to build the application
3. Run `npm run neu-run` to run the application as a desktop app

### Distribution

To create a distributable package:

1. Run `npm run neu-release` to build a release version of the application
2. The distributable files will be generated in the `dist` directory
3. Follow the [Neutralino distribution guide](https://neutralino.js.org/docs/distribution/overview) for platform-specific packaging instructions

## Using Neutralino APIs

The Neutralino client library is initialized in `src/main.js`. You can use Neutralino APIs in your Vue components by accessing the global `window.Neutralino` object. For example:

```javascript
// Example: Get the current operating system
async function getOS() {
  const osInfo = await window.Neutralino.os.getOSInfo();
  console.log(`Running on ${osInfo.name} ${osInfo.version}`);
}
```

For more information on available APIs, refer to the [Neutralino API documentation](https://neutralino.js.org/docs/api/overview).

## Troubleshooting

If you encounter issues with the Neutralino integration:

1. Make sure you have the latest version of Neutralino by running `npm run neu-update`
2. Check the console output for error messages
3. Verify that the `neutralino.config.json` file is correctly configured
4. Ensure that the tank data files are being copied to the `dist/tank_data` directory during the build process

## Resources

- [Neutralinojs Documentation](https://neutralino.js.org/docs/)
- [Neutralinojs GitHub Repository](https://github.com/neutralinojs/neutralinojs)
