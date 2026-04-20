import { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../config/api';
import { AssetType } from '../types';

function useAssetList(type: AssetType) {
    const [assets, setAssets] = useState<string[]>([]);

    const fetchAssets = useCallback(() => {
        fetch(`${API_BASE_URL}/api/assets/${type}`)
            .then(response => response.json())
            .then(data => setAssets(data.files))
            .catch(() => console.error(`Could not load ${type} assets`));
    }, [type]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    return { assets, refetch: fetchAssets };
}

export default useAssetList;