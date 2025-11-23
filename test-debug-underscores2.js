const input = 'This _text is _kind of _broken_';

console.log('Input:', input);
console.log('Underscore count:', (input.match(/_/g) || []).length);

// New patterns
const boldPattern = /__[^_\n]{1,100}__/g;
const italicPattern = /\b_[^_\n]{1,100}_\b/g;

console.log('\nBold underscores (__ ... __):', (input.match(boldPattern) || []).length);
console.log('  Matches:', input.match(boldPattern) || 'none');

console.log('\nWord-boundary italic (_ ... _):', (input.match(italicPattern) || []).length);
console.log('  Matches:', input.match(italicPattern) || 'none');

const validCount = (input.match(boldPattern) || []).length + 
                   (input.match(italicPattern) || []).length;

console.log('\nTotal valid pairs:', validCount);
console.log('Check: underscoreCount (4) > validCount * 2.5 (0)?', 4 > (validCount * 2.5));
console.log('Should be broken:', 4 >= 3 && validCount === 0);

// Test with actual valid markdown
const validInput = 'This is _italic_ and **bold** text';
console.log('\n--- Testing valid markdown ---');
console.log('Input:', validInput);
const validItalicCount = (validInput.match(italicPattern) || []).length;
console.log('Valid italic pairs:', validItalicCount);
