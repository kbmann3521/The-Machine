/**
 * Professional UUID Validator
 * Supports versions 1, 3, 4, 5, and 7
 * Includes normalization, generation, detailed metadata, and world-class JSON output
 */

const UUID_REGEX = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const UUID_REGEX_URN = /^urn:uuid:[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

function getInputFormat(input) {
  const trimmed = input.trim();
  
  if (trimmed.toLowerCase().startsWith('urn:uuid:')) {
    return 'URN';
  }
  
  if (/^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}$/.test(trimmed)) {
    return 'uppercase';
  }
  
  if (/^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/.test(trimmed)) {
    return 'hyphenated';
  }
  
  if (/^[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}$/.test(trimmed)) {
    return 'mixed-case';
  }
  
  if (/^[a-z0-9]{32}$/.test(trimmed)) {
    return 'no-hyphens';
  }
  
  if (/^[A-Z0-9]{32}$/.test(trimmed)) {
    return 'no-hyphens-uppercase';
  }
  
  return 'unknown';
}

function normalize(input) {
  if (!input) return null;

  let uuid = input.trim().toLowerCase();

  // Remove URN prefix if present
  if (uuid.startsWith('urn:uuid:')) {
    uuid = uuid.slice(9);
  }

  // Remove all characters except hex digits
  uuid = uuid.replace(/[^0-9a-f]/g, '');

  // Must be exactly 32 hex chars to normalize
  if (uuid.length !== 32) return null;

  // Re-insert hyphens in correct positions
  return (
    uuid.slice(0, 8) + '-' +
    uuid.slice(8, 12) + '-' +
    uuid.slice(12, 16) + '-' +
    uuid.slice(16, 20) + '-' +
    uuid.slice(20)
  );
}

function extractBits(uuid) {
  const normalized = normalize(uuid);
  if (!normalized) return null;

  const clean = normalized.replace(/-/g, '');

  if (clean.length !== 32) {
    return null;
  }

  return {
    time_low: clean.substring(0, 8),
    time_mid: clean.substring(8, 12),
    time_high_and_version: clean.substring(12, 16),
    clock_seq: clean.substring(16, 20),
    node: clean.substring(20, 32),
  };
}

function extractVersion(uuid) {
  const normalized = normalize(uuid);
  if (!normalized) return null;

  const clean = normalized.replace(/-/g, '');

  if (clean.length !== 32) {
    return null;
  }

  const versionNibble = clean[12];
  const version = parseInt(versionNibble, 16);

  if ([1, 3, 4, 5, 7].includes(version)) {
    return version;
  }

  return null;
}

function extractVariant(uuid) {
  const normalized = normalize(uuid);

  if (!normalized) {
    return 'Unknown';
  }

  const clean = normalized.replace(/-/g, '');

  if (clean.length !== 32) {
    return 'Unknown';
  }

  const nib = parseInt(clean[16], 16);

  if (nib <= 7) return 'NCS Backward Compatible';
  if (nib >= 8 && nib <= 11) return 'RFC 4122';
  if (nib >= 12 && nib <= 13) return 'Microsoft GUID';
  if (nib >= 14 && nib <= 15) return 'Reserved Future';

  return 'Unknown';
}

function getVersionName(version) {
  const names = {
    1: 'Time-based (v1)',
    3: 'Name-based MD5 (v3)',
    4: 'Random (v4)',
    5: 'Name-based SHA-1 (v5)',
    7: 'Unix Time-based (v7)',
  };
  return names[version] || 'Unknown';
}

function getUUIDType(version) {
  switch (version) {
    case 1:
      return 'time-based (timestamp + MAC)';
    case 3:
      return 'name-based (MD5 hash)';
    case 4:
      return 'non-time-based (random)';
    case 5:
      return 'name-based (SHA-1 hash)';
    case 7:
      return 'time-based (Unix timestamp)';
    default:
      return 'unknown';
  }
}

function getVersionDescription(version) {
  switch (version) {
    case 1:
      return 'Timestamp + MAC-address-based UUID';
    case 3:
      return 'MD5 name-based UUID';
    case 4:
      return 'Randomly generated UUID';
    case 5:
      return 'SHA-1 name-based UUID';
    case 7:
      return 'Unix time-ordered UUID';
    default:
      return 'Unknown version';
  }
}

function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

