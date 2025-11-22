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

### 6. **Smart Join OCR Words**
Fixes OCR artifacts where words are split with spaces:
- `Th is tex t` → intelligently rejoins fragmented text
- Detects word fragments (very short segments) and rejoins them
- Uses capital letter patterns to detect word boundaries

**Use Case:** OCR output often has random spaces between letters within words.

### 7. **Remove Timestamps**
Strips timestamp information from logs and chat exports:
- Chat format: `[14:03] Kyle: Hello` → `Hello`
- ISO format: `2024-01-15T14:30:00Z` → removed
- 24-hour format: `2024-01-15 14:30:00` → removed
- 12-hour format: `2:30:00 PM` → removed

**Use Case:** Processing chat logs or system logs where timestamps aren't needed.

### 8. **Trim Lines**
Removes leading and trailing whitespace from each line:
- `  text  ` → `text`
- Applies to every line individually
- Cleans up Word/Docs copy-paste artifacts

**Use Case:** Almost every text cleaning scenario benefits from trimming lines.

### 9. **Fix Punctuation Spacing**
Corrects spacing around punctuation marks:
- Removes space before: `,` `.` `!` `?` `;` `:`
- Ensures space after punctuation: `Hello.World` → `Hello. World`
- Fixes comma spacing: `Hello,world` → `Hello, world`

**Use Case:** Text with irregular spacing around punctuation needs standardization.

### 10. **Compress Multiple Spaces**
Reduces excessive spacing to single spaces:
- `Hello      world` → `Hello world`
- `word1   word2   word3` → `word1 word2 word3`
- Preserves intentional indentation at line starts

**Use Case:** Copy/paste from various sources often creates excessive spacing.

### 11. **Remove All Line Breaks**
Converts multiline text to a single line:
- `Line 1\nLine 2\nLine 3` → `Line 1 Line 2 Line 3`
- Removes all newlines and joins with spaces
- Different from "Flatten to Single Line" - removes ALL breaks

**Use Case:** When you need text as a single continuous line (e.g., for API submission, Twitter character limits).

### 12. **Remove Blank Lines**
Eliminates completely empty lines:
- Lines with only whitespace are removed
- Useful for condensing text
- Preserves intentional line structure (only removes empty ones)

**Use Case:** Chat logs and system exports often have excessive blank lines.

### 13. **Compress Excessive Line Breaks**
Reduces multiple consecutive newlines to a maximum of 2:
- `Line\n\n\n\nAnother` → `Line\n\nAnother`
- Maintains paragraph structure
- Prevents excessive spacing between sections

**Use Case:** Documents copied from various sources have inconsistent line breaking.

### 14. **Remove Duplicate Lines**
Eliminates repeated lines while preserving order:
- `apple\napple\nbanana` → `apple\nbanana`
- Preserves first occurrence
- Useful for deduplicating data

**Use Case:** Lists with repeating entries from copy/paste errors.

### 15. **Filter Non-ASCII Characters (3 Levels)**
Three different character filtering options:

**Option A: ASCII Only** - keeps only a-zA-Z0-9 and basic punctuation
- `Hello wörld!` → `Hello world!`
- Removes all accented characters and special Unicode

**Option B: Keep Accented Letters** - keeps ASCII + accented Latin characters
- `Café` → `Café` (keeps the accented é)
- `Hello 😀` → `Hello ` (removes emoji)

**Option C: Basic Punctuation Only** - keeps letters, numbers, spaces, and basic punctuation (.,!?;:)
- `Hello!!! @#$% World???` → `Hello! World?`
- Removes symbols and special characters
- Compresses repeated punctuation marks

**Use Case:** Removing non-English characters or non-standard symbols while preserving content.

### 16. **Flatten to Single Line (Legacy)**
Converts multiline text to a single line (legacy option):
- Similar to "Remove All Line Breaks" but kept for backward compatibility
- Use "Remove All Line Breaks" for new projects

## Configuration Options

Each operation can be toggled independently:

| Option | Default | Purpose |
|--------|---------|---------|
| Remove PDF Garbage | ON | Strip PDF extraction artifacts |
| Remove Invisible Characters | ON | Remove Unicode zero-width chars |
| Strip HTML Tags | ON | Remove HTML markup |
| Strip Markdown | ON | Remove Markdown syntax |
| Normalize Whitespace | ON | Convert tabs/special spaces to regular spaces |
| Smart Join OCR Words | OFF | Fix OCR word fragmentation |
| Fix Punctuation Spacing | ON | Correct spacing around punctuation |
| Compress Spaces | ON | Reduce multiple spaces to single space |
| Trim Lines | ON | Remove leading/trailing spaces |
| Remove All Line Breaks | OFF | Flatten to single line |
| Remove Blank Lines | ON | Eliminate empty lines |
| Compress Line Breaks | ON | Reduce excessive newlines |
| Remove Timestamps | OFF | Strip log timestamps (disabled by default) |
| Remove Duplicates | OFF | Remove duplicate lines |
| Filter Characters | None | ASCII only / Keep accents / Basic punctuation |
| Flatten to Single Line | OFF | Legacy single-line converter |

