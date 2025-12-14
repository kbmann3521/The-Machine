/**
 * Bulk IP Comparison Engine
 * Handles pairwise and multi-item comparison logic following networking standards
 */

/**
 * Determine if two input types can be compared
 */
export function canCompare(typeA, typeB) {
  // Same type always comparable
  if (typeA === typeB) return { comparable: true, reason: 'same_type' }

  // Special case: Hostname can compare with IP
  if ((typeA === 'Hostname' && (typeB === 'IPv4' || typeB === 'IPv6')) ||
      (typeB === 'Hostname' && (typeA === 'IPv4' || typeA === 'IPv6'))) {
    return { comparable: true, reason: 'hostname_with_ip', note: 'Uses DNS resolution for comparison' }
  }

  // All other combinations are incomparable
  return {
    comparable: false,
    reason: 'incompatible_families',
    message: 'Inputs belong to incompatible families and cannot be compared.'
  }
}

/**
 * Extract comparable fields from a result based on input type
 */
function extractFields(result, inputType) {
  const fields = {}

  if (inputType === 'IPv4') {
    fields.normalized = result.normalized
    fields.integer = result.integer
    fields.integerHex = result.integerHex
    fields.binaryOctets = result.binaryOctets
    fields.binaryContinuous = result.binaryContinuous
    fields.octets = result.input?.split('.').map(Number)
    fields.classification = result.classification
    fields.ptr = result.ptr
    fields.isValid = result.isValid
  } else if (inputType === 'IPv6') {
    fields.normalized = result.normalized
    fields.expanded = result.expanded
    fields.compressed = result.compressed
    fields.hextets = result.hextets
    fields.integer = result.integer
    fields.integerHex = result.integerHex
    fields.ipv6Binary = result.ipv6Binary
    fields.ipv6BinaryDotted = result.ipv6BinaryDotted
    fields.zoneId = result.zoneId
    fields.classification = result.classification
    fields.ptr = result.ptr
    fields.isIPv4Mapped = result.isIPv4Mapped
    fields.mappedIPv4 = result.mappedIPv4
    fields.isValid = result.isValid
  } else if (inputType === 'CIDR') {
    fields.normalized = result.input
    fields.cidrPrefix = result.cidr?.cidr
    fields.netmask = result.cidr?.netmask
    fields.wildcardMask = result.cidr?.wildcardMask
    fields.networkAddress = result.cidr?.networkAddress
    fields.broadcastAddress = result.cidr?.broadcastAddress
    fields.firstHost = result.cidr?.firstHost
    fields.lastHost = result.cidr?.lastHost
    fields.firstAddress = result.cidr?.firstAddress
    fields.lastAddress = result.cidr?.lastAddress
    fields.totalHosts = result.cidr?.totalHosts
    fields.usableHosts = result.cidr?.usableHosts
    fields.networkBits = result.cidr?.networkBits
    fields.hostBits = result.cidr?.hostBits
    fields.baseIPClassification = result.baseIP?.classification
    fields.version = result.version
    fields.isValid = result.isValid
  } else if (inputType === 'Range') {
    fields.startIP = result.range?.start
    fields.endIP = result.range?.end
    fields.size = result.range?.size
    fields.isValid = result.range?.isValid
    fields.isIncreasing = result.range?.isIncreasing
    fields.classificationMatch = result.range?.classificationMatch
    fields.scopeMismatch = result.range?.scopeMismatch
    fields.startClassification = result.startIP?.classification
    fields.endClassification = result.endIP?.classification
  } else if (inputType === 'Hostname') {
    fields.hostname = result.input
    fields.isValid = result.isValid
  } else if (inputType === 'Invalid') {
    fields.error = result.error
    fields.isValid = false
  }

  return fields
}

/**
 * Compare two IPv4 addresses
 */
