import { useEffect, useState } from 'react';
import { getAssetTypes, updateAssetTypeStatus, deleteCoaSeedByAssetType } from '../lib/api/assetType';
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
      const res = await getSymbolsByFundId(fundId);
      const symbols = Array.isArray(res?.data) ? res.data : [];
      
      // Check if any symbol uses this asset type
      return symbols.some(symbol => 
        symbol.assettype_id === assetTypeId || 
        symbol.asset_type_id === assetTypeId
      );
    } catch (error) {
      console.error('Error checking asset type symbols:', error);
      return false;
    }
  };

  const toggleAssetTypeStatus = async (assetTypeUid, newStatus) => {
    // Check if trying to deactivate and asset type has associated symbols
    if (newStatus === 'Inactive') {
      const hasSymbols = await checkAssetTypeHasSymbols(assetTypeUid);
      
      if (hasSymbols) {
        alert('Cannot deactivate asset type: This asset type is associated with symbols. Please delete or reassign the symbols first.');
        return;
      }
    }
    
    try {
      await updateAssetTypeStatus(assetTypeUid, newStatus, fundId);

      // If deactivating, delete COA seed data for this asset type
      if (newStatus === 'Inactive') {
        try {
          await deleteCoaSeedByAssetType(assetTypeUid, fundId);
          console.log('COA seed data deleted for asset type:', assetTypeUid);
        } catch (coaError) {
          console.error('Failed to delete COA seed data:', coaError);
          // Don't fail the entire operation if COA deletion fails
        }
      }

      setAssetTypes((prev) =>
        prev.map((item) =>
          item.assettype_id === assetTypeUid
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to update asset type status:', error);
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

  return { assetTypes, toggleAssetTypeStatus,fundId };
};