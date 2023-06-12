// Function to convert Figma color to CSS-friendly string
function convertColorToRgba(color: RGB, alpha: 0): string {
  const { r, g, b } = color;
  const a = alpha;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(2)})`;
}

// Function to convert RGB color to hexadecimal string
function convertColorToHex(color: RGB): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}


// Function to generate the JavaScript config file content
function generateConfigContent(colors: Record<string, string>, typography: Record<string, TextStyle>): string {
  return `
  // config.js

  const color = ${JSON.stringify(colors, null, 2)};

  const color = {
    darkest: '#000',
    lightest: '#fff',
    primary: primaryColor.hex(),
    secondary: secondaryColor.hex(),

    // Shades of gray
    gray: {
        100: '#f2f2f2',
        200: '#dfdfdf',
        300: '#cdcdcd',
    },

    // State colours used for i.e notifications
    highlight: {
        success: '#1EAC70',
        info: 'lightblue',
        warning: 'orange',
        error: '#DF3755'
    }
  };

  export const typography = ${JSON.stringify(typography, null, 2)};
`;
}

// Function to export properties from the "🎨 Tokens" page
function exportTokens() {
  const pageName = '🎨 Tokens'; //TODO: make select box to select source page
  let tokenPage = '';

  if(figma.currentPage.name === pageName) {
    tokenPage = figma.currentPage
  } else {
    figma.closePlugin('Please go to the "🎨 Tokens" page to run this plugin');
    return;
  }

  const colors: Record<string, string> = {};
  const typography: Record<string, TextStyle> = {};


  // Export colors
  const colorSection = tokenPage.children.find((child) => child.name === 'Colors' && child.type === 'SECTION');

  if (colorSection) {
    colorSection.children.forEach((child) => {
      if (child.type === 'FRAME') {
        const colorName = child.name;
        const colorValue = child.fills[0].opacity != 1 ? convertColorToRgba(child.fills[0].color, child.fills[0].opacity) : convertColorToHex(child.fills[0].color);
        colors[colorName] = colorValue;
        console.log(child);
      }
    });
  }

  // Export typography
  const typographySection = tokenPage.children.find((child) => child.name === 'Typography' && child.type === 'SECTION');

  if (typographySection) {
    typographySection.children.forEach((child) => {
      if (child.type === 'TEXT') {
        const typographyName = child.name;
        const typographyStyle = child.textStyleId ? figma.getStyleById(child.textStyleId) : {};
        typography[typographyName] = typographyStyle;
      }
    });
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
figma.showUI(__html__)

figma.ui.onmessage = (message) => {
  if (message.type === 'generateTokens') {
    exportTokens();
  }
};