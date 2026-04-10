'use client'
/**
 * components/menu/CartDrawer.tsx
 * Drawer del carrello condiviso tra ordine al tavolo e delivery.
 * Si apre dal basso su mobile (bottom sheet).
 */
import { useState } from 'react'
import { useCart, CartItem } from '@/components/providers/CartProvider'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  onCheckout: () => void
  tipoOrdine: 'tavolo' | 'delivery'
  costoConsegna?: number
}

export default function CartDrawer({
  open, onClose, onCheckout, tipoOrdine, costoConsegna = 0
}: CartDrawerProps) {
  const { state, removeItem, updateQty, totale } = useCart()
  const { items } = state

  const totaleConConsegna = totale + costoConsegna

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-brace-carbone rounded-t-3xl
                      max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-brace-fumo rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-brace-fumo/50">
          <div>
            <h2 className="font-display text-xl font-bold text-brace-crema">
              🛒 Il tuo ordine
            </h2>
            <p className="text-brace-testo-soft text-xs mt-0.5">
              {items.length} {items.length === 1 ? 'articolo' : 'articoli'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista articoli */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-5xl block mb-3">🛒</span>
              <p className="text-brace-testo-soft">Il carrello è vuoto</p>
            </div>
          ) : (
            items.map(item => <CartItemRow key={item.id} item={item} onRemove={removeItem} onUpdateQty={updateQty} />)
          )}
        </div>

        {/* Footer con totale e checkout */}
        {items.length > 0 && (
          <div className="px-5 pt-4 pb-safe pb-6 border-t border-brace-fumo/50">
            {/* Subtotale + consegna */}
            <div className="flex flex-col gap-1.5 mb-4">
              <div className="flex justify-between text-sm text-brace-testo-soft">
                <span>Subtotale</span>
                <span>€{totale.toFixed(2)}</span>
              </div>
              {tipoOrdine === 'delivery' && costoConsegna > 0 && (
                <div className="flex justify-between text-sm text-brace-testo-soft">
                  <span>Consegna</span>
                  <span>€{costoConsegna.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-brace-crema border-t border-brace-fumo/50 pt-2 mt-1">
                <span>Totale</span>
                <span className="text-gradient-fuoco font-mono">€{totaleConConsegna.toFixed(2)}</span>
              </div>
              {tipoOrdine === 'delivery' && (
                <p className="text-xs text-brace-testo-soft text-center">
                  💳 Pagamento alla consegna (contanti o POS)
                </p>
              )}
              {tipoOrdine === 'tavolo' && (
                <p className="text-xs text-brace-testo-soft text-center">
                  💳 Pagamento in cassa al termine
                </p>
              )}
            </div>

            <button
              onClick={onCheckout}
              className="btn-primary w-full text-lg py-4"
            >
              {tipoOrdine === 'tavolo' ? '📤 Invia Ordine alla Cucina' : '📦 Conferma Ordine'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function CartItemRow({
  item, onRemove, onUpdateQty
}: {
  item: CartItem
  onRemove: (id: string) => void
  onUpdateQty: (id: string, q: number) => void
}) {
  return (
    <div className="flex gap-3 py-1">
      {/* Emoji tipo */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brace-fumo flex items-center justify-center text-xl">
        {item.tipo === 'panino_personalizzato' ? '🥪' : '🍽️'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-brace-testo font-medium text-sm leading-tight">{item.nomePiatto}</p>

        {/* Ingredienti panino */}
        {item.tipo === 'panino_personalizzato' && item.ingredienti && item.ingredienti.length > 0 && (
          <p className="text-brace-testo-soft text-xs mt-0.5 leading-relaxed">
            {item.ingredienti.map(i => i.nomeIngrediente).join(', ')}
          </p>
        )}

        {item.note && (
          <p className="text-brace-testo-soft text-xs mt-0.5 italic">"{item.note}"</p>
        )}

        {/* Prezzo unitario */}
        <p className="text-brace-arancio text-xs font-mono mt-1">
          €{item.prezzoUnitario.toFixed(2)} cad.
        </p>
      </div>

      {/* Controlli quantità */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <p className="font-mono font-semibold text-brace-crema text-sm">
          €{(item.prezzoUnitario * item.quantita).toFixed(2)}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateQty(item.id, item.quantita - 1)}
            className="w-7 h-7 rounded-lg bg-brace-fumo text-brace-testo text-lg
                       flex items-center justify-center active:scale-90 transition-transform"
          >
            {item.quantita === 1 ? '🗑' : '−'}
          </button>
          <span className="w-6 text-center text-sm font-semibold text-brace-testo">
            {item.quantita}
          </span>
          <button
            onClick={() => onUpdateQty(item.id, item.quantita + 1)}
            className="w-7 h-7 rounded-lg bg-brace-fumo text-brace-testo text-lg
                       flex items-center justify-center active:scale-90 transition-transform"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
