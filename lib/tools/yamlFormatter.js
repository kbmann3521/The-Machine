// lib/tools/yamlFormatter.js

/* ============================
 *  LOAD DEPENDENCIES
 * ============================ */

let yaml = null;
let yamlLint = null;
let toml = null;

try {
  yaml = require('yaml'); // BEST library
} catch (e) {
  try {
    yaml = require('js-yaml'); // fallback
  } catch (e2) {
    yaml = null;
  }
}

try {
  if (typeof window === 'undefined') {
    yamlLint = require('yaml-lint');
  }
} catch (e) {}

try {
  toml = require('@iarna/toml');
} catch (e) {}



/* ============================
 *  VALIDATION (STRICT)
 * ============================ */

function validateYAML(input) {
  const errors = [];

  if (!yaml) {
    return {
      valid: false,
      errors: [{
        message: "YAML parser not available",
        line: null,
        column: null
      }]
    };
  }

  try {
    yaml.parse(input);
    return { valid: true, errors: [] };
  } catch (err) {
    let line = err.linePos ? err.linePos.start.line : null;
    let col = err.linePos ? err.linePos.start.col : null;

    return {
      valid: false,
      errors: [{
        message: err.message,
        line,
        column: col
      }]
    };
  }
}



/* ============================
 *  DIAGNOSTICS ENGINE
 * ============================ */

async function lintYAML(input) {
  if (!yamlLint) return [];

  try {
    const result = await yamlLint.lint(input);
    if (!result) return [];

    // yaml-lint returns ONE error only unfortunately
    return [{
      type: "warning",
      category: "lint",
      message: result,
      line: null,
      column: null
    }];
  } catch (err) {
    return [];
  }
}



/* ============================
 *  FORMATTING (BEAUTIFY / MINIFY)
 * ============================ */

function beautifyYAML(input, indentSize) {
  if (!yaml) return input;

  try {
    const obj = yaml.parse(input);

    return yaml.stringify(obj, {
      indent: indentSize,
      lineWidth: 0
    });
  } catch {
    return input; // cannot beautify invalid YAML
  }
}

function minifyYAML(input) {
  if (!yaml) return input;

  try {
    const obj = yaml.parse(input);

    // stringify with no spacing
    return yaml.stringify(obj, {
      indent: 0,
      lineWidth: 0
    }).replace(/\n+/g, '');
  } catch {
    return input;
  }
}



/* ============================
 *  COMMENT REMOVAL
 * ============================ */

function yamlRemoveComments(text) {
  return text
    .split("\n")
    .map(line => {
      const idx = line.indexOf("#");
      if (idx === -1) return line;
      const before = line.slice(0, idx).trimEnd();
      return before.length > 0 ? before : "";
    })
    .join("\n")
    .trim();
}



/* ============================
 *  CONVERSIONS
 * ============================ */

function yamlToJson(text) {
  try {
    if (!yaml) return { error: "YAML parser missing" };
    const obj = yaml.parse(text);
    return JSON.stringify(obj, null, 2);
  } catch (err) {
    return { error: err.message };
  }
}

function yamlToToml(text) {
  try {
    if (!yaml) return { error: "YAML parser missing" };
    if (!toml) return { error: "TOML module missing (@iarna/toml)" };
    const obj = yaml.parse(text);
    return toml.stringify(obj);
  } catch (err) {
    return { error: err.message };
  }
}

function yamlToEnv(text) {
  try {
    if (!yaml) return { error: "YAML parser missing" };
    const obj = yaml.parse(text);

    const envLines = [];

    function walk(o, prefix = "") {
      Object.entries(o).forEach(([k, v]) => {
        const key = (prefix ? prefix + "_" : "") + k.toUpperCase();

        if (v && typeof v === 'object' && !Array.isArray(v)) {
          walk(v, key);
        } else {
          envLines.push(`${key}=${JSON.stringify(v)}`);
        }
      });
    }

    walk(obj);
    return envLines.join("\n");

  } catch (err) {
    return { error: err.message };
  }
}



/* ============================
 *  FLATTEN YAML
 * ============================ */

function flattenYAML(text) {
  try {
    const obj = yaml.parse(text);
    const out = [];

    function flatten(o, prefix = "") {
      Object.entries(o).forEach(([k, v]) => {
        const path = prefix ? `${prefix}.${k}` : k;

        if (v && typeof v === "object" && !Array.isArray(v)) {
          flatten(v, path);
        } else if (Array.isArray(v)) {
          v.forEach((val, idx) => {
            out.push(`${path}.${idx} = ${JSON.stringify(val)}`);
          });
        } else {
          out.push(`${path} = ${JSON.stringify(v)}`);
        }
      });
    }

    flatten(obj);
    return out.join("\n");
  } catch (err) {
    return { error: err.message };
  }
}



/* ============================
 *  MAIN FORMATTER
 * ============================ */

async function yamlFormatter(input, config = {}) {
  const mode = config.mode || "beautify";
  const indent = parseInt(config.indentSize || "2", 10);
  const removeComments = !!config.removeComments;
  const showLinting = config.showLinting !== false;

  let working = input;

  // STEP 1 — remove comments if needed
  if (removeComments) {
    working = yamlRemoveComments(working);
  }

  // STEP 2 — run strict validation
  const validation = validateYAML(working);

  // If YAML is invalid → do NOT format → return only diagnostics
  const isWellFormed = validation.valid;

  // Tell UI whether to show output
  const hideOutput = !isWellFormed;

  let formatted = working;

  // STEP 3 — apply transformation only if valid
  if (isWellFormed) {
    switch (mode) {
      case "beautify":
        formatted = beautifyYAML(working, indent);
        break;
      case "minify":
        formatted = minifyYAML(working);
        break;
      case "flatten":
        formatted = flattenYAML(working);
        break;
      case "to-json":
        formatted = yamlToJson(working);
        break;
      case "to-toml":
        formatted = yamlToToml(working);
        break;
      case "to-env":
        formatted = yamlToEnv(working);
        break;
      default:
        formatted = beautifyYAML(working, indent);
    }
  }

  // STEP 4 — Linting (only if valid)
  let lintDiagnostics = [];
  if (showLinting && isWellFormed) {
    lintDiagnostics = await lintYAML(working);
  }

  // STEP 5 — diagnostics output
  const diagnostics = [];

  if (!isWellFormed) {
    diagnostics.push(
      ...validation.errors.map(e => ({
        type: "error",
        category: "syntax",
        message: e.message,
        line: e.line,
        column: e.column
      }))
    );
  }

  diagnostics.push(...lintDiagnostics);

  return {
    ok: true,
    isWellFormed,
    hideOutput,

    formatted: hideOutput ? "" : formatted,
    diagnostics
  };
}




/* ============================
 *  EXPORTS
 * ============================ */

module.exports = { yamlFormatter };
