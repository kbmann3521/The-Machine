const validUnits = new Set([
  'kg', 'g', 'mg', 'lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces', 'ton', 'tonne', 'tonnes', 'stone', 'st', 't', 'carat', 'grain', 'grains',
  'm', 'meter', 'meters', 'metre', 'metres', 'km', 'kilometer', 'kilometers', 'kilometre', 'kilometres', 'cm', 'mm', 'µm', 'nm', 'nanometer', 'nanometers', 'ft', 'feet', 'foot', 'mi', 'mile', 'miles', 'yd', 'yard', 'yards', 'in', 'inch', 'inches', 'nmi', 'nautical mile',
  'c', 'celsius', 'f', 'fahrenheit', 'k', 'kelvin', 'centigrade',
  'ms', 'm/s', 'kmh', 'km/h', 'kph', 'mph', 'm/hr', 'knot', 'knots',
  'l', 'liter', 'liters', 'litre', 'litres', 'ml', 'milliliter', 'millilitres', 'gal', 'gallon', 'gallons', 'cup', 'pint', 'pints', 'fl-oz', 'floz', 'fluid ounce',
  'bar', 'bars', 'psi', 'pa', 'pascal', 'pascals', 'atm', 'atmosphere', 'atmospheres', 'torr', 'mmhg', 'millibar', 'millibars', 'mbar',
  'j', 'joule', 'joules', 'cal', 'calorie', 'calories', 'kcal', 'kilocalorie', 'btu', 'kj', 'kwh', 'wh', 'erg', 'ergs', 'hp', 'w', 'watt', 'watts', 'kw', 'kilowatt',
  's', 'sec', 'second', 'seconds', 'min', 'minute', 'minutes', 'h', 'hr', 'hour', 'hours', 'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years',
  'b', 'byte', 'bytes', 'bit', 'bits', 'kb', 'mb', 'gb', 'tb', 'pb', 'kib', 'mib', 'gib', 'tib', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte',
  'hectare', 'hectares', 'ha', 'acre', 'acres'
]);

const testUnits = ['kilogram', 'kilograms', 'kg', 'celsius', 'celcius', 'meter', 'metes'];

for (const unit of testUnits) {
  const lower = unit.toLowerCase().replace(/s$/, '');
  const isValid = validUnits.has(lower) || validUnits.has(lower + 's');
  console.log(`"${unit}" → ${isValid ? 'VALID' : 'INVALID'} (normalized: "${lower}")`);
}
