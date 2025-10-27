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
    // Edit functionality removed
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
import api from '@/lib/api/axios';

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
  
  // Helper function to check if broker has associated trades
  const checkBrokerHasTrades = async (brokerId) => {
    if (!fundId || !brokerId) return false;
    
    try {
      const res = await api.get(`/api/v1/trade/fund/${fundId}`);
      const trades = Array.isArray(res?.data?.data) ? res.data.data : [];
      
      // Check if any trade has this broker_id
      return trades.some(trade => trade.broker_id === brokerId);
    } catch (error) {
      console.error('Error checking broker trades:', error);
      return false;
    }
  };
  
  const handleEdit = async (broker) => {
    // Check if broker has associated trades
    const hasTrades = await checkBrokerHasTrades(broker.broker_id);
    
    if (hasTrades) {
      alert('Cannot edit broker: This broker has associated trades. Please delete or modify the trades first.');
      return;
    }
    
    setEditingBroker(broker);
    setShowModal(true);
  };
  
  const handleDelete = async (brokerOrId) => {
    // Extract ID from either the broker object or plain ID
    const id = typeof brokerOrId === 'object' && brokerOrId ? brokerOrId.broker_id : brokerOrId
    
    if (!id) {
      alert('Could not determine broker ID to delete.')
      return
    }

    if (confirm('Are you sure you want to delete this broker?')) {
      try {
        // Check if broker has associated trades before deleting
        const hasTrades = await checkBrokerHasTrades(id);
        
        if (hasTrades) {
          alert('Cannot delete broker: This broker has associated trades. Please delete or reassign the trades first.');
          return;
        }
        
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

