/**
 * lib/qrcode.ts
 * Genera QR code per i tavoli.
 * Usato dal pannello admin per stampare i QR da mettere sui tavoli.
 */
import QRCode from 'qrcode'

export async function generaQRCodeTavolo(
  numeroTavolo: number,
  baseUrl: string
): Promise<string> {
  const url = `${baseUrl}/ordine/${numeroTavolo}`
  const dataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1A1410',   // colore puntini (carbone)
      light: '#FAF0E6',  // sfondo (crema)
    },
    errorCorrectionLevel: 'M',
  })
  return dataUrl
}

export async function generaQRCodeSVG(
  numeroTavolo: number,
  baseUrl: string
): Promise<string> {
  const url = `${baseUrl}/ordine/${numeroTavolo}`
  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: 300,
    margin: 2,
  })
  return svg
}
