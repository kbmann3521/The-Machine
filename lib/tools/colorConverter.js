/**
 * Color Converter - Convert between all major color formats
 * Supports: HEX, HEX8, RGB, RGBA, HSL, HSLA, HSV, LAB, LCH, CMYK, XYZ
 */

// ===== Color Space Conversion Helpers =====

function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - ((h / 60) % 2 - 1))
  const m = l - c / 2

  let r, g, b
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function rgbToHsv(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const v = max
  const s = max === 0 ? 0 : d / max

  let h
  if (max === min) h = 0
  else if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) }
}

function hsvToRgb(h, s, v) {
  s /= 100
  v /= 100
  const c = v * s
  const x = c * (1 - ((h / 60) % 2 - 1))
  const m = v - c

  let r, g, b
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function rgbToLab(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883

  const fx = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + (16 / 116)
  const fy = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + (16 / 116)
  const fz = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + (16 / 116)

  const l = (116 * fy) - 16
  const a = 500 * (fx - fy)
  const labB = 200 * (fy - fz)

  return { l: Math.round(l * 10) / 10, a: Math.round(a * 10) / 10, b: Math.round(labB * 10) / 10 }
}

function rgbToCmyk(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const k = 1 - Math.max(r, g, b)
  const c = k === 1 ? 0 : (1 - r - k) / (1 - k)
  const m = k === 1 ? 0 : (1 - g - k) / (1 - k)
  const y = k === 1 ? 0 : (1 - b - k) / (1 - k)

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}

function relativeLuminance(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// ===== Color Palette Generators =====

function generateShades(h, s, l, steps = 3) {
  const shades = []
  for (let i = 1; i <= steps; i++) {
    const newL = Math.max(0, l - (i * (l / (steps + 1))))
    shades.push(`hsl(${h}, ${s}%, ${Math.round(newL)}%)`)
  }
  return shades
}

function generateTints(h, s, l, steps = 3) {
  const tints = []
  for (let i = 1; i <= steps; i++) {
    const newL = Math.min(100, l + ((100 - l) / (steps + 1)) * i)
    tints.push(`hsl(${h}, ${s}%, ${Math.round(newL)}%)`)
  }
  return tints
}

function generateComplementary(h) {
  const comp = (h + 180) % 360
  return comp
}

function generateAnalogous(h) {
  return [(h - 30 + 360) % 360, h, (h + 30) % 360]
}

function generateTriadic(h) {
  return [h, (h + 120) % 360, (h + 240) % 360]
}

function generateTetradic(h) {
  return [h, (h + 90) % 360, (h + 180) % 360, (h + 270) % 360]
}

// ===== Color Blindness Simulation =====

function simulateProtanopia(r, g, b) {
  return {
    r: Math.round(0.567 * r + 0.433 * g),
    g: Math.round(0.558 * r + 0.442 * g),
    b: Math.round(0.242 * r + 0.742 * b),
  }
}

function simulateDeuteranopia(r, g, b) {
  return {
    r: Math.round(0.625 * r + 0.375 * g),
    g: Math.round(0.7 * r + 0.3 * g),
    b: Math.round(0.3 * b),
  }
}

function simulateTritanopia(r, g, b) {
  return {
    r: Math.round(0.95 * r + 0.05 * b),
    g: Math.round(0.433 * r + 0.567 * g),
    b: Math.round(0.475 * r + 0.525 * g),
  }
}

function simulateAchromatopsia(r, g, b) {
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  return { r: gray, g: gray, b: gray }
}

function colorConverter(text, config) {
  try {
    const input = text.trim()
    let rgb = null
    let detectedFormat = 'unknown'

    const hexMatch = input.match(/^#?([0-9a-fA-F]{3}){1,2}$/)
    const rgbMatch = input.match(/^rgb(a)?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    const hslMatch = input.match(/^hsl(a)?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/)

    if (hexMatch) {
      detectedFormat = 'hex'
      let hex = input.replace('#', '')
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('')
      }
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      rgb = { r, g, b }
    } else if (rgbMatch) {
      detectedFormat = 'rgb'
      const match = input.match(/\d+/g)
      rgb = { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) }
    } else if (hslMatch) {
      detectedFormat = 'hsl'
      const match = input.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/)
      if (match) {
        rgb = hslToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]))
      }
    }

    if (!rgb) {
      return { error: 'Invalid color format. Use HEX (#FF0000), RGB (255,0,0), or HSL (0,100%,50%)' }
    }

    return {
      detectedFormat,
      hex: '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
    }
  } catch (error) {
    return { error: error.message }
  }
}

module.exports = { colorConverter }
