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
function normalizeUpca(input, config = {}) {
  const { ignoreLeadingZeros = true } = config;
  let digits = input.replace(/\D/g, '');

  if (ignoreLeadingZeros) {
    // If the input is longer than 12 digits, strip leading zeros
    // until it reaches 12 or until it no longer has leading zeros.
    while (digits.length > 12 && digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // Special case for 13-digit codes (EAN-13 starting with 0)
    if (digits.length === 13 && digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // If we have 12 digits and it still starts with 0, check if stripping it makes it 11
    // and if the 12th digit was a valid checksum for the first 11.
    // If not, we might want to keep all 12 digits if they look like a UPC-A anyway.
    if (digits.length === 12 && digits.startsWith('0')) {
      try {
        const expectedChecksum = calculateChecksum(digits.substring(0, 11));
        if (parseInt(digits[11]) !== expectedChecksum) {
          // If the checksum doesn't match, try stripping the leading zero
          // as it might be a 11-digit code with an extra leading zero.
          const stripped = digits.substring(1);
          // Only strip if the remaining 11 digits could form a valid UPC-A (it will get its own checksum)
          if (stripped.length === 11) {
            digits = stripped;
          }
        }
      } catch (e) {
        // Ignore errors in detection
      }
    }
  }

  if (digits.length === 11) {
    const checksum = calculateChecksum(digits);
    return digits + checksum;
  }
  if (digits.length === 12) {
    // For 12 digits, we should ideally validate the checksum,
    // but some retail systems use non-standard codes.
    // We'll calculate the expected checksum and if it doesn't match,
    // we'll still allow it but maybe warn (for now just allow it to avoid blocking the user).
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

  const normalizedCode = normalizeUpca(code, config);
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
  const { structuredData = null, barcodeColumn = null } = config;
  const results = [];

  if (structuredData && structuredData.rows && structuredData.rows.length > 0) {
    const headers = structuredData.headers || Object.keys(structuredData.rows[0]);

    // Improved auto-detection: find the first column that looks like a UPC/Barcode
    // or use the manually selected one
    const col = barcodeColumn || headers.find(h =>
      /upc|barcode|sku|ean|item.*code|product.*code|id/i.test(h)
    ) || headers[0];

    for (const row of structuredData.rows) {
      const upc = String(row[col] || '').trim();
      if (!upc) continue;

      try {
        const svg = generateUpcaSvg(upc, config);
        results.push({
          input: upc,
          output: svg,
          format: 'upca',
          rowData: row
        });
      } catch (error) {
        results.push({
          input: upc,
          error: error.message,
          rowData: row
        });
      }
    }
  } else {
    const lines = input.split(/\r?\n/).filter(line => line.trim() !== '');
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
  }

  // Sort results by BOH if available (lowest first)
  // We check rowData for a BOH field (case-insensitive)
  results.sort((a, b) => {
    const getBohValue = (res) => {
      if (!res.rowData) return Infinity;
      const bohKey = Object.keys(res.rowData).find(k => k.toLowerCase() === 'boh');
      if (!bohKey) return Infinity;
      const val = parseFloat(String(res.rowData[bohKey]).replace(/[^\d.-]/g, ''));
      return isNaN(val) ? Infinity : val;
    };

    const valA = getBohValue(a);
    const valB = getBohValue(b);

    if (valA === valB) return 0;
    return valA < valB ? -1 : 1;
  });

  return {
    results,
    count: results.length,
    success: results.filter(r => !r.error).length
  };
}
