// src/hooks/useExchangeData.js
import { useState, useEffect, useCallback } from 'react'
import { getExchangesByFundId, deleteExchange } from '@/lib/api/exchange'
import { getSymbolsByFundId } from '@/lib/api/symbol'

const normalize = (res) => {
  if (!res) return []
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.data?.data)) return res.data.data
  return []
}
export const useExchangeData = (fundId) => {
  const [exchanges, setExchanges] = useState([])
  const [editingExchange, setEditingExchange] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const refetchExchanges = useCallback(async () => {
    if (!fundId) {
      setExchanges([])
      return
    }
    try {
      setLoading(true)
      const res = await getExchangesByFundId(fundId)
      setExchanges(normalize(res))
    } catch (e) {
      console.error('❌ Failed to fetch exchanges by fund:', e)
      setExchanges([])
    } finally {
      setLoading(false)
    }
  }, [fundId])

  useEffect(() => {
    refetchExchanges()
  }, [refetchExchanges])

  // Helper function to check if exchange has associated symbols
  // Optimized: only fetches first page since we just need to check for existence
  const checkExchangeHasSymbols = useCallback(async (exchangeUid) => {
    if (!fundId || !exchangeUid) return false
    
    try {
      // Fetch first page only (100 symbols) - if match not found, likely doesn't exist
      // This avoids fetching all 1000+ symbols just to check existence
      const res = await getSymbolsByFundId(fundId, { page: 1, limit: 100 })
      const symbols = normalize(res)
      
      // Check if any symbol has this exchange_id (which references exchange_uid)
      // Normalize both values to strings for comparison
      const normalizedExchangeUid = String(exchangeUid)
      return symbols.some(symbol => {
        const symbolExchangeId = String(symbol.exchange_id || '')
        return symbolExchangeId === normalizedExchangeUid
      })
    } catch (error) {
      console.error('Error checking exchange symbols:', error)
      return false
    }
  }, [fundId])

  const handleEdit = useCallback(async (exchange) => {
    // Check if exchange has associated symbols
    const exchangeUid = exchange.exchange_uid || exchange.exchange_id
    if (!exchangeUid) {
      console.warn('Exchange missing identifier:', exchange)
      setEditingExchange(exchange)
      setShowModal(true)
      return
    }
    
    const hasSymbols = await checkExchangeHasSymbols(exchangeUid)
    
    if (hasSymbols) {
      alert('Cannot edit exchange: This exchange has associated symbols. Please delete or modify the symbols first.')
      return
    }
    
    setEditingExchange(exchange)
    setShowModal(true)
  }, [checkExchangeHasSymbols])

  const handleDelete = useCallback(async (id) => {
    if (!id) return

    // Check if exchange has associated symbols before deleting
    const hasSymbols = await checkExchangeHasSymbols(id)

    if (hasSymbols) {
      alert('Cannot delete exchange: This exchange has associated symbols. Please delete or reassign the symbols first.')
      return
    }

    const confirmed = window.confirm('Are you sure you want to delete this exchange?')
    if (!confirmed) return

    try {
      await deleteExchange(id)
      await refetchExchanges()
      window.alert('Exchange deleted successfully.')
    } catch (err) {
      console.error('Delete exchange failed:', err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete exchange.'
      window.alert(message)
    }
  }, [checkExchangeHasSymbols, refetchExchanges])

  return {
    exchanges,
    refetchExchanges,
    handleEdit,
    handleDelete,
    showModal,
    loading,
    setShowModal,
    editingExchange,
    setEditingExchange,
  }
}
