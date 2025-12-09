/**
 * Deterministic HTTP Status Code Lookup & Analyzer
 *
 * Supports:
 *  - Direct code lookup: "404"
 *  - Bulk codes: "200, 404, 500"
 *  - Log / response dump analysis: paste server logs, curl output, etc.
 *  - Text search: "payload too large" → 413
 *
 * No AI – everything is static data + simple matching.
 */

/* ==========================
 *  DATASET
 * ========================== */

const HTTP_STATUS_DATA = [
  // ==== 2xx ====
  {
    code: 200,
    name: "OK",
    category: "2xx Success",
    description: "The request succeeded and the server returned the requested data.",
    retryable: false,
    cacheable: true,
    typicalUse: "Successful GET, POST (when returning representation), or general success.",
    commonCauses: [
      "Normal successful request",
    ],
    devNotes:
      "Use as the default success status when there is a response body. For empty responses, prefer 204.",
    examples: {
      node: `res.status(200).json({ ok: true, data });`,
      nextjs: `return NextResponse.json({ ok: true, data }, { status: 200 });`,
      fastapi: `return {"ok": True, "data": data}  # default 200`,
    },
  },
  {
    code: 201,
    name: "Created",
    category: "2xx Success",
    description: "A new resource has been successfully created.",
    retryable: false,
    cacheable: false,
    typicalUse: "After successful POST that creates a new resource.",
    commonCauses: [
      "Successful creation of a row/object",
    ],
    devNotes:
      "Include a Location header pointing to the new resource when possible.",
    examples: {
      node: `res.status(201).json({ id, message: "Created" });`,
      nextjs: `return NextResponse.json({ id }, { status: 201, headers: { Location: "/items/" + id } });`,
      fastapi: `return JSONResponse(status_code=201, content={"id": new_id})`,
    },
  },
  {
    code: 204,
    name: "No Content",
    category: "2xx Success",
    description: "The server successfully processed the request and is not returning any content.",
    retryable: false,
    cacheable: false,
    typicalUse: "DELETE success, or idempotent update where no response body is needed.",
    commonCauses: [
      "Entity deleted successfully",
      "Update accepted without returning a body",
    ],
    devNotes:
      "Do not include a response body with 204; some clients break if body is present.",
    examples: {
      node: `res.status(204).end();`,
      nextjs: `return new Response(null, { status: 204 });`,
      fastapi: `return Response(status_code=204)`,
    },
  },

  // ==== 3xx ====
  {
    code: 301,
    name: "Moved Permanently",
    category: "3xx Redirection",
    description: "The resource has been permanently moved to a new URL.",
    retryable: true,
    cacheable: true,
    typicalUse: "Permanent redirects, especially for SEO (old route → new route).",
    commonCauses: [
      "Canonical URL changes",
      "Old endpoint replaced with new",
    ],
    devNotes:
      "Legacy semantics may change method on redirect (POST → GET). Prefer 308 if you need method preserved.",
    examples: {
      node: `res.redirect(301, "/new-path");`,
      nextjs: `return redirect("/new-path", 301);`,
      nginx: `return 301 https://example.com$new_uri;`,
    },
  },
  {
    code: 302,
    name: "Found (Temporary Redirect)",
    category: "3xx Redirection",
    description: "The resource temporarily resides under a different URI.",
    retryable: true,
    cacheable: false,
    typicalUse: "Short-term redirects where location may change again.",
    commonCauses: [
      "Login redirect",
      "A/B testing routes",
    ],
    devNotes:
      "Historically used as temporary redirect; many frameworks treat it similarly to 303.",
    examples: {
      node: `res.redirect(302, "/login");`,
      nextjs: `return redirect("/login"); // default is 307 in app router but behavior similar`,
    },
  },
  {
    code: 307,
    name: "Temporary Redirect",
    category: "3xx Redirection",
    description: "The resource temporarily resides at another URI and the method must not change.",
    retryable: true,
    cacheable: false,
    typicalUse: "Temporary redirects for POST/PUT where method must remain the same.",
    commonCauses: [
      "Service moved behind a gateway",
      "Maintenance mode redirect",
    ],
    devNotes:
      "Unlike 302, 307 guarantees that the method (e.g., POST) and body are preserved.",
    examples: {
      node: `res.redirect(307, "/maintenance");`,
    },
  },
  {
    code: 308,
    name: "Permanent Redirect",
    category: "3xx Redirection",
    description: "The resource has been permanently moved and the method must not change.",
    retryable: true,
    cacheable: true,
    typicalUse: "Permanent redirects for POST/PUT APIs where method must be preserved.",
    commonCauses: [
      "New permanent endpoint for write operations",
    ],
    devNotes:
      "Use this instead of 301 when redirecting non-GET methods (e.g., POST).",
    examples: {
      node: `res.redirect(308, "/v2/api");`,
    },
  },

  // ==== 4xx ====
  {
    code: 400,
    name: "Bad Request",
    category: "4xx Client Error",
    description: "The server could not understand the request due to invalid syntax.",
    retryable: false,
    cacheable: false,
    typicalUse: "Malformed JSON, missing required fields, invalid query parameters.",
    commonCauses: [
      "Invalid JSON body",
      "Missing or invalid required parameter",
      "Client sent data in unexpected format",
    ],
    devNotes:
      "Use for generic client errors. For semantic validation failures, 422 is often more precise.",
    examples: {
      node: `res.status(400).json({ error: "Invalid payload" });`,
    },
  },
  {
    code: 401,
    name: "Unauthorized",
    category: "4xx Client Error",
    description: "Authentication is required and has failed or not been provided.",
    retryable: true,
    cacheable: false,
    typicalUse: "Missing/invalid tokens, expired credentials.",
    commonCauses: [
      "Missing Authorization header",
      "Expired JWT",
      "Invalid API key",
    ],
    devNotes:
      "Return WWW-Authenticate header for schemes like Bearer or Basic when applicable.",
    examples: {
      node: `res.status(401).json({ error: "Unauthorized" });`,
    },
  },
  {
    code: 403,
    name: "Forbidden",
    category: "4xx Client Error",
    description: "The client is authenticated but does not have permission to access the resource.",
    retryable: false,
    cacheable: false,
    typicalUse: "User logged in but lacks the required role or scope.",
    commonCauses: [
      "User lacks required permission/role",
      "IP is blocked",
      "Access controlled by feature flag or ACL",
    ],
    devNotes:
      "Do not leak sensitive authorization details; a generic message is usually safer.",
    examples: {
      node: `res.status(403).json({ error: "Forbidden" });`,
    },
  },
  {
    code: 404,
    name: "Not Found",
    category: "4xx Client Error",
    description: "The requested resource could not be found on the server.",
    retryable: false,
    cacheable: true,
    typicalUse: "Unknown routes, deleted resources, or hidden resources.",
    commonCauses: [
      "Wrong URL or route",
      "Resource ID does not exist",
      "Frontend path not mapped on server",
    ],
    devNotes:
      "For security, many APIs return 404 instead of 403 to avoid revealing resource existence.",
    examples: {
      node: `res.status(404).json({ error: "Not found" });`,
      nextjs: `notFound(); // Next.js app router`,
    },
  },
  {
    code: 405,
    name: "Method Not Allowed",
    category: "4xx Client Error",
    description: "The request method is known by the server but is not supported for the target resource.",
    retryable: false,
    cacheable: true,
    typicalUse: "POST used on an endpoint that only allows GET, etc.",
    commonCauses: [
      "Incorrect HTTP method used in client",
      "Route only implemented for certain verbs",
    ],
    devNotes:
      "Include an Allow header listing valid methods when practical (e.g., 'Allow: GET, POST').",
    examples: {
      node: `res.set("Allow", "GET").status(405).end();`,
    },
  },
  {
    code: 409,
    name: "Conflict",
    category: "4xx Client Error",
    description: "The request conflicts with the current state of the resource.",
    retryable: false,
    cacheable: false,
    typicalUse: "Duplicate records, version conflicts, or state mismatches.",
    commonCauses: [
      "Trying to create a resource that already exists (duplicate email, slug, etc.)",
      "Optimistic concurrency/version check failed",
    ],
    devNotes:
      "Great choice when 'user already exists' or 'slug already taken'.",
    examples: {
      node: `res.status(409).json({ error: "User already exists" });`,
    },
  },
  {
    code: 413,
    name: "Payload Too Large",
    category: "4xx Client Error",
    description: "The request entity is larger than the server is willing or able to process.",
    retryable: true,
    cacheable: false,
    typicalUse: "File uploads, large JSON bodies.",
    commonCauses: [
      "Upload exceeds server body size limit",
      "Reverse proxy (Nginx) max body size too small",
    ],
    devNotes:
      "Consider documenting maximum payload size for clients. Increase body size limits if appropriate.",
    examples: {
      node: `// Express example
app.use(express.json({ limit: "1mb" }));`,
      nginx: `client_max_body_size 10m;`,
    },
  },
  {
    code: 415,
    name: "Unsupported Media Type",
    category: "4xx Client Error",
    description: "The server does not support the media type of the request payload.",
    retryable: false,
    cacheable: false,
    typicalUse: "Client sends Content-Type the API does not accept.",
    commonCauses: [
      "Sending text/plain instead of application/json",
      "Missing boundary in multipart/form-data",
      "Uploading file type not allowed by server",
    ],
    devNotes:
      "Document accepted media types in your API docs. Validate and reject unknown content types.",
    examples: {
      node: `if (req.headers["content-type"] !== "application/json") {
  return res.status(415).json({ error: "Unsupported media type" });
}`,
    },
  },
  {
    code: 418,
    name: "I'm a Teapot",
    category: "4xx Client Error (Joke)",
    description: "Defined in RFC 2324 as an April Fools' joke. Sometimes used for playful APIs.",
    retryable: false,
    cacheable: false,
    typicalUse: "Easter eggs, playful endpoints.",
    commonCauses: [
      "You found an easter egg 😄",
    ],
    devNotes:
      "Never use in serious production semantics; it's for fun only.",
    examples: {
      node: `res.status(418).json({ error: "I'm a teapot" });`,
    },
  },
  {
    code: 422,
    name: "Unprocessable Entity",
    category: "4xx Client Error",
    description: "The request is syntactically correct but semantically invalid.",
    retryable: false,
    cacheable: false,
    typicalUse: "Validation errors, domain rules not satisfied.",
    commonCauses: [
      "Missing required business fields",
      "Violating domain rules (e.g., endDate < startDate)",
    ],
    devNotes:
      "Great for distinguishing validation errors from generic 400 syntax errors.",
    examples: {
      node: `res.status(422).json({ error: "Validation failed", details: errors });`,
    },
  },
  {
    code: 429,
    name: "Too Many Requests",
    category: "4xx Client Error",
    description: "The user has sent too many requests in a given amount of time (rate limiting).",
    retryable: true,
    cacheable: false,
    typicalUse: "Rate limits on APIs, login throttling.",
    commonCauses: [
      "Client exceeded rate limit or quota",
    ],
    devNotes:
      "Include Retry-After header when possible. Make limits clear in documentation.",
    examples: {
      node: `res.set("Retry-After", "60").status(429).json({ error: "Too many requests" });`,
    },
  },

  // ==== 5xx ====
  {
    code: 500,
    name: "Internal Server Error",
    category: "5xx Server Error",
    description: "The server encountered an unexpected condition that prevented it from fulfilling the request.",
    retryable: true,
    cacheable: false,
    typicalUse: "Unhandled exceptions, crashes, or generic server failures.",
    commonCauses: [
      "Null/undefined access",
      "Unhandled exceptions",
      "Misconfigured environment variables",
      "Unexpected database errors",
    ],
    devNotes:
      "Log the detailed error server-side but return a generic message to clients.",
    examples: {
      node: `try {
  // ...
} catch (err) {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}`,
    },
  },
  {
    code: 502,
    name: "Bad Gateway",
    category: "5xx Server Error",
    description: "The server was acting as a gateway or proxy and received an invalid response from the upstream server.",
    retryable: true,
    cacheable: false,
    typicalUse: "Reverse proxies, API gateways, microservice chains.",
    commonCauses: [
      "Upstream service crashed or returned invalid HTTP",
      "Network issues between proxy and upstream",
    ],
    devNotes:
      "Check upstream service health and logs. Often appears in load balancer or CDN logs.",
    examples: {
      nginx: `# usually raised automatically by Nginx/LB, not manually`,
    },
  },
  {
    code: 503,
    name: "Service Unavailable",
    category: "5xx Server Error",
    description: "The server is currently unable to handle the request due to temporary overload or maintenance.",
    retryable: true,
    cacheable: false,
    typicalUse: "Maintenance windows, temporary overload, circuit breakers.",
    commonCauses: [
      "Server overloaded",
      "Database temporarily unavailable",
      "Scheduled maintenance",
    ],
    devNotes:
      "Use Retry-After header to indicate when client may retry.",
    examples: {
      node: `res.set("Retry-After", "120").status(503).json({ error: "Service unavailable" });`,
    },
  },
  {
    code: 504,
    name: "Gateway Timeout",
    category: "5xx Server Error",
    description: "The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.",
    retryable: true,
    cacheable: false,
    typicalUse: "Slow upstream services behind a proxy.",
    commonCauses: [
      "Upstream service is too slow",
      "Network latency/timeouts between services",
    ],
    devNotes:
      "Improve upstream performance or increase timeouts carefully. Consider circuit breaker patterns.",
    examples: {
      nginx: `proxy_read_timeout 60s; # adjust with caution`,
    },
  },
];

