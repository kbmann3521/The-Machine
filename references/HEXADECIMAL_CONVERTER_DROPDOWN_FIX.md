# Hexadecimal Converter "Replace with Output" Dropdown Fix

## Problem
The hexadecimal-converter tool was not showing format options in the "Replace with output" dropdown on the home page (index.js), even though:
- The backend (lib/tools/hexToTextConverter.js) correctly returned a `formats` object with all 4 variants
- The standalone tool page (HexToTextConverterTool.js) had the correct implementation
- Other tools (base64-converter, base-converter, text-toolkit) worked fine

## Root Cause
The home page (pages/index.js) has a hardcoded conditional chain that only builds dropdown results for specific tools:
```javascript
inputTabResults={
  selectedTool?.toolId === 'base64-converter' ? base64ConversionResults : 
  selectedTool?.toolId === 'base-converter' ? baseConverterConversionResults : 
  caseConversionResults
}
```

The `hexadecimal-converter` tool ID was not included in this chain, so even though the tool executed correctly and produced formats, the dropdown never received them.

## Solution
Added two changes to pages/index.js:

### 1. Added hexConverterResults Builder (lines 1150-1164)
```javascript
// Generate hex converter format results for INPUT tab chevron menu
const hexConverterResults = (() => {
  if (selectedTool?.toolId !== 'hexadecimal-converter' || !outputResult?.formats) {
    return []
  }

  const formats = outputResult.formats
  return Object.entries(formats)
    .filter(([, value]) => value)
    .map(([label, value]) => ({
      label,
      value,
      onSelect: () => handleInputChange(value),
    }))
})()
```

### 2. Updated inputTabResults Conditional (line 1284)
```javascript
inputTabResults={
  selectedTool?.toolId === 'base64-converter' ? base64ConversionResults : 
  selectedTool?.toolId === 'base-converter' ? baseConverterConversionResults : 
  selectedTool?.toolId === 'hexadecimal-converter' ? hexConverterResults : 
  caseConversionResults
}
```

## Implementation Details
- Used `.filter(([, value]) => value)` to exclude empty format values
- Matched the pattern used by base64ConversionResults and baseConverterConversionResults
- Each dropdown item has: `label` (display name), `value` (hex string), `onSelect` callback
- The standalone HexToTextConverterTool.js already had the correct useMemo implementation

## Format Options Shown
When user converts text to hex via the hexadecimal-converter tool, the dropdown now displays:
1. **Compact** - `48656C6C6F` (no spacing)
2. **Space-Separated** - `48 65 6C 6C 6F` (spaced)
3. **With 0x Prefix** - `0x48, 0x65, 0x6C, 0x6C, 0x6F` (0x notation)
4. **C Format** - `\x48\x65\x6C\x6C\x6F` (C escape notation)

Users can click any option to replace the input with that format variant.

## Files Modified
- `pages/index.js` - Added hexConverterResults builder and updated inputTabResults conditional
- `components/HexToTextConverterTool.js` - Cleaned up, uses useMemo for inputTabResults
- `lib/tools/hexToTextConverter.js` - No changes needed (already returns formats object)
- `lib/tools.js` - No changes needed (hexadecimal-converter already in TOOLS export)

## Testing
Verified working by:
1. Entering text (e.g., "hello") in hexadecimal-converter
2. Clicking "Replace with output" dropdown chevron
3. Seeing all 4 format options appear
4. Clicking each option replaces input with that format variant
