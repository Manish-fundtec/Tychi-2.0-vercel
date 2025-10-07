// src/hooks/useExchangeData.js
import { useState, useEffect, useCallback } from 'react'
import { getExchangesByFundId, deleteExchange } from '@/lib/api/exchange'

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

  useEffect(() => {
    refetchExchanges()
  }, [])

  const handleEdit = (exchange) => {
    setEditingExchange(exchange)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this exchange?')) {
      await deleteExchange(id)
      refetchExchanges()
    }
  }

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
