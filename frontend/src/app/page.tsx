'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { DemoAccount } from '@/types/api';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, user, demoAccounts, loadDemoAccounts, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDemoAccounts();
  }, [loadDemoAccounts]);

  const handleDemoLogin = async (account: DemoAccount) => {
    setIsLoading(true);
    try {
      await login({
        email: account.email,
        password: 'demo123'
      });
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600 mb-6">
              Ready to start your career consultation session?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-800 mb-4">
                  {user.roles.includes('counselor') ? 'Counselor Actions' : 'Your Options'}
                </h2>

                {user.roles.includes('counselor') && (
                  <div className="space-y-3">
                    <Link href="/rooms/create" className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center">
                      Create New Room
                    </Link>
                    <Link href="/rooms" className="block w-full bg-blue-100 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-200 transition-colors text-center">
                      View My Rooms
                    </Link>
                  </div>
                )}

                <Link href="/join" className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-center mt-3">
                  Join Room by Code
                </Link>
              </div>

              <div className="bg-indigo-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-indigo-800 mb-4">
                  Quick Access
                </h2>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>Role:</strong> {user.roles.join(', ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Email:</strong> {user.email}
                  </div>
                  <button
                    onClick={() => useAuthStore.getState().logout()}
                    className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-center mt-4"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Career Creator</h1>
          <p className="text-gray-600">Online Card Consultation Platform</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
            Quick Demo Login
          </h2>

          {demoAccounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleDemoLogin(account)}
              disabled={isLoading}
              className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium text-gray-800">{account.name}</div>
              <div className="text-sm text-gray-600">{account.description}</div>
              <div className="text-xs text-blue-600 mt-1">
                Role: {account.roles.join(', ')}
              </div>
            </button>
          ))}

          {isLoading && (
            <div className="text-center text-gray-600">
              Logging in...
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <Link href="/join" className="text-blue-600 hover:text-blue-700 text-sm">
              Join as visitor with room code →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