function compareIPv4(resultA, resultB) {
  const fieldsA = extractFields(resultA, 'IPv4')
  const fieldsB = extractFields(resultB, 'IPv4')

  const differences = []
  const similarities = []

  // Normalized form comparison
  if (fieldsA.normalized !== fieldsB.normalized) {
    differences.push({
      field: 'normalized',
      a: fieldsA.normalized,
      b: fieldsB.normalized,
      severity: 'major'
    })
  } else {
    similarities.push('same_normalized')
  }

  // Classification comparison
  if (fieldsA.classification?.type !== fieldsB.classification?.type) {
    differences.push({
      field: 'classification.type',
      a: fieldsA.classification?.type,
      b: fieldsB.classification?.type,
      severity: 'major'
    })
  } else {
    similarities.push(`both_${fieldsA.classification?.type?.toLowerCase()}`)
  }

  // Privacy comparison
  if (fieldsA.classification?.isPrivate !== fieldsB.classification?.isPrivate) {
    differences.push({
      field: 'classification.isPrivate',
      a: fieldsA.classification?.isPrivate,
      b: fieldsB.classification?.isPrivate,
      severity: 'major'
    })
  } else if (fieldsA.classification?.isPrivate) {
    similarities.push('both_private')
  } else {
    similarities.push('both_public')
  }

  // Integer comparison
  if (fieldsA.integer !== fieldsB.integer) {
    differences.push({
      field: 'integer',
      a: fieldsA.integer,
      b: fieldsB.integer,
      severity: 'major',
      distance: Math.abs(fieldsA.integer - fieldsB.integer)
    })
  } else {
    similarities.push('same_integer')
  }

  // Octets comparison
  if (JSON.stringify(fieldsA.octets) !== JSON.stringify(fieldsB.octets)) {
    const diffOctets = fieldsA.octets.map((octA, i) => ({
      position: i,
      a: octA,
      b: fieldsB.octets[i],
      same: octA === fieldsB.octets[i]
    }))
    differences.push({
      field: 'octets',
      details: diffOctets,
      severity: 'info'
    })
  } else {
    similarities.push('same_octets')
  }

  // PTR comparison
  if ((fieldsA.ptr || fieldsB.ptr) && fieldsA.ptr !== fieldsB.ptr) {
    differences.push({
      field: 'ptr',
      a: fieldsA.ptr || '(no PTR)',
      b: fieldsB.ptr || '(no PTR)',
      severity: 'minor'
    })
  }

  // Subnet relationships
  if (fieldsA.octets && fieldsB.octets) {
    const same24 = fieldsA.octets.slice(0, 3).every((val, i) => val === fieldsB.octets[i])
    const same16 = fieldsA.octets.slice(0, 2).every((val, i) => val === fieldsB.octets[i])
    const same8 = fieldsA.octets[0] === fieldsB.octets[0]

    if (same24) similarities.push('same_/24_subnet')
    if (same16) similarities.push('same_/16_subnet')
    if (same8) similarities.push('same_/8_subnet')
  }

  return { differences, similarities }
}

/**
 * Compare two IPv6 addresses
 */
function compareIPv6(resultA, resultB) {
  const fieldsA = extractFields(resultA, 'IPv6')
  const fieldsB = extractFields(resultB, 'IPv6')

  const differences = []
  const similarities = []

  // Normalized comparison
  if (fieldsA.normalized !== fieldsB.normalized) {
    differences.push({
      field: 'normalized',
      a: fieldsA.normalized,
      b: fieldsB.normalized,
      severity: 'major'
    })
  } else {
    similarities.push('same_normalized')
  }

  // Classification comparison
  if (fieldsA.classification?.type !== fieldsB.classification?.type) {
    differences.push({
      field: 'classification.type',
      a: fieldsA.classification?.type,
      b: fieldsB.classification?.type,
      severity: 'major'
    })
  } else {
    similarities.push(`both_${fieldsA.classification?.type?.toLowerCase()}`)
  }

  // Scope comparison
  if (fieldsA.classification?.scope !== fieldsB.classification?.scope) {
    differences.push({
      field: 'classification.scope',
      a: fieldsA.classification?.scope,
      b: fieldsB.classification?.scope,
      severity: 'major'
    })
  } else if (fieldsA.classification?.scope) {
    similarities.push(`both_${fieldsA.classification.scope}`)
  }

  // Compressed form
  if (fieldsA.compressed !== fieldsB.compressed) {
    differences.push({
      field: 'compressed',
      a: fieldsA.compressed,
      b: fieldsB.compressed,
      severity: 'info'
    })
  }

  // IPv4 mapped check
  if (fieldsA.isIPv4Mapped !== fieldsB.isIPv4Mapped) {
    differences.push({
      field: 'isIPv4Mapped',
      a: fieldsA.isIPv4Mapped,
      b: fieldsB.isIPv4Mapped,
      severity: 'minor'
    })
  }

  // PTR comparison
  if ((fieldsA.ptr || fieldsB.ptr) && fieldsA.ptr !== fieldsB.ptr) {
    differences.push({
      field: 'ptr',
      a: fieldsA.ptr || '(no PTR)',
      b: fieldsB.ptr || '(no PTR)',
      severity: 'minor'
    })
  }

  return { differences, similarities }
}

