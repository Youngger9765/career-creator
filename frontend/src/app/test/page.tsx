'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [apiStatus, setApiStatus] = useState<string>('Testing...');
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  useEffect(() => {
    // Test health endpoint
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus(`✅ API Connected: ${data.status} (${data.environment})`);
      })
      .catch(err => {
        setApiStatus(`❌ API Error: ${err.message}`);
      });

    // Test demo accounts endpoint
    fetch('/api/auth/demo-accounts')
      .then(res => res.json())
      .then(data => {
        setDemoAccounts(data);
      })
      .catch(err => {
        console.error('Demo accounts error:', err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 API Integration Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Backend Connection</h2>
          <p className="text-lg">{apiStatus}</p>

          <div className="mt-4 text-sm text-gray-600">
            <p>Frontend: http://localhost:3002</p>
            <p>Backend: http://localhost:8000</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Demo Accounts</h2>
          {demoAccounts.length > 0 ? (
            <div className="space-y-2">
              {demoAccounts.map((account, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p className="font-medium">{account.email}</p>
                  <p className="text-sm text-gray-600">{account.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Loading demo accounts...</p>
          )}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
