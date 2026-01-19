'use client';

import { useEffect, useState } from 'react';
import { FormSelect } from 'react-bootstrap';
import { useAuth } from '@/context/useAuthContext';
import { useAccessibleFunds } from '@/hooks/usePermission';
import { getAllFundsAdmin } from '@/lib/api/fund';

/**
 * FundSelector component that only shows funds the user has access to
 * @param {Object} props
 * @param {Function} props.onChange - Callback when fund selection changes
 * @param {string|number} props.value - Currently selected fund ID
 * @param {boolean} props.showAll - If true, show all funds (admin mode)
 * @param {string} props.className - Additional CSS classes
 */
const FundSelector = ({ onChange, value, showAll = false, className = '' }) => {
  const { permissions } = useAuth();
  const accessibleFundIds = useAccessibleFunds();
  const [allFunds, setAllFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        setLoading(true);
        const data = await getAllFundsAdmin();
        const funds = data?.funds || data || [];
        setAllFunds(funds);
      } catch (error) {
        console.error('Failed to fetch funds:', error);
        setAllFunds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, []);

  // Filter funds based on permissions unless showAll is true
  const availableFunds = showAll
    ? allFunds
    : allFunds.filter(fund => {
        const fundId = fund.fund_id || fund.id;
        return accessibleFundIds.includes(String(fundId)) || 
               accessibleFundIds.includes(String(fundId));
      });

  if (loading) {
    return (
      <FormSelect disabled className={className}>
        <option>Loading funds...</option>
      </FormSelect>
    );
  }

  return (
    <FormSelect
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      className={className}
    >
      <option value="">Select Fund</option>
      {availableFunds.map((fund) => {
        const fundId = fund.fund_id || fund.id;
        const fundName = fund.fund_name || fund.name || `Fund ${fundId}`;
        return (
          <option key={fundId} value={fundId}>
            {fundName}
          </option>
        );
      })}
      {availableFunds.length === 0 && (
        <option disabled>No funds available</option>
      )}
    </FormSelect>
  );
};

export default FundSelector;