/**
 * Compare two CIDR blocks
 */
function compareCIDR(resultA, resultB) {
  const fieldsA = extractFields(resultA, 'CIDR')
  const fieldsB = extractFields(resultB, 'CIDR')

  const differences = []
  const similarities = []

  // Prefix length comparison
  if (fieldsA.cidrPrefix !== fieldsB.cidrPrefix) {
    differences.push({
      field: 'cidrPrefix',
      a: `/${fieldsA.cidrPrefix}`,
      b: `/${fieldsB.cidrPrefix}`,
      severity: 'major'
    })
  } else {
    similarities.push(`both_/${fieldsA.cidrPrefix}`)
  }

  // Netmask comparison
  if (fieldsA.netmask !== fieldsB.netmask) {
    differences.push({
      field: 'netmask',
      a: fieldsA.netmask,
      b: fieldsB.netmask,
      severity: 'major'
    })
  }

  // Network address comparison
  if (fieldsA.networkAddress !== fieldsB.networkAddress) {
    differences.push({
      field: 'networkAddress',
      a: fieldsA.networkAddress,
      b: fieldsB.networkAddress,
      severity: 'major'
    })
  } else {
    similarities.push('same_network')
  }

  // Broadcast address (IPv4 only)
  if (fieldsA.version === 4 && fieldsA.broadcastAddress !== fieldsB.broadcastAddress) {
    differences.push({
      field: 'broadcastAddress',
      a: fieldsA.broadcastAddress,
      b: fieldsB.broadcastAddress,
      severity: 'major'
    })
  }

  // Total hosts comparison
  if (fieldsA.totalHosts !== fieldsB.totalHosts) {
    differences.push({
      field: 'totalHosts',
      a: fieldsA.totalHosts?.toString?.() || fieldsA.totalHosts,
      b: fieldsB.totalHosts?.toString?.() || fieldsB.totalHosts,
      severity: 'major'
    })
  }

  // Classification comparison
  if (fieldsA.baseIPClassification?.type !== fieldsB.baseIPClassification?.type) {
    differences.push({
      field: 'baseIPClassification.type',
      a: fieldsA.baseIPClassification?.type,
      b: fieldsB.baseIPClassification?.type,
      severity: 'major'
    })
  } else {
    similarities.push(`both_${fieldsA.baseIPClassification?.type?.toLowerCase()}`)
  }

  // Subnet relationships (if same version)
  if (fieldsA.version === fieldsB.version && fieldsA.networkAddress && fieldsB.networkAddress) {
    if (fieldsA.networkAddress === fieldsB.networkAddress) {
      similarities.push('same_subnet')
    } else if (fieldsA.cidrPrefix < fieldsB.cidrPrefix) {
      // A is larger, might contain B
      similarities.push('A_is_supernet')
    } else if (fieldsB.cidrPrefix < fieldsA.cidrPrefix) {
      // B is larger, might contain A
      similarities.push('B_is_supernet')
    }
  }

  return { differences, similarities }
}

