const pattern = /^\d+(?:\.\d+)?\s*(?:[a-z°µ²³\/\-°\s]+)(?:\s*(?:per|\/)\s*[a-z°µ²³\/\-°\s]+)?s?$/i;
const unitExtractPattern = /\s+([a-z°µ²³\/\-°\s]+?)s?$/i;

const testCases = [
  '50 kg',
  '50 kilogram',
  '5 kilogram',
  '50 celsius',
  '50 celcius',
  '100 metes',
];

for (const test of testCases) {
  const matches = pattern.test(test);
  let unitMatch = null;
  if (matches) {
    const extracted = test.match(unitExtractPattern);
    if (extracted) {
      unitMatch = extracted[1].trim();
    }
  }
  console.log(`"${test}" → regex: ${matches ? 'YES' : 'NO'}, unit: "${unitMatch}"`);
}
