import QRCode from 'qrcode'

export async function generateQRCode(text, config = {}) {
  if (!text || !text.trim()) {
    return {
      status: 'empty',
      error: 'Please enter text to generate a QR code'
    }
  }

  try {
    const size = parseInt(config.size) || 200
    const errorCorrectionLevel = config.errorCorrectionLevel || 'M'
    const margin = parseInt(config.margin) || 2
    const color = config.color || '#000000'
    const bgColor = config.bgColor || '#FFFFFF'

    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel,
      type: 'image/png',
      quality: 0.95,
      margin,
      width: size,
      color: {
        dark: color,
        light: bgColor,
      },
    })

    // Also generate as SVG for scalability
    const svg = await QRCode.toString(text, {
      errorCorrectionLevel,
      type: 'svg',
      margin,
      width: size,
      color: {
        dark: color,
        light: bgColor,
      },
    })

    return {
      status: 'ok',
      input: text,
      dataUrl,
      svg,
      metadata: {
        size,
        errorCorrectionLevel,
        margin,
        color,
        bgColor,
        textLength: text.length,
      }
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message || 'Failed to generate QR code',
      input: text,
    }
  }
}
