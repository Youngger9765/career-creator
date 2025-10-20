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

import { useState, useRef } from 'react';
import { Copy, CheckCircle, XCircle, AlertCircle, Download, Upload, FileText } from 'lucide-react';
import { adminAPI, type BatchCreateUserResponse, type WhitelistImportResult } from '@/lib/admin-api';

export default function AdminUsersPage() {
  const [emailList, setEmailList] = useState('');
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'reset_password'>('skip');
  const [results, setResults] = useState<BatchCreateUserResponse | null>(null);
  const [importResults, setImportResults] = useState<WhitelistImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV format: email,password,name,roles
  const parseCSV = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const parsed: { email: string; password?: string; name?: string; roles?: string[] }[] = [];
    const invalid: string[] = [];

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      const email = parts[0];

      if (!emailRegex.test(email)) {
        invalid.push(line);
        continue;
      }

      const password = parts[1] || undefined;
      const name = parts[2] || undefined;
      const rolesStr = parts[3] || undefined;
      const roles = rolesStr ? rolesStr.split(';').map((r) => r.trim()) : undefined;

      parsed.push({ email, password, name, roles });
    }

    const emails = parsed.map((p) => p.email);
    const duplicates = emails.filter((e, i) => emails.indexOf(e) !== i);

    return { parsed, valid: emails, invalid, duplicates: [...new Set(duplicates)] };
  };

  const { parsed, valid, invalid, duplicates } = parseCSV(emailList);

  const handleSubmit = async () => {
    if (valid.length === 0) {
      setError('請輸入有效的 Email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Single user input
      const user = parsed[0];
      if (!user.password || user.password.length < 8) {
        setError('密碼至少需要 8 個字元');
        setLoading(false);
        return;
      }

      const response = await adminAPI.batchCreateUsers({
        users: [
          {
            email: user.email,
            password: user.password,
            name: user.name,
            roles: user.roles,
          },
        ],
        on_duplicate: 'reset_password', // Always overwrite for single user
      });

      setResults(response);
      // Clear form on success
      if (response.success.length > 0 || response.existing.length > 0) {
        setEmailList('');
      }
    } catch (err: any) {
      console.error('Batch create error:', err);
      setError(err.response?.data?.detail || '建立/更新失敗');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('請上傳 CSV 檔案');
      return;
    }

    setLoading(true);
    setError(null);
    setImportResults(null);

    try {
      const result = await adminAPI.importWhitelist(file);
      setImportResults(result);
    } catch (err: any) {
      console.error('Import whitelist error:', err);
      setError(err.response?.data?.detail || '檔案匯入失敗');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const csv = [
      ['email', 'password'],
      ['user1@example.com', 'password123'],
      ['user2@example.com', 'password456'],
      ['user3@example.com', 'password789'],
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whitelist_template.csv';
    a.click();
    URL.revokeObjectURL(url);
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

  const downloadImportCSV = () => {
    if (!importResults) return;

    const rows = [
      ['Email', 'Password'],
      ...importResults.created_users.map((u) => [u.email, u.password]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whitelist_passwords_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">用戶管理</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">批次建立 Beta 測試用戶帳號</p>
      </div>

      {/* CSV Import Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              CSV 白名單匯入
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              上傳 CSV 檔案批次建立/更新用戶（格式：email,password，自動覆蓋已存在帳號）
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            下載 CSV 範本
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
              點擊上傳 CSV 檔案
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              格式：email,password
            </p>
          </label>
        </div>
      </div>

      {/* Import Results */}
      {importResults && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {importResults.created}
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
                    {importResults.skipped}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">已跳過</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {importResults.errors.length}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">錯誤</p>
                </div>
              </div>
            </div>
          </div>

          {/* Download CSV */}
          {importResults.created_users.length > 0 && (
            <button
              onClick={downloadImportCSV}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              下載帳密清單 (CSV)
            </button>
          )}

          {/* Created Users */}
          {importResults.created_users.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                建立成功 ({importResults.created_users.length})
              </h3>
              <div className="space-y-3">
                {importResults.created_users.map((user, index) => (
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

          {/* Errors */}
          {importResults.errors.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                錯誤 ({importResults.errors.length})
              </h3>
              <ul className="space-y-2">
                {importResults.errors.map((error, index) => (
                  <li
                    key={index}
                    className="text-sm text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded"
                  >
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700"></div>

      {/* Single User Quick Add */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            快速新增/重設單一用戶
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            輸入單一帳號密碼，方便臨時新增或重設密碼
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={emailList.split(',')[0] || ''}
              onChange={(e) => {
                const parts = emailList.split(',');
                parts[0] = e.target.value;
                setEmailList(parts.join(','));
              }}
              placeholder="user@example.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              密碼
            </label>
            <input
              type="text"
              value={emailList.split(',')[1] || ''}
              onChange={(e) => {
                const parts = emailList.split(',');
                parts[1] = e.target.value;
                setEmailList(parts.join(','));
              }}
              placeholder="password123"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Validation Info */}
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {valid.length > 0 && (
            <span className="text-green-600 dark:text-green-400">✓ Email 格式正確</span>
          )}
          {invalid.length > 0 && (
            <span className="text-red-600 dark:text-red-400">✗ Email 格式錯誤</span>
          )}
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
              處理中...
            </>
          ) : (
            '建立/更新用戶'
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