/**
 * Compare two IP ranges
 */
function compareRange(resultA, resultB) {
  const fieldsA = extractFields(resultA, 'Range')
  const fieldsB = extractFields(resultB, 'Range')

  const differences = []
  const similarities = []

  // Start IP comparison
  if (fieldsA.startIP !== fieldsB.startIP) {
    differences.push({
      field: 'startIP',
      a: fieldsA.startIP,
      b: fieldsB.startIP,
      severity: 'major'
    })
  } else {
    similarities.push('same_start')
  }

  // End IP comparison
  if (fieldsA.endIP !== fieldsB.endIP) {
    differences.push({
      field: 'endIP',
      a: fieldsA.endIP,
      b: fieldsB.endIP,
      severity: 'major'
    })
  } else {
    similarities.push('same_end')
  }

  // Range size comparison
  if (fieldsA.size !== fieldsB.size) {
    differences.push({
      field: 'size',
      a: fieldsA.size?.toLocaleString?.() || fieldsA.size,
      b: fieldsB.size?.toLocaleString?.() || fieldsB.size,
      severity: 'major'
    })
  }

  // Validity comparison
  if (fieldsA.isValid !== fieldsB.isValid) {
    differences.push({
      field: 'isValid',
      a: fieldsA.isValid,
      b: fieldsB.isValid,
      severity: 'major'
    })
  } else if (fieldsA.isValid) {
    similarities.push('both_valid')
  }

  // Increasing order comparison
  if (fieldsA.isIncreasing !== fieldsB.isIncreasing) {
    differences.push({
      field: 'isIncreasing',
      a: fieldsA.isIncreasing,
      b: fieldsB.isIncreasing,
      severity: 'minor'
    })
  }

  return { differences, similarities }
}

/**
 * Compare two hostnames
 */
function compareHostname(resultA, resultB) {
  const fieldsA = extractFields(resultA, 'Hostname')
  const fieldsB = extractFields(resultB, 'Hostname')

  const differences = []
  const similarities = []

  // Hostname comparison
  if (fieldsA.hostname !== fieldsB.hostname) {
    differences.push({
      field: 'hostname',
      a: fieldsA.hostname,
      b: fieldsB.hostname,
      severity: 'major'
    })
  } else {
    similarities.push('same_hostname')
  }

  // Validity
  if (fieldsA.isValid !== fieldsB.isValid) {
    differences.push({
      field: 'isValid',
      a: fieldsA.isValid,
      b: fieldsB.isValid,
      severity: 'major'
    })
  } else if (fieldsA.isValid) {
    similarities.push('both_valid')
  }

  return { differences, similarities }
}

/**
 * Compare hostname with IP address
 */
function compareHostnameWithIP(hostnameResult, ipResult, ipType) {
  const differences = []
  const similarities = []
  const warnings = []

  const hostFields = extractFields(hostnameResult, 'Hostname')
  const ipFields = ipType === 'IPv4' ? extractFields(ipResult, 'IPv4') : extractFields(ipResult, 'IPv6')

  // Hostname itself
  differences.push({
    field: 'type',
    a: 'Hostname',
    b: ipType,
    severity: 'info'
  })

  // Validity comparison
  if (hostFields.isValid !== ipFields.isValid) {
    differences.push({
      field: 'isValid',
      a: hostFields.isValid,
      b: ipFields.isValid,
      severity: 'major'
    })
  }

  // Classification (if available)
  if (ipFields.classification?.type) {
    similarities.push(`IP_is_${ipFields.classification.type.toLowerCase()}`)
  }

  // Note about DNS resolution
  warnings.push('Hostname comparison uses DNS resolution - multiple IPs may be resolved')

  return { differences, similarities, warnings }
}

/**
 * Main comparison function
 */
