import { useState, useEffect, useCallback } from 'react';
import { getBanks, deleteBank } from '@/lib/api/bank';
import { useDashboardToken } from '@/hooks/useDashboardToken'; // must expose fund_id
export const useBankData = () => {
  const token = useDashboardToken();          // may be null briefly
  const fund_id = token?.fund_id || null;
  const [banks, setBanks] = useState([]);
  const [editingBank, setEditingBank] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const refetchBanks = useCallback(async () => {
    if (!fund_id) return;                     
    try {
      const rows = await getBanks(fund_id);   
      setBanks(rows || []);
    } catch (err) {
      console.error(':x: Failed to fetch banks:', err);
      setBanks([]);
    }
  }, [fund_id]);
  useEffect(() => {
    refetchBanks();
  }, [refetchBanks]);
  const handleEdit = (bank) => {
    console.log('Edit clicked for:', bank);
    setEditingBank(bank);
    setShowModal(true);
  };
  const handleDelete = async (bank_id) => {
    if (confirm('Are you sure you want to delete this bank?')) {
      try {
        await deleteBank(bank_id);
        await refetchBanks();
      } catch (e) {
        console.error(':x: Delete failed:', e);
      }
    }
  };
  return {
    banks,
    refetchBanks,
    handleEdit,
    handleDelete,
    showModal,
    setShowModal,
    editingBank,
    setEditingBank,
  };
};
// ?? USE BANK TAB

// ??






