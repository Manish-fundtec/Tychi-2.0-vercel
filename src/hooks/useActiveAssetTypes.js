// hooks/useActiveAssetTypes.js
import { useEffect, useState } from 'react';
import axios from 'axios';

export const useActiveAssetTypes = (fund_id) => {
  const [assetTypes, setAssetTypes] = useState([]);

  useEffect(() => {
    const fetchActiveAssetTypes = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/assettype/fund/${fund_id}/active`);
        setAssetTypes(response.data || []);
      } catch (err) {
        console.error("Failed to fetch active asset types:", err);
      }
    };

    if (fund_id) {
      fetchActiveAssetTypes();
    }
  }, [fund_id]);

  return assetTypes;
};
