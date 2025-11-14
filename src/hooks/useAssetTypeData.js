import { useEffect, useState } from 'react';
import { getAssetTypes, updateAssetTypeStatus } from '../lib/api/assetType';
import { getSymbolsByFundId } from '../lib/api/symbol';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export const useAssetTypeData = () => {
  const [assetTypes, setAssetTypes] = useState([]);
  const [fundId, setFundId] = useState(null);

  const fetchAssetTypes = async (fund_id) => {
    try {
      const res = await getAssetTypes(fund_id);
      setAssetTypes(res.data || []);
    } catch (error) {
      console.error('Failed to fetch asset types:', error);
    }
  };

  // Helper function to check if asset type has associated symbols
  const checkAssetTypeHasSymbols = async (assetTypeId) => {
    if (!fundId || !assetTypeId) return false;
    
    try {
      console.log('🔍 Checking symbols for asset type:', assetTypeId, 'in fund:', fundId);
      const res = await getSymbolsByFundId(fundId);
      const symbols = Array.isArray(res?.data) ? res.data : [];
      
      console.log('📊 Found symbols:', symbols.length);
      console.log('📋 Symbols data:', symbols);
      
      // Check if any symbol uses this asset type
      const hasSymbols = symbols.some(symbol => {
        const matches = symbol.assettype_id === assetTypeId || symbol.asset_type_id === assetTypeId;
        if (matches) {
          console.log('✅ Found matching symbol:', symbol);
        }
        return matches;
      });
      
      console.log('🎯 Asset type has symbols:', hasSymbols);
      return hasSymbols;
    } catch (error) {
      console.error('Error checking asset type symbols:', error);
      return false;
    }
  };

  const toggleAssetTypeStatus = async (assetTypeUid, newStatus) => {
    try {
      await updateAssetTypeStatus(assetTypeUid, newStatus, fundId);

      // Note: COA seed deletion removed as API doesn't exist

      setAssetTypes((prev) =>
        prev.map((item) =>
          item.assettype_id === assetTypeUid
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (error) {
      const message = error?.message || error?.raw?.message || 'Failed to update asset type status.';
      alert(message);
    }
  };

  useEffect(() => {
    const token = Cookies.get('dashboardToken');
    if (token) {
      const decoded = jwtDecode(token);
      const fund_id = decoded.fund_id;
      setFundId(fund_id);
      fetchAssetTypes(fund_id);
    }
  }, []);

  const refetchAssetTypes = () => {
    if (fundId) fetchAssetTypes(fundId);
  };

  return { assetTypes, toggleAssetTypeStatus, fundId, checkAssetTypeHasSymbols, refetchAssetTypes };
};
