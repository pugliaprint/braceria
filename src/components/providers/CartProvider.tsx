'use client'
/**
 * components/providers/CartProvider.tsx
 * Context globale del carrello.
 * Gestisce sia ordini al tavolo che delivery.
 * Il carrello persiste in localStorage tra navigazioni.
 */
import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

// ---- Tipi ----
export interface CartIngrediente {
  ingredienteId: string
  nomeIngrediente: string
  categoria: string
  prezzoExtra: number
}

export interface CartItem {
  id: string                    // univoco: menuItemId o uuid per panini
  tipo: 'piatto' | 'panino_personalizzato'
  nomePiatto: string
  prezzoUnitario: number
  quantita: number
  note?: string
  // Solo per panino personalizzato
  ingredienti?: CartIngrediente[]
  // Solo per piatto standard
  menuItemId?: string
}

interface CartState {
  items: CartItem[]
  tipo: 'tavolo' | 'delivery' | null
  numeroTavolo?: number
}

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantita: number }
  | { type: 'SET_TIPO'; tipo: 'tavolo' | 'delivery'; numeroTavolo?: number }
  | { type: 'CLEAR' }

// ---- Reducer ----
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.item.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.item.id
              ? { ...i, quantita: i.quantita + action.item.quantita }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, action.item] }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'UPDATE_QTY':
      if (action.quantita <= 0) {
        return { ...state, items: state.items.filter(i => i.id !== action.id) }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, quantita: action.quantita } : i
        ),
      }
    case 'SET_TIPO':
      return { ...state, tipo: action.tipo, numeroTavolo: action.numeroTavolo }
    case 'CLEAR':
      return { items: [], tipo: null }
    default:
      return state
  }
}

// ---- Context ----
interface CartContextValue {
  state: CartState
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQty: (id: string, quantita: number) => void
  setTipo: (tipo: 'tavolo' | 'delivery', numeroTavolo?: number) => void
  clear: () => void
  totale: number
  totalePezzi: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], tipo: null })

  // Carica da localStorage al mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('braceria_cart')
      if (saved) {
        const parsed = JSON.parse(saved) as CartState
        dispatch({ type: 'SET_TIPO', tipo: parsed.tipo ?? 'delivery', numeroTavolo: parsed.numeroTavolo })
        parsed.items.forEach(item => dispatch({ type: 'ADD_ITEM', item }))
      }
    } catch { /* ignora errori parsing */ }
  }, [])

  // Salva in localStorage ad ogni cambiamento
  useEffect(() => {
    localStorage.setItem('braceria_cart', JSON.stringify(state))
  }, [state])

  const totale = state.items.reduce(
    (acc, item) => acc + item.prezzoUnitario * item.quantita, 0
  )
  const totalePezzi = state.items.reduce((acc, item) => acc + item.quantita, 0)

  return (
    <CartContext.Provider value={{
      state,
      addItem: item => dispatch({ type: 'ADD_ITEM', item }),
      removeItem: id => dispatch({ type: 'REMOVE_ITEM', id }),
      updateQty: (id, q) => dispatch({ type: 'UPDATE_QTY', id, quantita: q }),
      setTipo: (tipo, numeroTavolo) => dispatch({ type: 'SET_TIPO', tipo, numeroTavolo }),
      clear: () => dispatch({ type: 'CLEAR' }),
      totale,
      totalePezzi,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve essere usato dentro CartProvider')
  return ctx
}
