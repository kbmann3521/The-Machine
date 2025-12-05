/**
 * Color Converter - Convert between all major color formats
 * Supports: HEX, HEX8, RGB, RGBA, HSL, HSLA, HSV, LAB, LCH, CMYK, XYZ
 */

// ===== CSS Named Colors Map =====
const CSS_NAMED_COLORS = {
  aliceblue: '#F0F8FF',
  antiquewhite: '#FAEBD7',
  aqua: '#00FFFF',
  aquamarine: '#7FFFD4',
  azure: '#F0FFFF',
  beige: '#F5F5DC',
  bisque: '#FFE4C4',
  black: '#000000',
  blanchedalmond: '#FFEBCD',
  blue: '#0000FF',
  blueviolet: '#8A2BE2',
  brown: '#A52A2A',
  burlywood: '#DEB887',
  cadetblue: '#5F9EA0',
  chartreuse: '#7FFF00',
  chocolate: '#D2691E',
  coral: '#FF7F50',
  cornflowerblue: '#6495ED',
  cornsilk: '#FFF8DC',
  crimson: '#DC143C',
  cyan: '#00FFFF',
  darkblue: '#00008B',
  darkcyan: '#008B8B',
  darkgoldenrod: '#B8860B',
  darkgray: '#A9A9A9',
  darkgrey: '#A9A9A9',
  darkgreen: '#006400',
  darkkhaki: '#BDB76B',
  darkmagenta: '#8B008B',
  darkolivegreen: '#556B2F',
  darkorange: '#FF8C00',
  darkorchid: '#9932CC',
  darkred: '#8B0000',
  darksalmon: '#E9967A',
  darkseagreen: '#8FBC8F',
  darkslateblue: '#483D8B',
  darkslategray: '#2F4F4F',
  darkslategrey: '#2F4F4F',
  darkturquoise: '#00CED1',
  darkviolet: '#9400D3',
  deeppink: '#FF1493',
  deepskyblue: '#00BFFF',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1E90FF',
  firebrick: '#B22222',
  floralwhite: '#FFFAF0',
  forestgreen: '#228B22',
  fuchsia: '#FF00FF',
  gainsboro: '#DCDCDC',
  ghostwhite: '#F8F8FF',
  gold: '#FFD700',
  goldenrod: '#DAA520',
  gray: '#808080',
  grey: '#808080',
  green: '#008000',
  greenyellow: '#ADFF2F',
  honeydew: '#F0FFF0',
  hotpink: '#FF69B4',
  indianred: '#CD5C5C',
  indigo: '#4B0082',
  ivory: '#FFFFF0',
  khaki: '#F0E68C',
  lavender: '#E6E6FA',
  lavenderblush: '#FFF0F5',
  lawngreen: '#7CFC00',
  lemonchiffon: '#FFFACD',
  lightblue: '#ADD8E6',
  lightcoral: '#F08080',
  lightcyan: '#E0FFFF',
  lightgoldenrodyellow: '#FAFAD2',
  lightgray: '#D3D3D3',
  lightgrey: '#D3D3D3',
  lightgreen: '#90EE90',
  lightpink: '#FFB6C1',
  lightsalmon: '#FFA07A',
  lightseagreen: '#20B2AA',
  lightskyblue: '#87CEFA',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#B0C4DE',
  lightyellow: '#FFFFE0',
  lime: '#00FF00',
  limegreen: '#32CD32',
  linen: '#FAF0E6',
  magenta: '#FF00FF',
  maroon: '#800000',
  mediumaquamarine: '#66CDAA',
  mediumblue: '#0000CD',
  mediumorchid: '#BA55D3',
  mediumpurple: '#9370DB',
  mediumseagreen: '#3CB371',
  mediumslateblue: '#7B68EE',
  mediumspringgreen: '#00FA9A',
  mediumturquoise: '#48D1CC',
  mediumvioletred: '#C71585',
  midnightblue: '#191970',
  mintcream: '#F5FFFA',
  mistyrose: '#FFE4E1',
  moccasin: '#FFE4B5',
  navajowhite: '#FFDEAD',
  navy: '#000080',
  oldlace: '#FDF5E6',
  olive: '#808000',
  olivedrab: '#6B8E23',
  orange: '#FFA500',
  orangered: '#FF4500',
  orchid: '#DA70D6',
  palegoldenrod: '#EEE8AA',
  palegreen: '#98FB98',
  paleturquoise: '#AFEEEE',
  palevioletred: '#DB7093',
  papayawhip: '#FFEFD5',
  peachpuff: '#FFDAB9',
  peru: '#CD853F',
  pink: '#FFC0CB',
  plum: '#DDA0DD',
  powderblue: '#B0E0E6',
  purple: '#800080',
  red: '#FF0000',
  rosybrown: '#BC8F8F',
  royalblue: '#4169E1',
  saddlebrown: '#8B4513',
  salmon: '#FA8072',
  sandybrown: '#F4A460',
  seagreen: '#2E8B57',
  seashell: '#FFF5EE',
  sienna: '#A0522D',
  silver: '#C0C0C0',
  skyblue: '#87CEEB',
  slateblue: '#6A5ACD',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#FFFAFA',
  springgreen: '#00FF7F',
  steelblue: '#4682B4',
  tan: '#D2B48C',
  teal: '#008080',
  thistle: '#D8BFD8',
  tomato: '#FF6347',
  turquoise: '#40E0D0',
  violet: '#EE82EE',
  wheat: '#F5DEB3',
  white: '#FFFFFF',
  whitesmoke: '#F5F5F5',
  yellow: '#FFFF00',
  yellowgreen: '#9ACD32',
}

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
    let alpha = 1
    let detectedFormat = 'unknown'

    // Parse all input formats
    const hexMatch = input.match(/^#?([0-9a-fA-F]{3}){1,2}([0-9a-fA-F]{2})?$/)
    const rgbMatch = input.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
    const hslMatch = input.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*([\d.]+))?\s*\)/)
    const hsvMatch = input.match(/^hsv\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/)

    if (hexMatch) {
      detectedFormat = 'hex'
      let hex = input.replace('#', '')
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('')
      }

      // Extract alpha from HEX8
      if (hex.length === 8) {
        alpha = parseInt(hex.substr(6, 2), 16) / 255
        hex = hex.substr(0, 6)
      }

      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      rgb = { r, g, b }
    } else if (rgbMatch) {
      detectedFormat = rgbMatch[0].includes('a') ? 'rgba' : 'rgb'
      rgb = { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) }
      if (rgbMatch[4]) {
        alpha = parseFloat(rgbMatch[4])
      }
    } else if (hslMatch) {
      detectedFormat = hslMatch[0].includes('a') ? 'hsla' : 'hsl'
      rgb = hslToRgb(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]))
      if (hslMatch[4]) {
        alpha = parseFloat(hslMatch[4])
      }
    } else if (hsvMatch) {
      detectedFormat = 'hsv'
      rgb = hsvToRgb(parseInt(hsvMatch[1]), parseInt(hsvMatch[2]), parseInt(hsvMatch[3]))
    }

    if (!rgb) {
      return {
        error: 'Invalid color format. Supported: HEX (#FF0000), RGB (255,0,0), RGBA (255,0,0,0.5), HSL (0,100%,50%), HSV (0,100%,100%)'
      }
    }

    // Generate all formats
    const hexStr = '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
    const hex8Str = hexStr + (Math.round(alpha * 255)).toString(16).padStart(2, '0').toUpperCase()

    const hslObj = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const hsvObj = rgbToHsv(rgb.r, rgb.g, rgb.b)
    const labObj = rgbToLab(rgb.r, rgb.g, rgb.b)
    const cmykObj = rgbToCmyk(rgb.r, rgb.g, rgb.b)

    // LCH is Lab's cylindrical counterpart
    const lchObj = {
      l: labObj.l,
      c: Math.round(Math.sqrt(labObj.a * labObj.a + labObj.b * labObj.b) * 10) / 10,
      h: Math.round(Math.atan2(labObj.b, labObj.a) * (180 / Math.PI) * 10) / 10
    }

    // Calculate luminance and contrast
    const lum = relativeLuminance(rgb.r, rgb.g, rgb.b)
    const whiteContrast = contrastRatio(lum, 1)
    const blackContrast = contrastRatio(lum, 0)

    // Generate variants
    const complementaryHue = generateComplementary(hslObj.h)
    const analogousHues = generateAnalogous(hslObj.h)
    const triadicHues = generateTriadic(hslObj.h)
    const tetradicHues = generateTetradic(hslObj.h)

    // Color blindness simulations
    const protanopiaCvd = simulateProtanopia(rgb.r, rgb.g, rgb.b)
    const deuteranopiaCvd = simulateDeuteranopia(rgb.r, rgb.g, rgb.b)
    const tritanopiaCvd = simulateTritanopia(rgb.r, rgb.g, rgb.b)
    const achromatopsiaCvd = simulateAchromatopsia(rgb.r, rgb.g, rgb.b)

    return {
      input: text,
      detectedFormat,
      formats: {
        hex: hexStr,
        hex8: hex8Str,
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`,
        hsl: `hsl(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%)`,
        hsla: `hsla(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%, ${alpha.toFixed(2)})`,
        hsv: `hsv(${hsvObj.h}, ${hsvObj.s}%, ${hsvObj.v}%)`,
        lab: `lab(${labObj.l} ${labObj.a} ${labObj.b})`,
        lch: `lch(${lchObj.l} ${lchObj.c} ${lchObj.h})`,
        cmyk: `cmyk(${cmykObj.c}%, ${cmykObj.m}%, ${cmykObj.y}%, ${cmykObj.k}%)`,
      },
      rgb: {
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        a: alpha,
      },
      hsl: hslObj,
      hsv: hsvObj,
      lab: labObj,
      lch: lchObj,
      cmyk: cmykObj,
      luminance: Math.round(lum * 10000) / 10000,
      contrast: {
        white: Math.round(whiteContrast * 100) / 100,
        black: Math.round(blackContrast * 100) / 100,
      },
      accessibility: {
        contrastWhite: whiteContrast,
        contrastBlack: blackContrast,
        aaaLargeText: whiteContrast >= 4.5,
        aaSmallText: whiteContrast >= 4.5,
        aaaSmallText: whiteContrast >= 7,
      },
      variants: {
        shades: generateShades(hslObj.h, hslObj.s, hslObj.l),
        tints: generateTints(hslObj.h, hslObj.s, hslObj.l),
        complementary: complementaryHue,
        analogous: analogousHues,
        triadic: triadicHues,
        tetradic: tetradicHues,
      },
      colorBlindness: {
        protanopia: {
          r: protanopiaCvd.r,
          g: protanopiaCvd.g,
          b: protanopiaCvd.b,
          hex: '#' + [protanopiaCvd.r, protanopiaCvd.g, protanopiaCvd.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(),
        },
        deuteranopia: {
          r: deuteranopiaCvd.r,
          g: deuteranopiaCvd.g,
          b: deuteranopiaCvd.b,
          hex: '#' + [deuteranopiaCvd.r, deuteranopiaCvd.g, deuteranopiaCvd.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(),
        },
        tritanopia: {
          r: tritanopiaCvd.r,
          g: tritanopiaCvd.g,
          b: tritanopiaCvd.b,
          hex: '#' + [tritanopiaCvd.r, tritanopiaCvd.g, tritanopiaCvd.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(),
        },
        achromatopsia: {
          r: achromatopsiaCvd.r,
          g: achromatopsiaCvd.g,
          b: achromatopsiaCvd.b,
          hex: '#' + [achromatopsiaCvd.r, achromatopsiaCvd.g, achromatopsiaCvd.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(),
        },
      },
    }
  } catch (error) {
    return { error: error.message }
  }
}

module.exports = { colorConverter }
