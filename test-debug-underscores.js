const input = 'This _text is _kind of _broken_';

console.log('Input:', input);
console.log('Underscore count:', (input.match(/_/g) || []).length);

// Test valid underscore patterns
const pattern1 = /__[^_\n]+__/g;
const pattern2 = /(?<!_)_[^_\n]+_(?!_)/g;

console.log('\nBold underscores (__ ... __):', (input.match(pattern1) || []).length);
console.log('  Matches:', input.match(pattern1) || 'none');

console.log('\nSingle underscores (_ ... _):', (input.match(pattern2) || []).length);
console.log('  Matches:', input.match(pattern2) || 'none');

// Simpler pattern - just find _word_ anywhere
const simplePattern = /_[a-zA-Z]+_/g;
console.log('\nSimple _word_ pattern:', (input.match(simplePattern) || []).length);
console.log('  Matches:', input.match(simplePattern) || 'none');

// What features would be detected?
const features = {
  emphasis: /\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_/g.test(input),
  inlineCode: /`[^`]+`/g.test(input),
};

console.log('\nFeatures detected:', features);