function validateStructure(uuid) {
  const normalized = normalize(uuid);

  if (!normalized) {
    return { valid: false, errors: ['Invalid UUID format'], validRFC4122: false };
  }

  const clean = normalized.replace(/-/g, '');
  const errors = [];

  // Check length
  if (clean.length !== 32) {
    errors.push(`Incorrect length: ${clean.length} characters (expected 32 with no hyphens)`);
    return { valid: false, errors, validRFC4122: false };
  }

  // Check if all characters are hex
  if (!/^[0-9a-f]{32}$/i.test(clean)) {
    errors.push('Contains non-hexadecimal characters');
    return { valid: false, errors, validRFC4122: false };
  }

  // Check version nibble
  const versionNibble = parseInt(clean[12], 16);
  if (![1, 3, 4, 5, 7].includes(versionNibble)) {
    errors.push(`Invalid version nibble: expected 1, 3, 4, 5, or 7 but found '${versionNibble.toString(16).toLowerCase()}'`);
  }

  // Check variant nibble (RFC 4122)
  const variantNibble = parseInt(clean[16], 16);
  if (!(variantNibble >= 8 && variantNibble <= 11)) {
    errors.push(`Invalid variant: expected 8, 9, a, or b but found '${clean[16].toLowerCase()}'`);
  }

  // RFC 4122 compliance check
  const isRFC4122 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-57][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(normalized);

  return { valid: errors.length === 0, errors, validRFC4122: isRFC4122 };
}

function toHex(uuid) {
  const normalized = normalize(uuid);
  if (!normalized) return '';
  return normalized.replace(/-/g, '').toLowerCase();
}

function toBase64(uuid) {
  const hex = toHex(uuid);
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(String.fromCharCode(parseInt(hex.substring(i, i + 2), 16)));
  }
  const binaryString = bytes.join('');

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(binaryString, 'binary').toString('base64');
  } else {
    return btoa(binaryString);
  }
}

function toBinary(uuid) {
  const hex = toHex(uuid);
  return hex
    .split('')
    .map((char) => parseInt(char, 16).toString(2).padStart(4, '0'))
    .join(' ');
}

function toUrn(uuid) {
  const normalized = normalize(uuid);
  if (!normalized) return '';
  return `urn:uuid:${normalized}`;
}

function extractTimestampV1(uuid) {
  // UUID v1 stores timestamp as:
  // time_low (32 bits) + time_mid (16 bits) + time_hi (12 bits) = 60 bits
  // Timestamp is in 100-nanosecond intervals since October 15, 1582
  const bits = extractBits(uuid);
  if (!bits) return null;

  const timeLow = parseInt(bits.time_low, 16);
  const timeMid = parseInt(bits.time_mid, 16);
  const timeHi = parseInt(bits.time_high_and_version.substring(0, 3), 16);

  // Reconstruct the 60-bit timestamp
  const timestamp = (timeHi << 48) | (timeMid << 32) | timeLow;

  // UUID epoch: October 15, 1582 (Gregorian calendar)
  // Unix epoch: January 1, 1970
  // Difference: 122192928000000000 100-nanosecond intervals
  const UUID_EPOCH_OFFSET = 122192928000000000n;
  const UNIX_EPOCH = 1970n;

  // Convert to milliseconds since Unix epoch
  const tenNanoSecondIntervals = BigInt(timestamp);
  const hundredNanoSecondsSinceUnix = tenNanoSecondIntervals - UUID_EPOCH_OFFSET;
  const milliseconds = Number(hundredNanoSecondsSinceUnix / 10000n);

  if (milliseconds > 0) {
    const date = new Date(milliseconds);
    return date.toISOString();
  }

  return null;
}

function generateSummary(version, variant, valid, errors) {
  if (!valid) {
    return `Invalid UUID: ${errors[0] || 'Unknown error'}`;
  }

  const versionName = getVersionName(version);
  return `Valid ${variant} ${versionName} UUID`;
}

function detectCommonMistakes(input) {
  const mistakes = [];

  if (input.includes('.') && input.split('.').length === 3) {
    mistakes.push('Input looks like a JWT token, not a UUID');
  }

  const clean = input.replace(/[^a-f0-9]/gi, '');
  if (clean.length > 0 && clean.length < 32 && clean.length > 20) {
    mistakes.push(`Looks like a truncated UUID (${clean.length}/32 characters)`);
  }

  if (input.includes('-') && /[a-z]/.test(input) && /[A-Z]/.test(input)) {
    mistakes.push('Mixed case detected; UUIDs are case-insensitive (will be normalized to lowercase)');
  }

  if (input !== input.trim()) {
    mistakes.push('Extra whitespace detected; will be trimmed');
  }

  if (input.includes('\n') || input.includes('\r')) {
    mistakes.push('Contains newline characters; will be removed');
  }

  // Only warn about missing hyphens if hyphens are actually missing
  const stripped = input.replace(/[^0-9a-f]/gi, '');
  const hyphenMissing = !input.includes('-') && stripped.length === 32;
  if (hyphenMissing) {
    mistakes.push('Hyphens missing; will be auto-inserted');
  }

  return mistakes;
}

