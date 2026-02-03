'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function SessionEndedPage() {
  const router = useRouter();

  useEffect(() => {
    // Clean up visitor session on mount
    if (typeof window !== 'undefined') {
      localStorage.removeItem('visitor_session');
    }
  }, []);

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-3">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">諮商已結束</h1>

        <p className="text-gray-600 mb-8">
          諮商師已離開房間，本次諮商已結束。感謝您的參與！
        </p>

        <Button onClick={handleBackToHome} className="w-full" size="lg">
          返回首頁
        </Button>

        <p className="text-sm text-gray-500 mt-4">
          如有任何問題，請與諮商師聯繫
        </p>
      </div>
    </div>
  );
}
