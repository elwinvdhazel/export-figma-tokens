const rootSize = 16;
const sizeRange = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl"]
const weightRange = [{
  hairline: '100',
  thin: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900'
}];

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
function generateConfigContent(
  typography: Record<string, TextStyle>,
  lineheight: Record<string, string>,
  grid: Record<string, string>,
  spacing: Record<string, string>,
  borderRadius: Record<string, string>,
  boxShadow: Record<string, string>,
  colors: Record<string, string>,
  transition: Record<string, string>
  ):
  
  string {
  return `
  // variables.js

  const font = ${JSON.stringify(typography, null, 4)};

  const lineHeight = ${JSON.stringify(lineheight, null, 4)};

  const grid = ${JSON.stringify(grid, null, 4)};

  const spacing = ${JSON.stringify(spacing, null, 4)};

  const borderRadius = ${JSON.stringify(borderRadius, null, 4)};

  const boxShadow = ${JSON.stringify(boxShadow, null, 4)};

  const color = ${JSON.stringify(colors, null, 4)};

  const transition = ${JSON.stringify(transition, null, 4)};
  
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
  
  // Export colors
  let colors: Record<string, string> = {};
  const colorSection = tokenPage.children.find((child) => child.name === 'Colors' && child.type === 'SECTION');

  if (colorSection) {
    const colorsWithoutObject: Record<string, string> = {}; // Store colors without objects
    const colorsWithObjects: Record<string, any> = {}; // Store colors with objects

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
        } else if (layerNames.length > 1) {
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
              } else {
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
    colors = { ...colorsWithoutObject, ...colorsWithObjects };
  }


  // Export typography
  let typography: Record<string, TextStyle> = {};
  let lineheight: Record<string, TextStyle> = {};
  const typographySection = tokenPage.children.find((child) => child.name === 'Typography' && child.type === 'SECTION');

  if (typographySection) {
    const fontFamilies: Record<string, any> = {}; // Store fonts
    const fontSizes: Record<string, string> = {}; // Store font sizes
    const fontWeights: Record<string, string> = {}; // Store font weights
    const lineHeights: Record<string, string> = {}; // Store line heights

    typographySection.children.forEach((child) => {
      if (child.type === 'FRAME' || child.type === 'TEXT' ) {
        const layerName = child.name;
        const layerNames = layerName.split('/');

        if (layerNames[0] === 'family') {
          // Handle font family
          const fontName = layerNames.slice(1).join('/'); // Exclude the 'family' prefix
          const fontFamily = child.children[0].fontName.family;

          // Check if the font name already exists in the fonts object
          if (!fontFamilies.hasOwnProperty(fontName)) {
            fontFamilies[fontName] = {};
          }

          fontFamilies[fontName] = fontFamily;
        }
        
        if (layerNames[0] === 'sm' || layerNames[0] === 'lg') {
          // Handle font size
          const fontSize = `${(child.children[0].fontSize / rootSize)}rem`;
          const fontSizeExists = Object.values(fontSizes).includes(fontSize);
          if (!fontSizeExists) fontSizes[layerName] = fontSize;

          // Handle font weight
          const fontWeight = child.children[0].fontWeight;
          const fontWeightName = Object.entries(weightRange[0]).find(([name, value]) => value == fontWeight)?.[0];
          const fontWeightExists = Object.values(fontWeights).includes(fontWeight);
          if (!fontWeightExists && fontWeightName) fontWeights[fontWeightName] = fontWeight;

          // Handle line height
          const lineHeight = (child.children[0].lineHeight.value * 0.01).toFixed(1);
          const lineHeightExists = Object.values(lineHeights).includes(lineHeight);
          if (!lineHeightExists) lineHeights[layerName] = lineHeight;
        }
      }
    });

    const orderedFontSizes = Object.fromEntries(Object.entries(fontSizes).sort((a, b) => parseFloat(a[1]) - parseFloat(b[1])));
    const mappedFontSizes: Record<string, string> = {};
    const sortedFontSizes = Object.entries(orderedFontSizes).sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]));

    sortedFontSizes.forEach(([size, value], index) => {
      const mappedSize = sizeRange[index];
      mappedFontSizes[mappedSize] = value;
    });
    
    const orderedLineHeights = Object.fromEntries(Object.entries(lineHeights).sort((a, b) => parseFloat(a[1]) - parseFloat(b[1])));
    const mappedLineHeights: Record<string, string> = {};
    const sortedLineHeights = Object.entries(orderedLineHeights).sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]));

    sortedLineHeights.forEach(([size, value], index) => {
      const mappedSize = sizeRange[index];
      mappedLineHeights[mappedSize] = value;
    });

    // Merge fonts, fontSizes, and lineHeights into the typography object
    typography = { family: fontFamilies, size: mappedFontSizes, weight: fontWeights};
    lineheight = mappedLineHeights;
  }

  // Export grid
  let grid: Record<string, string> = {};
  const gridSection = tokenPage.children.find((child) => child.name === 'Grid' && child.type === 'SECTION');

  if (gridSection) {
    const gridWithoutObject: Record<string, string> = {};
    const gridWithObjects: Record<string, any> = {};

    gridSection.children.forEach((child) => {
      if (child.type === 'FRAME') {
        const layerName = child.name;
        const layerNames = layerName.split('/');

        if (layerNames.length === 1) {
          // Handle regular color layer
          const gridName = layerNames[0];
          const gridValue = `${child.width}px`;

          // Check if the color name already exists in the colors without object array
          if (!gridWithObjects.hasOwnProperty(gridName) && !gridWithoutObject.hasOwnProperty(gridName)) {
            gridWithoutObject[gridName] = gridValue;
          }
        } else if (layerNames.length > 1) {
          // Handle JSON object
          const objName = layerNames[0];
          const objProps = layerNames.slice(1);

          // Check if the object name already exists in the colors with objects array
          if (!gridWithObjects.hasOwnProperty(objName)) {
            // Create new object if it doesn't exist
            gridWithObjects[objName] = {};
          }

          // Check if the properties of the object already exist
          let obj = gridWithObjects[objName];
          for (let i = 0; i < objProps.length; i++) {
            const prop = objProps[i];

            if (!obj.hasOwnProperty(prop)) {
              // Create new property if it doesn't exist
              if (i === objProps.length - 1) {
                // Last property, assign color value
                obj[prop] = `${(child.width / rootSize)}rem`;
              } else {
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
    grid = { ...gridWithoutObject, ...gridWithObjects };
  }

  // Export spacings
  let spacing: Record<string, string> = {};
  const spacingSection = tokenPage.children.find((child) => child.name === 'Spacing' && child.type === 'SECTION');

  if (spacingSection) {
    const spacings: Record<string, any> = {};

    spacingSection.children.forEach((child) => {
      if (child.type === 'FRAME') {
        const layerName = child.name;

        if (!spacings.hasOwnProperty(layerName)) {
          spacings[layerName] = {};
        }

        // Handle spacing
        const spacingValue = `${child.width}px`;
        const spacingExists = Object.values(spacings).some((value) => value === spacingValue);
        if (!spacingExists) spacings[layerName] = spacingValue;
      }
    });

    spacing = spacings;
  }

  // Export borderradius
  let borderRadius: Record<string, string> = {};
  const borderRadiusSection = tokenPage.children.find((child) => child.name === 'Border radius' && child.type === 'SECTION');

  if (borderRadiusSection) {
    const borderRadiuss: Record<string, any> = {};

    borderRadiusSection.children.forEach((child) => {
      if (child.type === 'FRAME') {
        const layerName = child.name;

        if (!borderRadiuss.hasOwnProperty(layerName)) {
          borderRadiuss[layerName] = {};
        }

        if (typeof child.cornerRadius === 'number') {
          borderRadiuss[layerName] = `${(child.cornerRadius / rootSize)}rem`;
        } else {
          borderRadiuss[layerName] = `${(child.topRightRadius / rootSize)}rem ${(child.bottomRightRadius / rootSize)}rem ${(child.bottomLeftRadius / rootSize)}rem ${(child.topLeftRadius / rootSize)}rem`;
        }
      }
    });

    borderRadius = borderRadiuss;
  }

  // Export boxshadow
  let boxShadow: Record<string, string> = {};
  const boxShadowSection = tokenPage.children.find((child) => child.name === 'Drop shadows' && child.type === 'SECTION');

  if (boxShadowSection) {
    const boxShadows: Record<string, any> = {};

    boxShadowSection.children.forEach((child) => {
      if (child.type === 'FRAME') {
        const layerName = child.name;
        const effect = child.effects.find((effect) => effect.type);

        if (!boxShadows.hasOwnProperty(layerName)) {
          boxShadows[layerName] = {};
        }

        if (effect.type === 'DROP_SHADOW' || effect.type  === 'INNER_SHADOW') {
          const dropShadowColor = effect.color;
          const dropShadowOffset = effect.offset;
          const dropShadowSpread = effect.spread;
          const dropShadowRadius = effect.radius;
          const dropShadowInset = effect.type  === 'INNER_SHADOW' ? 'inset' : '';
          const dropShadowEffect = `${dropShadowInset} ${dropShadowOffset.x}px ${dropShadowOffset.y}px ${dropShadowRadius}px ${dropShadowSpread}px ${convertColorToRgba(dropShadowColor, dropShadowColor.a)}`

          boxShadows[layerName] = dropShadowEffect;
        }
      }
    });

    boxShadow = boxShadows;
  }

  // Export transitions
  let transition: Record<string, string> = {};
  const transitionSection = tokenPage.children.find((child) => child.name === 'Transitions' && child.type === 'SECTION');

  if (transitionSection) {
    const transitionWithoutObject: Record<string, string> = {};
    const transitionWithObjects: Record<string, any> = {};

    transitionSection.children.forEach((child) => {
      if (child.type === 'FRAME') {
        const layerName = child.name;
        const layerNames = layerName.split('/');

        if (layerNames.length === 1) {
          // Handle regular color layer
          const transitionName = layerNames[0];
          const transitionValue = child.findOne(node => node.type === 'TEXT').characters;

          // Check if the color name already exists in the colors without object array
          if (!transitionWithObjects.hasOwnProperty(transitionName) && !transitionWithoutObject.hasOwnProperty(transitionName)) {
            transitionWithoutObject[transitionName] = transitionValue;
          }
        } else if (layerNames.length > 1) {
          const objName = layerNames[0];
          const objProps = layerNames.slice(1);

          if (!transitionWithObjects.hasOwnProperty(objName)) {
            transitionWithObjects[objName] = {};
          }

          // Check if the properties of the object already exist
          let obj = transitionWithObjects[objName];
          for (let i = 0; i < objProps.length; i++) {
            const prop = objProps[i];

            if (!obj.hasOwnProperty(prop)) {
              if (i === objProps.length - 1) {
                obj[prop] = child.findOne(node => node.type === 'TEXT').characters;
              } else {
                obj[prop] = {};
              }
            }

            obj = obj[prop]; // Move to the next nested object
          }
        }
      }
    });

    // Merge colorsWithoutObject and colorsWithObjects into the colors object, keeping colors as the destination variable
    transition = { ...transitionWithoutObject, ...transitionWithObjects };
  }

  const configContent = generateConfigContent(typography, lineheight, grid, spacing, borderRadius, boxShadow, colors, transition);

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