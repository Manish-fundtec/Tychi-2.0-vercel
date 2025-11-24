import { useEffect, useState, useCallback } from 'react'
import { getSymbols, getSymbolsByFundId, deleteSymbol } from '@/lib/api/symbol'
import api from '@/lib/api/axios'

const normalize = (res) => {
  // Works whether backend returns `{ success, data: [...] }` or just `[ ... ]`
  if (!res) return []
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.data?.data)) return res.data.data
  return []
}

export const useSymbolData = (fundId) => {
  const [symbols, setSymbols] = useState([])
  const [editingSymbol, setEditingSymbol] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const refetchSymbols = useCallback(async () => {
    if (!fundId) {
      // no fundId = no call (prevents /symbols)
      setSymbols([])
      return
    }
    try {
      setLoading(true)
      // Debug logging removed
      const res = await getSymbolsByFundId(fundId)
      setSymbols(normalize(res))
    } catch (err) {
      console.error('Failed to fetch symbols by fund:', err)
      setSymbols([])
    } finally {
      setLoading(false)
    }
  }, [fundId])

  useEffect(() => {
    // If you ONLY want to fetch when fundId exists, uncomment this guard:
    // if (!fundId) return;
    refetchSymbols()
  }, [refetchSymbols])

  // Helper function to check if symbol has associated trades
  const checkSymbolHasTrades = async (symbolId) => {
    if (!fundId || !symbolId) return false
    
    try {
      const res = await api.get(`/api/v1/trade/fund/${fundId}`)
      const trades = Array.isArray(res?.data?.data) ? res.data.data : []
      
      // Check if any trade has this symbol_id or symbol_uid
      // Normalize both values to strings for comparison
      const normalizedSymbolId = String(symbolId)
      return trades.some(trade => {
        const tradeSymbolId = String(trade.symbol_id || '')
        const tradeSymbolUid = String(trade.symbol_uid || '')
        return tradeSymbolId === normalizedSymbolId || tradeSymbolUid === normalizedSymbolId
      })
    } catch (error) {
      console.error('Error checking symbol trades:', error)
      return false
    }
  }

  const handleEdit = async (symbol) => {
    // Check if symbol has associated trades
    // Use symbol_uid as primary identifier (same as updateSymbol uses)
    const symbolId = symbol.symbol_uid || symbol.symbol_id
    if (!symbolId) {
      console.warn('Symbol missing identifier:', symbol)
      setEditingSymbol(symbol)
      setShowModal(true)
      return
    }
    
    const hasTrades = await checkSymbolHasTrades(symbolId)
    
    if (hasTrades) {
      alert('Cannot edit symbol: This symbol has associated trades. Please delete or modify the trades first.')
      return
    }
    
    setEditingSymbol(symbol)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!id) return

    const confirmed = window.confirm('Are you sure you want to delete this symbol?')
    if (!confirmed) return

    try {
      // Check if symbol has associated trades before deleting
      const hasTrades = await checkSymbolHasTrades(id)
      
      if (hasTrades) {
        alert('Cannot delete symbol: This symbol has associated trades. Please delete or reassign the trades first.')
        return
      }

      await deleteSymbol(id)
      await refetchSymbols()
      window.alert('Symbol deleted successfully.')
    } catch (err) {
      console.error('Delete symbol failed:', err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete symbol.'
      window.alert(message)
    }
  }

  return {
    symbols,
    loading,
    refetchSymbols,
    handleEdit,
    handleDelete,
    showModal,
    setShowModal,
    editingSymbol,
    setEditingSymbol,
  }
}
