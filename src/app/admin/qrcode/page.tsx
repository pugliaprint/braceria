'use client'
/**
 * app/admin/qrcode/page.tsx
 * Generatore QR code per i tavoli.
 * Permette di stampare i QR da mettere sui tavoli.
 */
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function AdminQRCodePage() {
  const [numTavoli, setNumTavoli] = useState(8)
  const [qrCodes, setQrCodes]     = useState<Array<{ tavolo: number; dataUrl: string; url: string }>>([])
  const [loading, setLoading]     = useState(false)

  const generaQR = async () => {
    setLoading(true)
    const results = []
    for (let t = 1; t <= numTavoli; t++) {
      const res = await fetch(`/api/qrcode?tavolo=${t}`)
      if (res.ok) {
        const data = await res.json()
        results.push(data)
      }
    }
    setQrCodes(results)
    setLoading(false)
    toast.success(`${results.length} QR code generati!`)
  }

  const stampaTutto = () => window.print()

  const scaricaQR = (dataUrl: string, tavolo: number) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-tavolo-${tavolo}.png`
    a.click()
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <h1 className="font-display text-2xl font-black text-brace-crema">QR Code Tavoli</h1>
      <p className="text-brace-testo-soft text-sm">
        Genera i QR code da stampare e mettere su ogni tavolo. Ogni QR porta i clienti direttamente alla pagina ordine del loro tavolo.
      </p>

      {/* Generazione */}
      <div className="card p-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Numero di tavoli</label>
          <input
            type="number" min="1" max="50" value={numTavoli}
            onChange={e => setNumTavoli(parseInt(e.target.value))}
            className="input w-28"
          />
        </div>
        <button onClick={generaQR} disabled={loading} className="btn-primary px-6 py-3">
          {loading ? '⏳ Generazione...' : '📱 Genera QR Code'}
        </button>
        {qrCodes.length > 0 && (
          <button onClick={stampaTutto} className="btn-secondary px-6 py-3 print:hidden">
            🖨️ Stampa tutti
          </button>
        )}
      </div>

      {/* Griglia QR */}
      {qrCodes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4">
          {qrCodes.map(({ tavolo, dataUrl, url }) => (
            <div
              key={tavolo}
              className="card p-4 flex flex-col items-center gap-3 print:border-2 print:border-gray-300 print:shadow-none print:bg-white"
            >
              {/* QR image */}
              <img src={dataUrl} alt={`QR Tavolo ${tavolo}`} className="w-full max-w-[180px] rounded-xl" />

              <div className="text-center">
                <p className="font-display text-3xl font-black text-brace-crema print:text-gray-900">
                  Tavolo {tavolo}
                </p>
                <p className="text-brace-testo-soft text-xs mt-0.5 print:text-gray-500">
                  Scansiona per ordinare
                </p>
                <p className="text-brace-testo-soft text-xs break-all mt-1 print:text-gray-400" style={{ fontSize: '9px' }}>
                  {url}
                </p>
              </div>

              <button
                onClick={() => scaricaQR(dataUrl, tavolo)}
                className="btn-ghost text-xs px-3 py-1.5 print:hidden"
              >
                ⬇️ Scarica
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:grid-cols-4, .print\\:grid-cols-4 * { visibility: visible; }
          .print\\:grid-cols-4 { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
