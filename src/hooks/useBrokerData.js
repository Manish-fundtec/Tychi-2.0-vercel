// src/hooks/useBrokerData.js
// <<<<<<< HEAD
// import { useState, useEffect, useRef } from 'react'
// import { getBrokers, deleteBroker } from '@/lib/api/broker'
// const normalize = (res) => {
//   if (!res) return []
//   if (Array.isArray(res.data)) return res.data // backend returns array
//   if (Array.isArray(res.data?.data)) return res.data.data // backend returns { success, data: [...] }
//   return []
// }

// export const useBrokerData = () => {
//   const [brokers, setBrokers] = useState([])
//   const [editingBroker, setEditingBroker] = useState(null)
//   const [showModal, setShowModal] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [errorText, setErrorText] = useState('')

//   const refetchBrokers = async () => {
//     try {
//       const res = await getBrokers()
//       setBrokers(res.data || [])
//     } catch (err) {
//       console.error('❌ Failed to fetch brokers:', err)
//     }
//   }

//   useEffect(() => {
//     refetchBrokers()
//   }, [])

//   const handleEdit = (broker) => {
//     console.log('Edit clicked for:', broker)
//     setEditingBroker(broker)
//     setShowModal(true)
//   }

//   // Accept either the whole broker row OR an id
//   const handleDelete = async (brokerOrId) => {
//     const id = typeof brokerOrId === 'object' && brokerOrId ? brokerOrId.broker_uid || brokerOrId.broker_id || brokerOrId.id : brokerOrId

//     if (!id) {
//       alert('Could not determine broker id to delete.')
//       return
//     }

// =======
import { useState, useEffect, useCallback } from 'react';
import { getBrokers, deleteBroker } from '@/lib/api/broker';
/**
 * Brokers hook (fund-scoped)
 * @param {string} fundId - required
 */
export const useBrokerData = (fundId) => {
  const [brokers, setBrokers] = useState([]);
  const [editingBroker, setEditingBroker] = useState(null);
  const [showModal, setShowModal] = useState(false);
// inside useBrokerData
const refetchBrokers = useCallback(async () => {
  if (!fundId) return; // :arrow_left: guards API call
  const list = await getBrokers(fundId);
  setBrokers(Array.isArray(list) ? list : []);
}, [fundId]);
  useEffect(() => {
    refetchBrokers();
  }, [refetchBrokers]);
  const handleEdit = (broker) => {
    setEditingBroker(broker);
    setShowModal(true);
  };
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this broker?')) {
      try {
        await deleteBroker(id)
        await refetchBrokers()
      } catch (e) {
        console.error(':x: Delete failed:', e)
        alert(e?.response?.data?.error || 'Server error while deleting broker')
      }
    }
  }
  return {
    brokers,
    refetchBrokers,
    editingBroker,
    setEditingBroker,
    showModal,
    setShowModal,
    handleEdit,
    handleDelete,
  };
};



// ??

