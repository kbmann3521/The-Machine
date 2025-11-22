# Advanced Clean Text Filter Guide

## Overview
The "Clean Text" filter (formerly "Remove Extras") is now an advanced, multi-stage text cleaning tool that handles complex real-world text cleaning challenges. It combines multiple specialized cleaning operations into a single, configurable tool.

## What It Does
The filter processes text through 16 different cleaning stages, each addressing specific text quality issues:

### 1. **Remove PDF Garbage Characters**
Removes corrupted characters from PDF text extraction, including:
- BOM (Byte Order Mark): `ï»¿`
- Soft hyphens: `­`
- Control characters and PDF artifacts

**Use Case:** Text copied from PDF documents often contains garbage characters that need removal.

### 2. **Remove Invisible Unicode Characters**
Eliminates hidden formatting characters that can cause issues:
- Zero-width space: `\u200B`
- Zero-width joiner: `\u200D`
- Zero-width non-joiner: `\u200C`
- Word joiner: `\u2060`
- Line separators: `\u2028` → converts to newline
- Paragraph separators: `\u2029` → converts to newline

**Use Case:** Text from email exports or fancy editors often contains these invisible characters.

### 3. **Strip HTML Tags**
Removes HTML markup, leaving only text content:
- `<p>Hello</p>` → `Hello`
- `<b>bold</b>` → `bold`
- Preserves all text content

**Use Case:** Cleaning HTML copied from websites or exported from web applications.

### 4. **Strip Markdown Formatting**
Removes Markdown syntax while preserving content:
- Bold: `**text**` or `__text__` → `text`
- Italic: `*text*` or `_text_` → `text`
- Strikethrough: `~~text~~` → `text`
- Code: `` `code` `` → `code`
- Headings: `# Title` → `Title`
- Links: `[text](url)` → `text`
- Lists: `- item` → `item`

**Use Case:** Converting Markdown documents to plain text while preserving the content.

### 5. **Normalize Whitespace**
Converts all types of whitespace to standard spaces:
- Tabs → single space
- Non-breaking space (NBSP): `\u00A0` → space
- Em space, en space, etc. → space
- Normalizes all Unicode whitespace variants

**Use Case:** Text from Word documents often uses special whitespace that needs normalization.

### 6. **Fix Punctuation Spacing**
Corrects spacing around punctuation marks:
- Removes space before: `,` `.` `!` `?` `;` `:`
- Ensures space after punctuation: `Hello.World` → `Hello. World`
- Fixes comma spacing: `Hello,world` → `Hello, world`

**Use Case:** Text with irregular spacing around punctuation needs standardization.

### 7. **Compress Multiple Spaces**
Reduces excessive spacing to single spaces:
- `Hello      world` → `Hello world`
- `word1   word2   word3` → `word1 word2 word3`
- Preserves intentional indentation at line starts

**Use Case:** Copy/paste from various sources often creates excessive spacing.

### 8. **Trim Lines**
Removes leading and trailing whitespace from each line:
- `  text  ` → `text`
- Applies to every line individually
- Cleans up Word/Docs copy-paste artifacts

**Use Case:** Almost every text cleaning scenario benefits from trimming lines.

### 9. **Remove Blank Lines**
Eliminates completely empty lines:
- Lines with only whitespace are removed
- Useful for condensing text
- Preserves intentional line structure

**Use Case:** Chat logs and system exports often have excessive blank lines.

### 10. **Compress Excessive Line Breaks**
Reduces multiple consecutive newlines to a maximum of 2:
- `Line\n\n\n\nAnother` → `Line\n\nAnother`
- Maintains paragraph structure
- Prevents excessive spacing between sections

**Use Case:** Documents copied from various sources have inconsistent line breaking.

### 11. **Remove Log Timestamps** (Optional)
Strips timestamp information from logs and chat exports:
- Chat format: `[14:03] Kyle: Hello` → `Hello`
- ISO format: `2024-01-15T14:30:00Z` → removed
- 24-hour format: `2024-01-15 14:30:00` → removed
- 12-hour format: `2:30:00 PM` → removed

**Use Case:** Processing chat logs or system logs where timestamps aren't needed.

### 12. **Remove Duplicate Lines** (Optional)
Eliminates repeated lines while preserving order:
- `apple\napple\nbanana` → `apple\nbanana`
- Preserves first occurrence
- Useful for deduplicating data

**Use Case:** Lists with repeating entries from copy/paste errors.

### 13. **Flatten to Single Line** (Optional)
Converts multiline text to a single line:
- `Line 1\nLine 2\nLine 3` → `Line 1 Line 2 Line 3`
- Removes all newlines
- Joins lines with spaces

**Use Case:** When you need text as a single continuous line (e.g., for API submission).

## Configuration Options

Each operation can be toggled independently:

