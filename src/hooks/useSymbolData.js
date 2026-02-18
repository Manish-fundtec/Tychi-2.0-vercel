import { useEffect, useState, useCallback, useRef } from 'react'
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
  const fetchingRef = useRef(false) // Prevent duplicate calls
  const lastFundIdRef = useRef(null) // Track fundId to reset fetch state

  const refetchSymbols = useCallback(async () => {
    if (!fundId) {
      // no fundId = no call (prevents /symbols)
      setSymbols([])
      fetchingRef.current = false
      lastFundIdRef.current = null
      return
    }
    
    // Prevent duplicate calls if already fetching for the same fundId
    if (fetchingRef.current && lastFundIdRef.current === fundId) {
      return
    }
    
    fetchingRef.current = true
    lastFundIdRef.current = fundId
    
    try {
      setLoading(true)
      
      // Fetch symbols with pagination to avoid middleware performance issues
      // Use a reasonable page size (100) to balance performance and data loading
      const PAGE_SIZE = 100
      let allSymbols = []
      let currentPage = 1
      let hasMore = true
      
      while (hasMore) {
        try {
          const res = await getSymbolsByFundId(fundId, { page: currentPage, limit: PAGE_SIZE })
          const pageSymbols = normalize(res)
          
          // Check if backend returns pagination metadata
          const totalCount = res?.data?.total || res?.data?.totalCount || res?.data?.pagination?.total
          const currentPageData = res?.data?.data || res?.data?.rows || pageSymbols
          
          allSymbols = [...allSymbols, ...currentPageData]
          
          // Determine if there are more pages
          if (totalCount !== undefined) {
            // Backend provides total count - use it to determine if more pages exist
            hasMore = allSymbols.length < totalCount
          } else {
            // No pagination metadata - check if we got a full page
            hasMore = pageSymbols.length === PAGE_SIZE
          }
          
          currentPage++
          
          // Safety limit: prevent infinite loops (1000 pages = 100,000 symbols max)
          // This is a very high limit to handle large datasets
          if (currentPage > 1000) {
            console.warn('Reached maximum page limit (1000) while fetching symbols. Some symbols may not be loaded.')
            break
          }
        } catch (pageError) {
          // If pagination is not supported, fall back to fetching all at once
          if (currentPage === 1 && (pageError.response?.status === 400 || pageError.response?.status === 404)) {
            console.warn('Pagination not supported, falling back to fetching all symbols')
            const res = await getSymbolsByFundId(fundId)
            allSymbols = normalize(res)
          } else {
            throw pageError
          }
          hasMore = false
        }
      }
      
      setSymbols(allSymbols)
    } catch (err) {
      console.error('Failed to fetch symbols by fund:', err)
      setSymbols([])
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [fundId])

  useEffect(() => {
    // Only fetch when fundId exists
    if (!fundId) {
      setSymbols([])
      fetchingRef.current = false
      lastFundIdRef.current = null
      return
    }
    
    // Reset fetch state if fundId changed
    if (lastFundIdRef.current !== fundId) {
      fetchingRef.current = false
    }
    
    refetchSymbols()
  }, [fundId, refetchSymbols])

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
