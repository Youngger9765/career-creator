/**
 * Admin Users Management Page
 *
 * Features:
 * - Batch create users from email list
 * - View creation results
 * - Copy credentials
 * - Duplicate handling
 */

'use client';

import { useState } from 'react';
import { Copy, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { adminAPI, type BatchCreateUserResponse } from '@/lib/admin-api';

export default function AdminUsersPage() {
  const [emailList, setEmailList] = useState('');
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'reset_password'>('skip');
  const [results, setResults] = useState<BatchCreateUserResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse and validate email list
  const parseEmails = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const valid = lines.filter((l) => emailRegex.test(l));
    const invalid = lines.filter((l) => !emailRegex.test(l));
    const duplicates = valid.filter((e, i) => valid.indexOf(e) !== i);

    return { valid, invalid, duplicates: [...new Set(duplicates)] };
  };

  const { valid, invalid, duplicates } = parseEmails(emailList);

  const handleSubmit = async () => {
    if (valid.length === 0) {
      setError('Please enter at least one valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uniqueEmails = [...new Set(valid)];
      const response = await adminAPI.batchCreateUsers({
        emails: uniqueEmails,
        on_duplicate: duplicateAction,
      });

      setResults(response);
    } catch (err: any) {
      console.error('Batch create error:', err);
      setError(err.response?.data?.detail || 'Failed to create users');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadCSV = () => {
    if (!results) return;

    const rows = [
      ['Email', 'Password', 'Status'],
      ...results.success.map((u) => [u.email, u.password, 'Created']),
      ...results.existing.map((u) => [u.email, u.password || 'N/A', u.action]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">用戶管理</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          批次建立 Beta 測試用戶帳號
        </p>
      </div>

      {/* Main Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email 清單 （每行一個）
          </label>
          <textarea
            value={emailList}
            onChange={(e) => setEmailList(e.target.value)}
            placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
            className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
          />

          {/* Validation Info */}
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <span className="text-green-600 dark:text-green-400">
              ✓ {valid.length} 個有效 Email
            </span>
            {invalid.length > 0 && (
              <span className="text-red-600 dark:text-red-400">
                ✗ {invalid.length} 個無效格式
              </span>
            )}
            {duplicates.length > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400">
                ⚠ {duplicates.length} 個重複 Email（將自動去重）
              </span>
            )}
          </div>
        </div>

        {/* Duplicate Handling */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            重複 Email 處理方式
          </label>
          <select
            value={duplicateAction}
            onChange={(e) => setDuplicateAction(e.target.value as 'skip' | 'reset_password')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="skip">跳過已存在的用戶</option>
            <option value="reset_password">重設已存在用戶的密碼</option>
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-200 font-medium">錯誤</p>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || valid.length === 0}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              建立中...
            </>
          ) : (
            `建立 ${valid.length} 個帳號`
          )}
        </button>
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {results.success.length}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">建立成功</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {results.existing.length}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">已存在</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {results.failed.length}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">建立失敗</p>
                </div>
              </div>
            </div>
          </div>

          {/* Download CSV Button */}
          {(results.success.length > 0 || results.existing.length > 0) && (
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              下載帳密清單 (CSV)
            </button>
          )}

          {/* Success List */}
          {results.success.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                建立成功 ({results.success.length})
              </h3>
              <div className="space-y-3">
                {results.success.map((user, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1 font-mono text-sm">
                      <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{user.password}</p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(`Email: ${user.email}\nPassword: ${user.password}`)
                      }
                      className="ml-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="複製帳密"
                    >
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing List */}
          {results.existing.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                已存在用戶 ({results.existing.length})
              </h3>
              <div className="space-y-3">
                {results.existing.map((user, index) => (
                  <div
                    key={index}
                    className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1 font-mono text-sm">
                      <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                      {user.password ? (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{user.password}</p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-500 mt-1 italic">已跳過</p>
                      )}
                    </div>
                    {user.password && (
                      <button
                        onClick={() =>
                          copyToClipboard(`Email: ${user.email}\nPassword: ${user.password}`)
                        }
                        className="ml-4 p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded transition-colors"
                        title="複製帳密"
                      >
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed List */}
          {results.failed.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                建立失敗 ({results.failed.length})
              </h3>
              <div className="space-y-3">
                {results.failed.map((user, index) => (
                  <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-gray-900 dark:text-white font-medium font-mono text-sm">
                      {user.email}
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{user.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
