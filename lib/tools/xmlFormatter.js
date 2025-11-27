// lib/tools/xmlFormatter.js

const { XMLParser, XMLBuilder } = require("fast-xml-parser");
const { DOMParser: NodeDOMParser } = require("@xmldom/xmldom");

/* -----------------------------------------------------
   1. VALIDATION USING DOMPARSER
----------------------------------------------------- */
function domValidate(xmlString) {
  let DOMParserImpl =
    typeof DOMParser !== "undefined" ? DOMParser : NodeDOMParser;

  try {
    const doc = new DOMParserImpl().parseFromString(
      xmlString,
      "application/xml"
    );
    const errors = doc.getElementsByTagName("parsererror");

    if (errors && errors.length > 0) {
      const msg =
        errors[0].textContent ||
        errors[0].text ||
        "Unknown XML parse error.";
      return msg.trim();
    }
  } catch (err) {
    return String(err);
  }

  return null;
}

/* -----------------------------------------------------
   2. XML AUTO-REPAIR WITH FIXES
----------------------------------------------------- */
function repairMalformedFragments(xml) {
  return xml
    .replace(/<([a-zA-Z0-9:_-]+)([^>]*)$/gm, "<$1$2>") // Fix missing '>'
    .replace(/<\/([a-zA-Z0-9:_-]+)([^>]*)$/gm, "</$1>") // Fix missing '>' in closing tag
    .replace(/<!\[CDATA\[[\s\S]*?(?=\]\]>)/gm, match =>
      match.replace(/]]>/g, "")
    );
}

function autoRepairXML(xmlString) {
  const cleaned = repairMalformedFragments(xmlString);

  const parser = new XMLParser({
    ignoreAttributes: false,
    allowBooleanAttributes: true,
    preserveOrder: false,
    trimValues: false,
    parseTagValue: false,
    commentPropName: "#comment",
    cdataPropName: "#cdata"
  });

  let parsed;
  try {
    parsed = parser.parse(cleaned);
  } catch (err) {
    return {
      ok: false,
      stage: "parse",
      error: "XML is too malformed to repair.",
      rawError: String(err),
      repairedXml: null
    };
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: false
  });

  const rebuilt = builder.build(parsed);

  const validationError = domValidate(rebuilt);
  if (validationError) {
    return {
      ok: false,
      stage: "validate",
      error: "XML repaired, but still invalid.",
      validationError,
      repairedXml: rebuilt
    };
  }

  return {
    ok: true,
    stage: "repaired",
    repairedXml: rebuilt
  };
}

/* -----------------------------------------------------
   3. CLEANUP TOGGLES
----------------------------------------------------- */
function applyCleanupOptions(xml, opts) {
  let out = xml;

  if (opts.removeDeclaration) {
    out = out.replace(/<\?xml[^>]*\?>/g, "").trimStart();
  }

  if (opts.removeComments) {
    out = out.replace(/<!--[\s\S]*?-->/g, "");
  }

  if (opts.removeCDATA) {
    out = out.replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1");
  }

  if (opts.trimWhitespaceBetweenTags) {
    out = out.replace(/>\s+</g, "><");
  }

  return out;
}

/* -----------------------------------------------------
   4. BEAUTIFICATION
----------------------------------------------------- */
function beautifyXML(xmlString, indentSize) {
  const indent =
    indentSize === "tab" ? "\t" : " ".repeat(Number(indentSize));

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    indentBy: indent,
    suppressEmptyNode: false
  });

  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: false,
    parseTagValue: false,
    allowBooleanAttributes: true,
    commentPropName: "#comment",
    cdataPropName: "#cdata"
  });

  const parsed = parser.parse(xmlString);
  return builder.build(parsed);
}

/* -----------------------------------------------------
   5. SAFE MINIFIER (NEW, FIXED)
----------------------------------------------------- */
function safeMinifyXML(xml) {
  return xml
    .replace(/>\s+</g, "><") // collapse whitespace between tags
    .replace(/\s*\n\s*/g, "") // remove newlines entirely
    .trim(); // final trim
}

/* -----------------------------------------------------
   6. MAIN FORMATTER
----------------------------------------------------- */
function formatFinalXML(xmlString, mode, indentSize) {
  if (mode === "minify") {
    return safeMinifyXML(xmlString);
  }

  if (mode === "beautify") {
    return beautifyXML(xmlString, indentSize);
  }

  return xmlString;
}

/* -----------------------------------------------------
   7. TOP-LEVEL PROCESSOR
----------------------------------------------------- */
function processXmlTool(inputXml, options = {}) {
  const {
    formatMode = "beautify",
    removeComments = false,
    removeCDATA = false,
    removeDeclaration = false,
    trimWhitespaceBetweenTags = false,
    indentSize = "2"
  } = options;

  let xml = inputXml;

  // 1. Auto-repair
  let repairedXml = xml;
  if (options.enableAutoRepair !== false) {
    const repairResult = autoRepairXML(xml);
    if (!repairResult.ok && !repairResult.repairedXml) {
      return {
        ok: false,
        stage: repairResult.stage,
        error: repairResult.error,
        rawError: repairResult.rawError || null
      };
    }
    repairedXml = repairResult.repairedXml || xml;
  }

  // 2. Validation
  const validationError = domValidate(repairedXml);

  // 3. Cleanup
  const cleanedXml = applyCleanupOptions(repairedXml, {
    removeComments,
    removeCDATA,
    removeDeclaration,
    trimWhitespaceBetweenTags
  });

  // 4. Beautify / Minify
  const finalXml = formatFinalXML(
    cleanedXml,
    formatMode,
    indentSize
  );

  return {
    ok: true,
    originalXml: inputXml,
    repairedXml,
    cleanedXml,
    finalXml,
    validation: {
      isValid: !validationError,
      error: validationError
    },
    optionsApplied: {
      formatMode,
      removeComments,
      removeCDATA,
      removeDeclaration,
      trimWhitespaceBetweenTags,
      indentSize
    }
  };
}

module.exports = {
  autoRepairXML,
  applyCleanupOptions,
  formatFinalXML,
  processXmlTool
};
