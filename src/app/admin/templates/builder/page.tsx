'use client';

import React, { useState } from 'react';
import { CertificateCanvas } from '@/components/CertificateCanvas';

/**
 * Certificate Template Builder Demo Page
 * 
 * This page demonstrates the Canvas component functionality
 */
export default function CertificateBuilderPage() {
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Certificate Template Builder</h1>
        
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Upload Background Image (Optional)
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4" style={{ height: '800px' }}>
          <CertificateCanvas backgroundImage={backgroundImage}>
            {/* Demo elements will be added here in future tasks */}
            <div
              className="absolute bg-blue-500 text-white p-2 rounded"
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              Demo Element
            </div>
          </CertificateCanvas>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h2 className="font-semibold mb-2">Canvas Features:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>✓ Fixed A4 landscape dimensions (1122px × 794px)</li>
            <li>✓ White background by default</li>
            <li>✓ Dimension indicators displayed above canvas</li>
            <li>✓ Responsive scaling for different screen sizes</li>
            <li>✓ Maintains aspect ratio when scaled</li>
            <li>✓ Background image support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
