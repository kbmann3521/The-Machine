const { detectUnitType } = require('./lib/tools');

const testCases = [
  { input: '50 m/s', expectedType: 'speed' },
  { input: '50 ms', expectedType: 'speed' },
  { input: '50 kmh', expectedType: 'speed' },
  { input: '50 km/h', expectedType: 'speed' },
  { input: '50 mph', expectedType: 'speed' },
  { input: '50 miles per hour', expectedType: 'speed' },
  { input: '100 kilometers per hour', expectedType: 'speed' },
  { input: '5.5 kg', expectedType: 'weight' },
  { input: '150 pounds', expectedType: 'weight' },
  { input: '10 meters', expectedType: 'length' },
  { input: '5 miles', expectedType: 'length' },
  { input: '25 celsius', expectedType: 'temperature' },
  { input: '98.6 fahrenheit', expectedType: 'temperature' },
  { input: '500 ml', expectedType: 'volume' },
  { input: '2 liters', expectedType: 'volume' },
  { input: '100 joules', expectedType: 'energy' },
];

console.log('Testing unit detection patterns...\n');
let passed = 0;
let failed = 0;

testCases.forEach(test => {
  const result = detectUnitType(test.input);
  const status = result === test.expectedType ? '✅' : '❌';
  if (result === test.expectedType) passed++;
  else failed++;
  
  console.log(`${status} Input: "${test.input}" → Expected: ${test.expectedType}, Got: ${result}`);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