export function compareItems(resultA, resultB, typeA, typeB) {
  // Check if comparable
  const comparability = canCompare(typeA, typeB)
  if (!comparability.comparable) {
    return {
      type: 'incomparable',
      status: 'error',
      message: comparability.message,
      inputA: resultA,
      inputB: resultB
    }
  }

  let comparison

  if (typeA === typeB) {
    // Same type comparisons
    if (typeA === 'IPv4') {
      comparison = compareIPv4(resultA, resultB)
    } else if (typeA === 'IPv6') {
      comparison = compareIPv6(resultA, resultB)
    } else if (typeA === 'CIDR') {
      comparison = compareCIDR(resultA, resultB)
    } else if (typeA === 'Range') {
      comparison = compareRange(resultA, resultB)
    } else if (typeA === 'Hostname') {
      comparison = compareHostname(resultA, resultB)
    } else if (typeA === 'Invalid') {
      comparison = {
        differences: [{ field: 'error', a: resultA.error, b: resultB.error, severity: 'error' }],
        similarities: []
      }
    }
  } else {
    // Hostname ↔ IP comparison
    if (typeA === 'Hostname' && (typeB === 'IPv4' || typeB === 'IPv6')) {
      comparison = compareHostnameWithIP(resultA, resultB, typeB)
    } else if (typeB === 'Hostname' && (typeA === 'IPv4' || typeA === 'IPv6')) {
      comparison = compareHostnameWithIP(resultB, resultA, typeA)
    }
  }

  return {
    type: typeA.toLowerCase(),
    status: 'comparable',
    inputA: resultA,
    inputB: resultB,
    typeA,
    typeB,
    comparability,
    ...comparison
  }
}

/**
 * Analyze multiple items for aggregation
 */
export function analyzeMultipleItems(results, types) {
  const analysis = {
    total: results.length,
    typeDistribution: {},
    validCount: 0,
    invalidCount: 0,
    privateCount: 0,
    publicCount: 0,
    outliers: [],
    insights: []
  }

  // Count types
  types.forEach(type => {
    analysis.typeDistribution[type] = (analysis.typeDistribution[type] || 0) + 1
  })

  // Validity and classification counts
  results.forEach((result, i) => {
    if (result.isValid === false) {
      analysis.invalidCount++
      analysis.outliers.push({
        index: i,
        reason: 'Invalid input',
        type: types[i],
        input: result.input
      })
    } else {
      analysis.validCount++
      if (result.classification?.isPrivate) {
        analysis.privateCount++
      } else if (result.classification?.isPublic) {
        analysis.publicCount++
      }
    }
  })

  // Outlier detection
  const primaryType = Object.entries(analysis.typeDistribution).sort((a, b) => b[1] - a[1])[0][0]
  results.forEach((result, i) => {
    if (types[i] !== primaryType && types[i] !== 'Invalid') {
      analysis.outliers.push({
        index: i,
        reason: `Different type (${types[i]} vs majority ${primaryType})`,
        type: types[i],
        input: result.input
      })
    }
  })

  // Type-specific insights
  const hasIPv4 = analysis.typeDistribution['IPv4'] > 0
  const hasIPv6 = analysis.typeDistribution['IPv6'] > 0
  const hasCIDR = analysis.typeDistribution['CIDR'] > 0
  const hasHostname = analysis.typeDistribution['Hostname'] > 0

  if (hasIPv4 && hasIPv6) {
    analysis.insights.push('Mixed IPv4 and IPv6 addresses detected')
  }
  if (hasCIDR && !hasIPv4 && !hasIPv6) {
    analysis.insights.push('All inputs are CIDR blocks')
  }
  if (hasHostname && hasIPv4 && !hasIPv6) {
    analysis.insights.push('Hostnames and IPv4 addresses mixed')
  }

  if (analysis.privateCount > 0 && analysis.publicCount > 0) {
    analysis.insights.push(`${analysis.privateCount} private and ${analysis.publicCount} public addresses`)
  } else if (analysis.privateCount === analysis.validCount) {
    analysis.insights.push('All valid addresses are private')
  } else if (analysis.publicCount === analysis.validCount) {
    analysis.insights.push('All valid addresses are public')
  }

  return analysis
}
