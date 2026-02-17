/**
 * UPC-A Barcode Generator
 * Generates SVG barcodes for UPC-A format.
 */

const L_CODE = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011'
];

const R_CODE = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100'
];

/**
 * Calculates UPC-A checksum
 */
function calculateChecksum(digits) {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Validates and normalizes UPC-A input
 */
function normalizeUpca(input) {
  let digits = input.replace(/\D/g, '');

  // If the input is longer than 12 digits, strip leading zeros
  // until it reaches 12 or until it no longer has leading zeros.
  while (digits.length > 12 && digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // If we have 12 digits and it still starts with 0, check the checksum.
  // If the checksum is invalid, stripping the leading zero might
  // reveal a valid 11-digit UPC-A code.
  if (digits.length === 12 && digits.startsWith('0')) {
    const expectedChecksum = calculateChecksum(digits.substring(0, 11));
    if (parseInt(digits[11]) !== expectedChecksum) {
      digits = digits.substring(1);
    }
  }

  if (digits.length === 11) {
    const checksum = calculateChecksum(digits);
    return digits + checksum;
  }
  if (digits.length === 12) {
    const checksum = calculateChecksum(digits.substring(0, 11));
    if (parseInt(digits[11]) !== checksum) {
      throw new Error(`Invalid checksum for ${digits}. Expected ${checksum}.`);
    }
    return digits;
  }
  throw new Error(`UPC-A must be 11 or 12 digits. Got ${digits.length} digits.`);
}

/**
 * Generates SVG for a single UPC-A code
 */
function generateUpcaSvg(code, config = {}) {
  const {
    width = 2,
    height = 50,
    includeText = true
  } = config;

  const normalizedCode = normalizeUpca(code);
  let modules = '101'; // Left guard

  // Left half
  for (let i = 0; i < 6; i++) {
    modules += L_CODE[parseInt(normalizedCode[i])];
  }

  modules += '01010'; // Center guard

  // Right half
  for (let i = 6; i < 12; i++) {
    modules += R_CODE[parseInt(normalizedCode[i])];
  }

  modules += '101'; // Right guard

  const totalModules = modules.length; // Should be 95
  const svgWidth = totalModules * width;
  const svgHeight = height + (includeText ? 20 : 0);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
  svg += `<rect width="100%" height="100%" fill="white" />`;

  for (let i = 0; i < modules.length; i++) {
    if (modules[i] === '1') {
      const barHeight = (i < 3 || (i >= 45 && i < 50) || i >= 92) ? height : height * 0.9;
      svg += `<rect x="${i * width}" y="0" width="${width}" height="${barHeight}" fill="black" />`;
    }
  }

  if (includeText) {
    svg += `<text x="${svgWidth / 2}" y="${height + 15}" font-family="monospace" font-size="14" text-anchor="middle" fill="black">`;
    svg += `${normalizedCode[0]} ${normalizedCode.substring(1, 6)} ${normalizedCode.substring(6, 11)} ${normalizedCode[11]}`;
    svg += `</text>`;
  }

  svg += `</svg>`;
  return svg;
}

export async function barcodeGenerator(input, config = {}) {
  const lines = input.split(/\r?\n/).filter(line => line.trim() !== '');
  const results = [];

  for (const line of lines) {
    try {
      const svg = generateUpcaSvg(line.trim(), config);
      results.push({
        input: line.trim(),
        output: svg,
        format: 'upca'
      });
    } catch (error) {
      results.push({
        input: line.trim(),
        error: error.message
      });
    }
  }

  return {
    results,
    count: results.length,
    success: results.filter(r => !r.error).length
  };
}