function validate(input) {
  if (!input || typeof input !== 'string') {
    return {
      input: input,
      valid: false,
      validRFC4122: false,
      validReason: 'Invalid input type',
      errors: ['Invalid input'],
      summary: 'Invalid UUID: Invalid input',
      commonMistakes: [],
    };
  }

  const inputFormat = getInputFormat(input);
  const normalized = normalize(input);
  const originalInput = input;
  const wasNormalized = normalized !== null && normalized !== input && normalized !== input.toLowerCase().replace(/-/g, '');
  const commonMistakes = detectCommonMistakes(input);
  const structureValidation = validateStructure(originalInput);

  const response = {
    input: originalInput,
    inputFormat,
    valid: structureValidation.valid,
    validRFC4122: structureValidation.validRFC4122,
    normalized,
    wasNormalized,
  };

  if (!structureValidation.valid) {
    response.validReason = structureValidation.errors[0] || 'Invalid UUID format';
    response.errors = structureValidation.errors;
    response.summary = generateSummary(null, null, false, structureValidation.errors);
    response.commonMistakes = commonMistakes;
    return response;
  }

  // Valid UUID
  const version = extractVersion(normalized);
  const variant = extractVariant(normalized);
  const bits = extractBits(normalized);
  const hex = toHex(normalized);

  response.version = version;
  response.versionName = getVersionName(version);
  response.versionDescription = getVersionDescription(version);
  response.variant = variant;
  response.type = getUUIDType(version);

  response.hex = hex;
  response.raw = hex;
  response.base64 = toBase64(normalized);
  response.urn = toUrn(normalized);
  response.bytes = hexToBytes(hex);

  if (bits) {
    response.bits = bits;
  }

  response.bitValidation = {
    versionNibbleCorrect: version === extractVersion(normalized),
    variantNibbleCorrect: variant === 'RFC 4122',
  };

  // Version-specific metadata
  if (version === 1) {
    const timestamp = extractTimestampV1(normalized);
    if (timestamp) {
      response.timestamp = timestamp;
    }
  }

  response.validReason = structureValidation.validRFC4122 ? 'Valid RFC 4122 UUID' : 'Valid UUID but not RFC 4122 compliant';
  response.summary = generateSummary(version, variant, true, []);
  response.errors = [];
  response.commonMistakes = commonMistakes;

  return response;
}

function generateV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateV1() {
  const timestamp = Date.now();
  const timeLow = (timestamp & 0xffffffff).toString(16).padStart(8, '0');
  const timeMid = ((timestamp >> 32) & 0xffff).toString(16).padStart(4, '0');
  const timeHiAndVersion = (((timestamp >> 48) & 0xfff) | 0x1000).toString(16).padStart(4, '0');
  const clockSeq = (Math.random() * 0x10000 | 0x8000).toString(16).padStart(4, '0');
  const node = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`;
}

function generateV7() {
  const timestamp = Date.now();
  const timestampHex = timestamp.toString(16).padStart(12, '0');
  const random = Array.from({ length: 10 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const timeLow = timestampHex.substring(0, 8);
  const timeMid = timestampHex.substring(8, 12);
  const timeHiAndVersion = `7${random.substring(0, 3)}`;
  const clockSeq = `${(Math.random() * 0x10 | 0x8).toString(16)}${random.substring(3, 7)}`;
  const node = random.substring(7);

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`;
}

function validateBulk(input) {
  const lines = input.split('\n').filter((line) => line.trim());
  const results = [];

  const firstLine = lines[0] || '';
  const isCSV = firstLine.includes(',');

  if (isCSV) {
    const headers = firstLine.split(',').map((h) => h.trim());
    const uuidColumnIndex = headers.findIndex((h) => h.toLowerCase().includes('uuid') || h.toLowerCase().includes('id'));

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      const uuidValue = parts[uuidColumnIndex] || parts[0];
      const validation = validate(uuidValue);
      results.push({
        row: i + 1,
        input: uuidValue,
        valid: validation.valid,
        version: validation.version || null,
        error: validation.errors?.[0] || null,
        normalized: validation.normalized || null,
      });
    }
  } else {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const validation = validate(line);
        results.push({
          row: i + 1,
          input: line,
          valid: validation.valid,
          version: validation.version || null,
          error: validation.errors?.[0] || null,
          normalized: validation.normalized || null,
        });
      }
    }
  }

  return results;
}

module.exports = {
  validate,
  normalize,
  toHex,
  toBase64,
  toBinary,
  toUrn,
  generateV1,
  generateV4,
  generateV7,
  extractVersion,
  extractVariant,
  extractBits,
  detectCommonMistakes,
  validateBulk,
  getVersionDescription,
  hexToBytes,
};