| Option | Default | Purpose |
|--------|---------|---------|
| Remove PDF Garbage | ON | Strip PDF extraction artifacts |
| Remove Invisible Characters | ON | Remove Unicode zero-width chars |
| Strip HTML Tags | ON | Remove HTML markup |
| Strip Markdown | ON | Remove Markdown syntax |
| Normalize Whitespace | ON | Convert tabs/special spaces to regular spaces |
| Fix Punctuation Spacing | ON | Correct spacing around punctuation |
| Compress Spaces | ON | Reduce multiple spaces to single space |
| Trim Lines | ON | Remove leading/trailing spaces |
| Remove Blank Lines | ON | Eliminate empty lines |
| Compress Line Breaks | ON | Reduce excessive newlines |
| Remove Timestamps | OFF | Strip log timestamps (disabled by default) |
| Remove Duplicates | OFF | Remove duplicate lines |
| Flatten to Single Line | OFF | Convert to single line (disabled by default) |

## Usage Examples

### Example 1: Messy Copy/Paste
**Input:**
```
Hello      world     
this     is      spaced     weirdly.
```
**Config:** Use defaults (all standard options enabled)
**Output:**
```
Hello world
this is spaced weirdly.
```

### Example 2: PDF Text Extraction
**Input:**
```
This text contains ï»¿garbage characters from a PDF.
```
**Config:** Remove PDF Garbage enabled
**Output:**
```
This text contains garbage characters from a PDF.
```

### Example 3: Chat Log Cleaning
**Input:**
```
[14:03] Kyle: Hello
[14:04] John: test
[14:05] Sarah: ok
```
**Config:** Enable "Remove Timestamps"
**Output:**
```
Hello
test
ok
```

### Example 4: Flattening Multiline Text
**Input:**
```
The quick
brown fox
jumped over
the lazy dog
```
**Config:** Enable "Flatten to Single Line"
**Output:**
```
The quick brown fox jumped over the lazy dog
```

## Technical Details

### Function Structure
- **`cleanText(text, config)`** - Main function with all 13 cleaning stages
- **Helper Functions:**
  - `removePdfAndGarbageChars()` - Handles PDF artifacts
  - `removeInvisibleUnicodeChars()` - Removes invisible Unicode
  - `normalizeAllWhitespace()` - Normalizes all whitespace types
  - `stripMarkdownFormatting()` - Removes Markdown syntax
  - `removeLogTimestamps()` - Strips log timestamps
  - `fixPunctuationSpacing()` - Corrects punctuation spacing
  - `compressExcessiveSpacing()` - Reduces excess whitespace

### Performance
- Processes text in single pass with multiple operations
- Each operation is independent and can be toggled
- Suitable for texts of any length
- Optimized with regex patterns for efficiency

### Compatibility
- Works with all text encodings (UTF-8, UTF-16, etc.)
- Handles all Unicode characters correctly
- Preserves intentional formatting when operations are disabled
- Safe to run multiple times (idempotent)

## When to Use Each Option

### Keep All Defaults
Use when:
- Text needs general-purpose cleaning
- Source is unknown or mixed
- Want comprehensive cleanup without configuration

### Customize Options
Use when:
- Need to preserve specific formatting
- Want fine-grained control over cleanup
- Have specific text source quirks to handle
- Need to preserve timestamps or duplicates

### Disable Certain Options
- Disable "Remove Blank Lines" to preserve paragraph structure
- Disable "Compress Line Breaks" to keep intentional spacing
- Disable "Strip HTML" if HTML is intentional
- Disable "Strip Markdown" if Markdown structure matters
- Disable "Fix Punctuation" if unusual spacing is intentional

## Real-World Scenarios

### Scenario: Blog Post from Google Docs
Enable: PDF Garbage, Invisible Chars, HTML, Markdown, Whitespace, Punctuation, Compression, Trim
Disable: Remove Timestamps, Duplicates, Flatten

**Result:** Clean, well-formatted text preserving paragraph structure.

### Scenario: Chat Conversation Export
Enable: All standard options + Remove Timestamps
Disable: Duplicates (preserve individual messages), Flatten

**Result:** Clean messages without timestamps, proper line breaks.

### Scenario: Data Import from Mixed Sources
Enable: All standard options + Remove Duplicates
Disable: Flatten

**Result:** Clean, deduplicated data with preserved line structure.

### Scenario: Tweet or SMS Preparation
Enable: All standard options + Flatten to Single Line
Disable: Others as needed

**Result:** Single-line text ready for character-limited platforms.

## Implementation Notes

- The filter is part of the Text Toolkit and also available as a standalone "Clean Text" tool
- All operations are chainable and can be combined
- The order of operations is carefully designed to prevent conflicts
- Each stage builds on the previous cleaned text
- All operations preserve the core content while removing artifacts

## Future Enhancements

Potential additions:
- Pattern-based cleaning (custom regex)
- Case normalization options
- Language-specific cleaning
- Character encoding detection
- Custom whitespace rules
- Batch processing support
