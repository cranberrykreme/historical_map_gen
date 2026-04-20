import React, { useState, useRef } from 'react';
import API_BASE_URL from '../config/api';
import { AssetType } from '../types';

interface AssetImporterProps {
    onUploadComplete: (filename: string, type: AssetType ) => void;
}

function AssetImporter({ onUploadComplete }: AssetImporterProps) {
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [assetType, setAssetType] = useState<AssetType>('units');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', assetType);

        try {
            const response = await fetch(`${API_BASE_URL}/api/assets/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                onUploadComplete(data.filename, data.type);
            }
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    return(
        <div>
            <select 
                value={assetType}
                onChange={e => setAssetType(e.target.value as AssetType)}
            >
                <option value="units">Units</option>
                <option value="portraits">Portraits</option>
                <option value="maps">Maps</option>
            </select>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    border: `2px dashed ${isDragging ? '#ffffff' : '#666666'}`,
                    padding: '20px',
                    cursor: 'pointer',
                    background: isDragging ? '#333333' : 'transparent',
                }}
            >
                {isUploading ? '...Uploading' : 'Drop asset here or click to browse'}
                <input 
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                />
            </div>
        </div>
    );
}

export default AssetImporter;