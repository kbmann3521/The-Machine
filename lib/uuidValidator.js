/**
 * Professional UUID Validator
 * Supports versions 1, 3, 4, 5, and 7
 * Includes normalization, generation, and detailed metadata
 */

const UUID_REGEX = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const UUID_REGEX_URN = /^urn:uuid:[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

function normalize(input) {
  let uuid = input.trim();

  // Remove URN prefix if present
  if (uuid.toLowerCase().startsWith('urn:uuid:')) {
    uuid = uuid.substring(9);
  }

  // Normalize to lowercase and add hyphens if missing
  uuid = uuid.toLowerCase();
  if (!uuid.includes('-') && uuid.length === 32) {
    uuid = `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(12, 16)}-${uuid.substring(16, 20)}-${uuid.substring(20)}`;
  }

  return uuid;
}

function extractVersion(uuid) {
  const normalized = normalize(uuid);
  const clean = normalized.replace(/-/g, '');

  if (clean.length !== 32) {
    return null;
  }

  // Version is the first nibble of the time_hi_and_version field (13th character)
  const versionNibble = clean[12];
  const version = parseInt(versionNibble, 16);

  // Valid versions are 1, 3, 4, 5, 7
  if ([1, 3, 4, 5, 7].includes(version)) {
    return version;
  }

  return null;
}

function extractVariant(uuid) {
  const normalized = normalize(uuid);
  const clean = normalized.replace(/-/g, '');

  if (clean.length !== 32) {
    return null;
  }

  // Variant is in the most significant 2-3 bits of the clock_seq_hi_and_reserved field (17th character)
  const variantNibble = parseInt(clean[16], 16);

  // RFC 4122 variant: 1 0 x x (8-b in hex)
  if ((variantNibble & 0x8) === 0x8 && (variantNibble & 0x4) === 0) {
    return 'RFC 4122';
  }

  // Reserved NCS backward compatibility
  if ((variantNibble & 0xC) === 0) {
    return 'NCS Backward Compatible';
  }

  // Microsoft GUID
  if ((variantNibble & 0xC) === 0xC) {
    return 'Microsoft GUID';
  }

  // Reserved for future
  if ((variantNibble & 0xC) === 0x4) {
    return 'Reserved Future';
  }

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

function validateStructure(uuid) {
  const normalized = normalize(uuid);
  const clean = normalized.replace(/-/g, '');

  // Check length
  if (clean.length !== 32) {
    return {
      valid: false,
      error: `Invalid length: ${clean.length} characters (expected 32)`,
    };
  }

  // Check if all characters are hex
  if (!/^[0-9a-f]{32}$/i.test(clean)) {
    return {
      valid: false,
      error: 'Contains non-hexadecimal characters',
    };
  }

  // Check version nibble
  const versionNibble = parseInt(clean[12], 16);
  if (![1, 3, 4, 5, 7].includes(versionNibble)) {
    return {
      valid: false,
      error: `Invalid version nibble: ${versionNibble.toString(16).toUpperCase()} (expected 1, 3, 4, 5, or 7)`,
    };
  }

  // Check variant nibble (RFC 4122)
  const variantNibble = parseInt(clean[16], 16);
  if (!['8', '9', 'a', 'A', 'b', 'B'].includes(clean[16])) {
    return {
      valid: false,
      error: `Invalid variant nibble: ${clean[16].toUpperCase()} (expected 8, 9, A, or B for RFC 4122)`,
    };
  }

  return { valid: true };
}

function toHex(uuid) {
  const normalized = normalize(uuid);
  return normalized.replace(/-/g, '').toLowerCase();
}

function toBase64(uuid) {
  const hex = toHex(uuid);
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(String.fromCharCode(parseInt(hex.substring(i, i + 2), 16)));
  }
  const binaryString = bytes.join('');

  // Handle both Node.js (Buffer) and browser environments
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(binaryString, 'binary').toString('base64');
  } else {
    // Fallback for browsers: use btoa
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
  return `urn:uuid:${normalized}`;
}

function extractMetadata(uuid) {
  const normalized = normalize(uuid);
  const clean = normalized.replace(/-/g, '');

  const version = extractVersion(uuid);
  const variant = extractVariant(uuid);

  const metadata = {
    uuid: normalized,
    normalized,
    hex: toHex(uuid),
    base64: toBase64(uuid),
    urn: toUrn(uuid),
    version,
    versionName: version ? getVersionName(version) : 'Unknown',
    variant,
  };

  // Version-specific metadata
  if (version === 1) {
    // Time-based UUID (v1)
    // Bits 0-31: low 32 bits of timestamp
    // Bits 32-47: mid 16 bits of timestamp
    // Bits 48-59: high 12 bits of timestamp
    // Bits 60-63: version (0001)
    // Bits 64-65: variant
    // Bits 66-127: node (48 bits) + clock sequence (14 bits)

    const timeLow = clean.substring(0, 8);
    const timeMid = clean.substring(8, 12);
    const timeHigh = clean.substring(12, 16);
    const clockSeq = clean.substring(16, 20);
    const node = clean.substring(20, 32);

    metadata.timeLow = timeLow;
    metadata.timeMid = timeMid;
    metadata.timeHigh = timeHigh;
    metadata.clockSequence = clockSeq;
    metadata.node = node.match(/.{1,2}/g).join(':');
  }

  if (version === 4) {
    // Random UUID (v4)
    // Should have 4 in version position and 8/9/A/B in variant position
    const randomBytes = clean.substring(0, 12) + clean.substring(13);
    metadata.randomness = randomBytes;
  }

  if (version === 7) {
    // Unix timestamp-based UUID (v7)
    // Bits 0-47: timestamp (milliseconds)
    const timestamp = clean.substring(0, 12);
    const timestampMs = parseInt(timestamp, 16);
    const date = new Date(timestampMs);
    metadata.timestamp = timestamp;
    metadata.timestampMs = timestampMs;
    metadata.date = date.toISOString();
  }

  return metadata;
}

function detectCommonMistakes(input) {
  const mistakes = [];

  // Check for JWT-like pattern (three dot-separated base64 parts)
  if (input.includes('.') && input.split('.').length === 3) {
    mistakes.push('Input looks like a JWT token, not a UUID');
  }

  // Check for truncated UUID
  const clean = input.replace(/[^a-f0-9]/gi, '');
  if (clean.length > 0 && clean.length < 32 && clean.length > 20) {
    mistakes.push(`Looks like a truncated UUID (${clean.length}/32 characters)`);
  }

  // Check for mixed case with hyphens
  if (input.includes('-') && /[a-z]/.test(input) && /[A-Z]/.test(input)) {
    mistakes.push('Mixed case detected; UUIDs are case-insensitive (will be normalized to lowercase)');
  }

  // Check for extra whitespace
  if (input !== input.trim()) {
    mistakes.push('Extra whitespace detected; will be trimmed');
  }

  // Check for common copy/paste issues
  if (input.includes('\n') || input.includes('\r')) {
    mistakes.push('Contains newline characters; will be removed');
  }

  // Check for UUID without hyphens
  const noHyphens = input.replace(/-/g, '');
  if (noHyphens.length === 32 && /^[a-f0-9]{32}$/i.test(noHyphens)) {
    mistakes.push('Hyphens missing; will be auto-inserted');
  }

  return mistakes;
}

function validate(input) {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      error: 'Invalid input',
      input: input,
    };
  }

  const normalized = normalize(input);
  const commonMistakes = detectCommonMistakes(input);
  const structureValidation = validateStructure(normalized);

  return {
    input,
    normalized,
    valid: structureValidation.valid,
    error: structureValidation.error || null,
    ...(structureValidation.valid ? extractMetadata(normalized) : {}),
    commonMistakes,
  };
}

function generateV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateV1() {
  // Simplified v1: uses timestamp + random bits
  const timestamp = Date.now();
  const timeLow = (timestamp & 0xffffffff).toString(16).padStart(8, '0');
  const timeMid = ((timestamp >> 32) & 0xffff).toString(16).padStart(4, '0');
  const timeHiAndVersion = (((timestamp >> 48) & 0xfff) | 0x1000).toString(16).padStart(4, '0');
  const clockSeq = (Math.random() * 0x10000 | 0x8000).toString(16).padStart(4, '0');
  const node = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`;
}

function generateV7() {
  // Unix timestamp-based (v7)
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

  // Check if it looks like CSV
  const firstLine = lines[0] || '';
  const isCSV = firstLine.includes(',');

  if (isCSV) {
    // Parse CSV
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
        error: validation.error || null,
        normalized: validation.normalized || null,
      });
    }
  } else {
    // Parse as line-separated UUIDs
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const validation = validate(line);
        results.push({
          row: i + 1,
          input: line,
          valid: validation.valid,
          version: validation.version || null,
          error: validation.error || null,
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
  extractMetadata,
  detectCommonMistakes,
  validateBulk,
};
