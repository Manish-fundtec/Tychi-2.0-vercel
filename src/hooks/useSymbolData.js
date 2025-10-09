import { useEffect, useState, useCallback } from 'react'
import { getSymbols, getSymbolsByFundId, deleteSymbol } from '@/lib/api/symbol'
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

  const handleEdit = (symbol) => {
    setEditingSymbol(symbol)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this symbol?')) {
      await deleteSymbol(id)
      refetchSymbols()
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
