const unitsByType = {
  length: ['meter', 'metres'],
  weight: ['kilogram', 'kilograms', 'kg', 'g', 'mg'],
  temperature: ['celsius', 'fahrenheit'],
  speed: ['m/s', 'kmh', 'mph'],
  volume: ['litre', 'liter', 'ml'],
  pressure: ['pascal', 'bar'],
  energy: ['joule', 'calorie'],
  time: ['second', 'minute', 'hour'],
  data: ['byte', 'bit', 'kb']
};

const tokens = ['50', 'kilogram'];

for (const token of tokens) {
  for (const [type, units] of Object.entries(unitsByType)) {
    if (units.includes(token)) {
      console.log(`Found exact match: "${token}" in ${type}`);
    }
  }
}

// Now test the full sequence
const token = 'kilogram';
let exactMatch = null;
for (const [type, units] of Object.entries(unitsByType)) {
  if (units.includes(token)) {
    exactMatch = type;
    break;
  }
}
console.log(`Exact match result for "kilogram": ${exactMatch}`);
