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

export const useSymbolData = (fundId, options = {}) => {
  const { page = 1, pageSize = 10, autoFetch = true } = options
  
  const [symbols, setSymbols] = useState([])
  const [editingSymbol, setEditingSymbol] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  const fetchingRef = useRef(false) // Prevent duplicate calls
  const lastRequestRef = useRef({ fundId: null, page: null, pageSize: null }) // Track last request
  const abortControllerRef = useRef(null) // For cancelling in-flight requests
  const requestIdRef = useRef(0) // Unique request ID to track calls

  // Server-side pagination: fetch only the current page
  const fetchSymbols = useCallback(async (requestedPage = page, requestedPageSize = pageSize) => {
    if (!fundId) {
      setSymbols([])
      setTotalRecords(0)
      setTotalPages(0)
      fetchingRef.current = false
      lastRequestRef.current = { fundId: null, page: null, pageSize: null }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      return
    }
    
    // Check if this is a duplicate request
    const requestKey = `${fundId}-${requestedPage}-${requestedPageSize}`
    const lastRequestKey = `${lastRequestRef.current.fundId}-${lastRequestRef.current.page}-${lastRequestRef.current.pageSize}`
    
    if (fetchingRef.current && requestKey === lastRequestKey) {
      console.log('[useSymbolData] Skipping duplicate request:', requestKey)
      return
    }
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    const currentRequestId = ++requestIdRef.current
    
    // Mark as fetching
    fetchingRef.current = true
    lastRequestRef.current = { fundId, page: requestedPage, pageSize: requestedPageSize }
    
    console.log('[useSymbolData] Fetching page', requestedPage, 'pageSize', requestedPageSize, 'for fundId:', fundId, 'Request ID:', currentRequestId)
    
    try {
      setLoading(true)
      
      // Fetch only the current page
      const res = await getSymbolsByFundId(fundId, { page: requestedPage, limit: requestedPageSize })
      
      // Check if request was aborted
      if (abortController.signal.aborted || requestIdRef.current !== currentRequestId) {
        console.log('[useSymbolData] Request aborted, ignoring response')
        return
      }
      
      // Extract data and pagination metadata
      const totalCount = res?.data?.total || res?.data?.totalCount || 0
      const currentPageData = res?.data?.data || res?.data?.rows || normalize(res)
      const limit = res?.data?.limit || res?.data?.pageSize || requestedPageSize
      const calculatedTotalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0
      
      // Only update state if this is still the current request
      if (!abortController.signal.aborted && requestIdRef.current === currentRequestId) {
        setSymbols(currentPageData)
        setTotalRecords(totalCount)
        setTotalPages(calculatedTotalPages)
        console.log('[useSymbolData] ✅ Fetched page', requestedPage, 'of', calculatedTotalPages, 'Total records:', totalCount, 'Records in page:', currentPageData.length)
      }
    } catch (err) {
      // Don't log error if request was aborted
      if (!abortController.signal.aborted && requestIdRef.current === currentRequestId) {
        console.error('[useSymbolData] Failed to fetch symbols:', err)
        setSymbols([])
        setTotalRecords(0)
        setTotalPages(0)
      }
    } finally {
      // Only reset if this is still the current request
      if (requestIdRef.current === currentRequestId) {
        setLoading(false)
        fetchingRef.current = false
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
      }
    }
  }, [fundId, page, pageSize])
  
  // Legacy refetchSymbols for backward compatibility (refetches current page)
  const refetchSymbols = useCallback(() => {
    return fetchSymbols(page, pageSize)
  }, [fetchSymbols, page, pageSize])

  // Auto-fetch on mount or when fundId/page/pageSize changes (if autoFetch is enabled)
  useEffect(() => {
    if (!autoFetch) {
      return
    }
    
    // Only fetch when fundId exists
    if (!fundId) {
      setSymbols([])
      setTotalRecords(0)
      setTotalPages(0)
      fetchingRef.current = false
      lastRequestRef.current = { fundId: null, page: null, pageSize: null }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      return
    }
    
    // Check if this is a duplicate request
    const requestKey = `${fundId}-${page}-${pageSize}`
    const lastRequestKey = `${lastRequestRef.current.fundId}-${lastRequestRef.current.page}-${lastRequestRef.current.pageSize}`
    
    if (requestKey === lastRequestKey && fetchingRef.current) {
      console.log('[useSymbolData] Already fetching same request, skipping')
      return
    }
    
    // Fetch the current page
    fetchSymbols(page, pageSize)
    
    // Cleanup function to cancel request on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        console.log('[useSymbolData] Cleanup: aborting request')
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [fundId, page, pageSize, autoFetch, fetchSymbols])

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
    totalRecords,
    totalPages,
    refetchSymbols,
    fetchSymbols, // New function for server-side pagination
    handleEdit,
    handleDelete,
    showModal,
    setShowModal,
    editingSymbol,
    setEditingSymbol,
  }
}
