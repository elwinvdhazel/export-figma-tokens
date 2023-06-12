"use strict";
// Function to convert Figma color to CSS-friendly string
function convertColorToRgba(color, alpha) {
    const { r, g, b } = color;
    const a = alpha;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(2)})`;
}
// Function to convert RGB color to hexadecimal string
function convertColorToHex(color) {
    const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}
// Function to generate the JavaScript config file content
function generateConfigContent(colors, typography) {
    return `
  // config.js

  const color = ${JSON.stringify(colors, null, 2)};

  const typography = ${JSON.stringify(typography, null, 2)};
`;
}
// Function to export properties from the "🎨 Tokens" page
function exportTokens() {
    const pageName = '🎨 Tokens'; //TODO: make select box to select source page
    let tokenPage = '';
    if (figma.currentPage.name === pageName) {
        tokenPage = figma.currentPage;
    }
    else {
        figma.closePlugin('Please go to the "🎨 Tokens" page to run this plugin');
        return;
    }
    let colors = {};
    const typography = {};
    // Export colors
    const colorSection = tokenPage.children.find((child) => child.name === 'Colors' && child.type === 'SECTION');
    if (colorSection) {
        const colorsWithoutObject = {}; // Store colors without objects
        const colorsWithObjects = {}; // Store colors with objects
        colorSection.children.forEach((child) => {
            if (child.type === 'FRAME') {
                const layerName = child.name;
                const layerNames = layerName.split('/');
                if (layerNames.length === 1) {
                    // Handle regular color layer
                    const colorName = layerNames[0];
                    const colorValue = child.fills[0].opacity !== 1 ? convertColorToRgba(child.fills[0].color, child.fills[0].opacity) : convertColorToHex(child.fills[0].color);
                    // Check if the color name already exists in the colors without object array
                    if (!colorsWithObjects.hasOwnProperty(colorName) && !colorsWithoutObject.hasOwnProperty(colorName)) {
                        colorsWithoutObject[colorName] = colorValue;
                    }
                }
                else if (layerNames.length > 1) {
                    // Handle JSON object
                    const objName = layerNames[0];
                    const objProps = layerNames.slice(1);
                    // Check if the object name already exists in the colors with objects array
                    if (!colorsWithObjects.hasOwnProperty(objName)) {
                        // Create new object if it doesn't exist
                        colorsWithObjects[objName] = {};
                    }
                    // Check if the properties of the object already exist
                    let obj = colorsWithObjects[objName];
                    for (let i = 0; i < objProps.length; i++) {
                        const prop = objProps[i];
                        if (!obj.hasOwnProperty(prop)) {
                            // Create new property if it doesn't exist
                            if (i === objProps.length - 1) {
                                // Last property, assign color value
                                obj[prop] = child.fills[0].opacity !== 1 ? convertColorToRgba(child.fills[0].color, child.fills[0].opacity) : convertColorToHex(child.fills[0].color);
                            }
                            else {
                                // Intermediate property, create new object
                                obj[prop] = {};
                            }
                        }
                        obj = obj[prop]; // Move to the next nested object
                    }
                }
            }
        });
        // Merge colorsWithoutObject and colorsWithObjects into the colors object, keeping colors as the destination variable
        colors = Object.assign(Object.assign({}, colorsWithoutObject), colorsWithObjects);
    }
    // Export typography
    const typographySection = tokenPage.children.find((child) => child.name === 'Typography' && child.type === 'SECTION');
    if (typographySection) {
        // typographySection.children.forEach((child) => {
        //   if (child.type === 'TEXT') {
        //     const typographyName = child.name;
        //     const typographyStyle = child.textStyleId ? figma.getStyleById(child.textStyleId) : {};
        //     typography[typographyName] = typographyStyle;
        //   }
        // });
    }
    const configContent = generateConfigContent(colors, typography);
    console.log(configContent);
    // // Create and save the config.js file
    // const configFile = figma.createFile();
    // const configPage = configFile.root.children[0];
    // configPage.name = 'Config';
    // const configText = figma.createText();
    // configText.name = 'config.js';
    // configText.characters = configContent;
    // configPage.appendChild(configText);
    // figma.notify('Config file created successfully.');
    // // Save the file
    // figma.ui.postMessage({ type: 'saveFile', file: configFile });
}
// Run the exportTokens function when the plugin is run
figma.showUI(__html__);
figma.ui.onmessage = (message) => {
    if (message.type === 'generateTokens') {
        exportTokens();
    }
};
