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
      await axios.delete(`/api/v1/trade/${props.data.trade_id}`, {
        withCredentials: true, // if you use auth cookies
      });

      // Remove from grid without reload
      if (props.api) props.api.applyTransaction({ remove: [props.data] });

      alert('Trade deleted successfully');
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.error || 'Failed to delete trade');
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
