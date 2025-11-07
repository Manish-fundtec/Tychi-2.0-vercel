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
      console.error('[DeleteTrade] failed:', error);

      const payload = error?.response?.data;
      let backendMessage = '';

      if (payload) {
        if (typeof payload === 'string') {
          backendMessage = payload;
        } else if (typeof payload === 'object') {
          backendMessage =
            (typeof payload.message === 'string' && payload.message) ||
            (typeof payload.error === 'string' && payload.error) ||
            (typeof payload.details === 'string' && payload.details) ||
            (typeof payload.reason === 'string' && payload.reason) ||
            '';

          if (!backendMessage && Array.isArray(payload.errors)) {
            backendMessage = payload.errors
              .map((err) => (typeof err === 'string' ? err : err?.message))
              .filter(Boolean)
              .join('\n');
          }

          if (!backendMessage) {
            const month = payload.month || payload.pricing_month;
            const pricingId = payload.pricing_id || payload.pricingId;
            if (month || pricingId) {
              backendMessage = `Cannot delete trade because pricing already exists for ${month || 'this month'}${
                pricingId ? ` (pricing id ${pricingId})` : ''
              }.`;
            }
          }
        }
      }

      const message =
        backendMessage || error?.message || 'Failed to delete trade. Please try again or contact support.';

      alert(message);
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
