const input = 'This is **bold**, *italic*, and ***both***.';

console.log('Input:', input);
console.log('Asterisk count:', (input.match(/\*/g) || []).length);

// Test patterns
const boldPattern = /\*\*[^*\n]+\*\*/g;
const italicPattern = /(?<!\*)\*[^*\n]+\*(?!\*)/g;

console.log('\nBold pairs (**):', (input.match(boldPattern) || []).length);
console.log('  Matches:', input.match(boldPattern) || 'none');

console.log('\nItalic pairs (*):', (input.match(italicPattern) || []).length);
console.log('  Matches:', input.match(italicPattern) || 'none');

// Check the ***both*** case
const boldItalicPattern = /\*\*\*[^*\n]+\*\*\*/g;
console.log('\nBold+italic pairs (***):', (input.match(boldItalicPattern) || []).length);
console.log('  Matches:', input.match(boldItalicPattern) || 'none');

// Overall check
const totalValidEmphasisPairs = (input.match(boldPattern) || []).length +
                                (input.match(italicPattern) || []).length;

console.log('\nTotal valid emphasis pairs:', totalValidEmphasisPairs);
console.log('Asterisk ratio check: 12 > (', totalValidEmphasisPairs, '* 2.5 =', totalValidEmphasisPairs * 2.5, ')?', 12 > (totalValidEmphasisPairs * 2.5));
