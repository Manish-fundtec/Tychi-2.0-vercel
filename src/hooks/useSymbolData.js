import { useEffect, useState, useCallback, useRef } from 'react'
import { getSymbols, getSymbolsByFundId, deleteSymbol } from '@/lib/api/symbol'
import api from '@/lib/api/axios'

export const useSymbolData = (fundId) => {
  const [editingSymbol, setEditingSymbol] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const gridApiRef = useRef(null)

  // Create datasource for infinite row model
  const createDatasource = useCallback((pageSize = 10) => {
    return {
      getRows: async (params) => {
        if (!fundId) {
          setTotalRecords(0)
          params.successCallback([], 0)
          return
        }

        try {
          setLoading(true)
          
          // Calculate page number from startRow
          const page = Math.floor(params.startRow / pageSize) + 1
          
          console.log('[useSymbolData] Fetching page:', page, 'limit:', pageSize, 'startRow:', params.startRow)
          
          const response = await getSymbolsByFundId(fundId, page, pageSize)
          
          // Handle different response structures
          let rows = []
          let total = 0
          
          if (Array.isArray(response)) {
            // Direct array response (fallback)
            rows = response
            total = response.length
          } else if (response?.data && Array.isArray(response.data)) {
            // Standard paginated response: { data: [], total: number, page: number, limit: number }
            rows = response.data
            total = response.total || response.count || response.totalRecords || 0
            // Ensure total matches actual data if data is empty
            if (rows.length === 0 && total > 0) {
              total = 0
            }
          } else if (response?.rows && Array.isArray(response.rows)) {
            // Alternative structure: { rows: [], total: number }
            rows = response.rows
            total = response.total || response.count || response.totalRecords || 0
            // Ensure total matches actual data if data is empty
            if (rows.length === 0 && total > 0) {
              total = 0
            }
          }
          
          setTotalRecords(total)
          
          // Check if we've reached the end
          // For empty data, set lastRow to 0 (not null) to prevent showing placeholder rows
          const lastRow = total > 0 && rows.length > 0 ? total : 0
          
          console.log('[useSymbolData] ✅ Fetched', rows.length, 'rows, total:', total, 'lastRow:', lastRow)
          
          // Call success callback with rows and lastRow
          params.successCallback(rows, lastRow)
        } catch (err) {
          console.error('[useSymbolData] Failed to fetch symbols:', err)
          params.failCallback()
          setTotalRecords(0)
        } finally {
          setLoading(false)
        }
      }
    }
  }, [fundId])

  // Refresh grid data (for after create/update/delete)
  const refreshGrid = useCallback(() => {
    if (gridApiRef.current) {
      // Refresh infinite cache
      gridApiRef.current.refreshInfiniteCache()
    }
  }, [])

  // Refetch symbols (for compatibility with existing code)
  const refetchSymbols = useCallback(async () => {
    refreshGrid()
  }, [refreshGrid])

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
      refreshGrid()
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
    loading,
    totalRecords,
    createDatasource,
    refreshGrid,
    refetchSymbols,
    handleEdit,
    handleDelete,
    showModal,
    setShowModal,
    editingSymbol,
    setEditingSymbol,
    gridApiRef,
  }
}