// Map for O(1) code lookup
const HTTP_STATUS_MAP = new Map(
  HTTP_STATUS_DATA.map((entry) => [entry.code, entry])
);

/* ==========================
 *  HELPERS
 * ========================== */

/**
 * Extract all HTTP-like status codes (100–599) from a text.
 */
function extractCodesFromText(text) {
  const matches = text.match(/\b([1-5]\d{2})\b/g);
  if (!matches) return [];
  const unique = [...new Set(matches.map((m) => parseInt(m, 10)))];
  return unique.filter((code) => HTTP_STATUS_MAP.has(code));
}

/**
 * Try to guess what the user meant with free text (no code).
 * Very simple deterministic scoring: substring checks against
 * name, description, commonCauses, devNotes.
 */
function searchByText(query, limit = 3) {
  const q = query.toLowerCase();
  if (!q || !q.trim()) return [];

  const scored = HTTP_STATUS_DATA.map((entry) => {
    let score = 0;
    const haystack =
      (
        entry.name +
        " " +
        entry.description +
        " " +
        entry.commonCauses.join(" ") +
        " " +
        (entry.devNotes || "")
      ).toLowerCase();

    if (haystack.includes(q)) score += 3;

    // crude keyword heuristics
    if (q.includes("payload") || q.includes("too large") || q.includes("body size")) {
      if (entry.code === 413) score += 5;
    }
    if (q.includes("media type") || q.includes("content-type") || q.includes("unsupported")) {
      if (entry.code === 415) score += 5;
    }
    if (q.includes("rate limit") || q.includes("too many")) {
      if (entry.code === 429) score += 5;
    }
    if (q.includes("not found") || q.includes("missing")) {
      if (entry.code === 404) score += 4;
    }
    if (q.includes("unauthorized") || q.includes("auth") || q.includes("token")) {
      if (entry.code === 401 || entry.code === 403) score += 2;
    }

    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}

/**
 * Normalize the output for UI/API.
 */
function buildOutput(entry, framework) {
  const snippets = entry.examples || {};
  let snippet = null;

  if (framework && snippets[framework]) {
    snippet = snippets[framework];
  } else {
    // pick any first snippet as default
    const firstKey = Object.keys(snippets)[0];
    snippet = firstKey ? snippets[firstKey] : null;
  }

  return {
    code: entry.code,
    name: entry.name,
    category: entry.category,
    description: entry.description,
    retryable: entry.retryable,
    cacheable: entry.cacheable,
    typicalUse: entry.typicalUse,
    commonCauses: entry.commonCauses,
    devNotes: entry.devNotes,
    exampleSnippet: snippet,
  };
}

/* ==========================
 *  MAIN TOOL FUNCTION
 * ========================== */

/**
 * Main HTTP status lookup tool.
 *
 * @param {string} inputText - Raw user input (code, log, or description).
 * @param {object} config
 *   - mode: 'auto' | 'code' | 'log' | 'search'
 *   - framework: 'node' | 'nextjs' | 'fastapi' | 'nginx' | ...
 */
function httpStatusLookup(inputText, config = {}) {
  const {
    mode = "auto",
    framework = "node",
  } = config;

  const text = (inputText || "").trim();
  const result = {
    tool: "httpStatusLookup",
    rawInput: inputText,
    modeUsed: null,
    primaryCode: null,
    codes: [],
    suggestions: [],
  };

  if (!text) {
    result.modeUsed = "empty";
    return result;
  }

  // Explicit MODE: code
  if (mode === "code") {
    const code = parseInt(text, 10);
    const entry = HTTP_STATUS_MAP.get(code);
    result.modeUsed = "code";

    if (entry) {
      const out = buildOutput(entry, framework);
      result.primaryCode = out.code;
      result.codes = [out];
    }

    return result;
  }

  // Explicit MODE: log
  if (mode === "log") {
    const codesFound = extractCodesFromText(text);
    result.modeUsed = "log";

    result.codes = codesFound.map((code) =>
      buildOutput(HTTP_STATUS_MAP.get(code), framework)
    );
    result.primaryCode = result.codes[0]?.code ?? null;

    return result;
  }

  // Explicit MODE: search (textual search, no numeric codes)
  if (mode === "search") {
    const matches = searchByText(text);
    result.modeUsed = "search";

    result.suggestions = matches.map((entry) =>
      buildOutput(entry, framework)
    );
    result.primaryCode = result.suggestions[0]?.code ?? null;

    return result;
  }

  // AUTO MODE:
  // 1. If it's exactly a 3-digit code → treat as code lookup
  // 2. Else if text contains any codes → treat as log
  // 3. Else → treat as text search
  if (/^\d{3}$/.test(text)) {
    const code = parseInt(text, 10);
    const entry = HTTP_STATUS_MAP.get(code);
    result.modeUsed = "auto-code";

    if (entry) {
      const out = buildOutput(entry, framework);
      result.primaryCode = out.code;
      result.codes = [out];
    }

    return result;
  }

  const codesFound = extractCodesFromText(text);
  if (codesFound.length > 0) {
    result.modeUsed = "auto-log";
    result.codes = codesFound.map((code) =>
      buildOutput(HTTP_STATUS_MAP.get(code), framework)
    );
    result.primaryCode = result.codes[0]?.code ?? null;
    return result;
  }

  // No numeric code found → try text search
  result.modeUsed = "auto-search";
  const matches = searchByText(text);
  result.suggestions = matches.map((entry) =>
    buildOutput(entry, framework)
  );
  result.primaryCode = result.suggestions[0]?.code ?? null;

  return result;
}

module.exports = {
  httpStatusLookup,
  HTTP_STATUS_DATA,
};
