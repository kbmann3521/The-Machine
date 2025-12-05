/**
 * Color Converter - Convert between RGB, HEX, and HSL color formats
 * Automatically detects input format and provides all conversions
 */

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
    return `hsl(0, 0%, ${Math.round(l * 100)}%)`
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
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