## Usage Examples

### Example 1: Remove Line Breaks (Flatten Text)
**Input:**
```
i want
this
on
one line
```
**Config:** Enable "Remove All Line Breaks"
**Output:**
```
i want this on one line
```

### Example 2: Fix OCR Spacing
**Input:**
```
Th is tex t c ame from an O C R scan
```
**Config:** Enable "Smart Join OCR Words" and "Compress Spaces"
**Output:**
```
Thistextcamefroman OCRscan
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

### Example 4: Remove Special Characters
**Input:**
```
Hello wörld! Café with 😀 emojis and @#$% symbols
```
**Config:** Filter Characters → "ASCII Only"
**Output:**
```
Hello world! Cafe with emojis and symbols
```

### Example 5: Keep Accents but Remove Emojis
**Input:**
```
Café résumé 😀 naïve straße
```
**Config:** Filter Characters → "Keep Accented Letters"
**Output:**
```
Café résumé naïve straße
```

## Technical Details

### Function Structure
- **`cleanText(text, config)`** - Main function with all 16 cleaning stages
- **Helper Functions:**
  - `removePdfAndGarbageChars()` - Handles PDF artifacts
  - `removeInvisibleUnicodeChars()` - Removes invisible Unicode
  - `normalizeAllWhitespace()` - Normalizes all whitespace types
  - `stripMarkdownFormatting()` - Removes Markdown syntax
  - `smartJoinWords()` - Fixes OCR word fragmentation
  - `removeLogTimestamps()` - Strips log timestamps
  - `fixPunctuationSpacing()` - Corrects punctuation spacing
  - `compressExcessiveSpacing()` - Reduces excess whitespace
  - `filterToAsciiOnly()` - Removes non-ASCII characters
  - `filterToAsciiWithAccents()` - Keeps accented Latin letters
  - `filterToBasicPunctuation()` - Removes special characters

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

### For Line Break Removal
- Use **"Remove All Line Breaks"** to flatten multiline text to single line
- Use **"Remove Blank Lines"** to just remove empty lines
- Use **"Compress Line Breaks"** to reduce multiple newlines to 2

### For Character Filtering
- Use **"ASCII Only"** when you need plain English only (no accents, no emojis)
- Use **"Keep Accented Letters"** when you need to preserve international characters
- Use **"Basic Punctuation"** when you want to remove special symbols but keep standard punctuation

### For OCR Cleanup
- Enable **"Smart Join OCR Words"** for text from OCR/image scanning
- Enable **"Compress Spaces"** for excessive spacing artifacts
- Combine with other options for comprehensive cleanup

## Real-World Scenarios

### Scenario 1: OCR Text from Document Scan
Enable: Smart Join OCR Words, Compress Spaces, Remove Blank Lines
Disable: All others are default

**Result:** OCR text with restored word spacing and clean formatting.

### Scenario 2: Chat/Log Export
Enable: Remove Timestamps, Remove Blank Lines
Disable: Everything else from defaults

**Result:** Clean messages without timestamps, proper structure preserved.

### Scenario 3: International Text Cleanup
Enable: Filter Characters → "Keep Accented Letters"
Disable: Everything else from defaults

**Result:** Clean text preserving accented characters (café, résumé, naïve).

### Scenario 4: Plain ASCII Only
Enable: Filter Characters → "ASCII Only"
Disable: Everything else from defaults

**Result:** Pure ASCII text, no accents or special characters.

### Scenario 5: Single-Line Text (for APIs/URLs)
Enable: Remove All Line Breaks, Remove Blank Lines
Disable: Everything else from defaults

**Result:** Single continuous line ready for character-limited platforms.

## Implementation Notes

- The filter is part of the Text Toolkit and also available as a standalone "Clean Text" tool
- All operations are chainable and can be combined
- The order of operations is carefully designed to prevent conflicts
- Each stage builds on the previous cleaned text
- All operations preserve the core content while removing artifacts

## New Features (Latest Update)

### Smart Join OCR Words
- Intelligently detects and rejoins OCR-fragmented words
- Uses capital letter patterns to identify word boundaries
- Leaves obviously correct spacing intact

### Remove All Line Breaks
- Complete line break removal (converts to single line)
- Different from "Flatten" - removes ALL newlines
- Joins lines with single spaces

### Character Filtering (3 Levels)
- ASCII Only: Plain English text only
- Keep Accented: Preserves international characters
- Basic Punctuation: Removes symbols, keeps standard punctuation

## Future Enhancements

Potential additions:
- Pattern-based cleaning (custom regex)
- Case normalization options
- Language-specific cleaning
- Character encoding detection
- Custom whitespace rules
- Batch processing support
- Undo/redo for individual operations
