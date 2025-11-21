'use client';
import axios from 'axios';
import { useState } from 'react';

const DeleteTradeButton = (props) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (loading) return;
    if (!props?.data?.trade_id) return;
    if (!window.confirm(`Are you sure you want to delete trade ${props.data.trade_id}?`)) return;

    try {
      setLoading(true);
      const response = await axios.delete(`/api/v1/trade/${props.data.trade_id}`, {
        withCredentials: true, // if you use auth cookies
      });

      // Check if response indicates success
      if (response?.data?.success === false) {
        throw new Error(response?.data?.message || 'Failed to delete trade')
      }

      // Remove from grid without reload
      if (props.api) props.api.applyTransaction({ remove: [props.data] });

      // Show success message
      const successMessage = response?.data?.message || 'Trade deleted successfully.'
      window.alert(successMessage)
    } catch (err) {
      console.error('Delete trade failed:', err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete trade.'
      window.alert(message)
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="btn btn-danger btn-sm"
      title="Delete trade"
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  );
};

export default DeleteTradeButton;
