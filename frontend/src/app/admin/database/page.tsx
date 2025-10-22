'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DBStatus {
  status: string;
  database?: string;
  size?: string;
  error?: string;
}

interface TableInfo {
  name: string;
  row_count: number;
  column_count: number;
}

interface TableData {
  table: string;
  columns: string[];
  data: any[];
  total: number;
  limit: number;
  offset: number;
}

export default function DatabaseManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [seedLoading, setSeedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 50;

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };

  // Fetch database status
  const fetchDBStatus = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/admin/db/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDbStatus(response.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('需要管理員權限才能訪問此頁面');
      } else if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError('無法連接到資料庫');
      }
    }
  }, [router]);

  // Fetch tables list
  const fetchTables = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/api/admin/db/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables(response.data);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    }
  }, []);

  // Fetch table data
  const fetchTableData = async (tableName: string, page: number = 1) => {
    try {
      const token = getAuthToken();
      const offset = (page - 1) * pageSize;
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/db/table/${tableName}?limit=${pageSize}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTableData(response.data);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch table data:', err);
    }
  };

  // Seed database
  const seedDatabase = async (includeTest: boolean = false) => {
    if (!confirm(`確定要重新初始化資料庫${includeTest ? '（包含測試資料）' : ''}嗎？`)) {
      return;
    }

    setSeedLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/db/seed`,
        { include_test: includeTest },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(response.data.message);
      await fetchTables();
      if (selectedTable) {
        await fetchTableData(selectedTable, 1);
      }
    } catch (err: any) {
      alert(`種子資料失敗: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  // Clear table
  const clearTable = async (tableName: string) => {
    if (!confirm(`確定要清空 ${tableName} 表格的所有資料嗎？此操作無法復原！`)) {
      return;
    }

    try {
      const token = getAuthToken();
      await axios.delete(`${API_BASE_URL}/api/admin/db/table/${tableName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`表格 ${tableName} 已清空`);
      await fetchTables();
      if (selectedTable === tableName) {
        await fetchTableData(tableName, 1);
      }
    } catch (err: any) {
      alert(`清空表格失敗: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDBStatus();
      await fetchTables();
      setLoading(false);
    };
    init();
  }, [fetchDBStatus, fetchTables]);

  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    fetchTableData(tableName, 1);
  };

  // Pagination
  const totalPages = tableData ? Math.ceil(tableData.total / pageSize) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">資料庫管理</h1>

          {/* Database Status */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-100 rounded">
              <div className="text-sm text-gray-600">狀態</div>
              <div className="text-lg font-semibold">
                {dbStatus?.status === 'connected' ? (
                  <span className="text-green-600">✅ 已連接</span>
                ) : (
                  <span className="text-red-600">❌ 連接失敗</span>
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-100 rounded">
              <div className="text-sm text-gray-600">資料庫</div>
              <div className="text-lg font-semibold">{dbStatus?.database || '-'}</div>
            </div>
            <div className="p-4 bg-gray-100 rounded">
              <div className="text-sm text-gray-600">大小</div>
              <div className="text-lg font-semibold">{dbStatus?.size || '-'}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => seedDatabase(false)}
              disabled={seedLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {seedLoading ? '初始化中...' : '初始化資料庫（生產資料）'}
            </button>
            <button
              onClick={() => seedDatabase(true)}
              disabled={seedLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {seedLoading ? '初始化中...' : '初始化資料庫（含測試資料）'}
            </button>
            <button
              onClick={() => {
                fetchDBStatus();
                fetchTables();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              重新整理
            </button>
          </div>
        </div>

        {/* Tables and Data */}
        <div className="grid grid-cols-4 gap-6">
          {/* Tables List */}
          <div className="col-span-1 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">資料表</h2>
            <div className="space-y-2">
              {tables.map((table) => (
                <div
                  key={table.name}
                  onClick={() => handleTableSelect(table.name)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedTable === table.name
                      ? 'bg-blue-100 border-blue-500 border'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{table.name}</div>
                  <div className="text-sm text-gray-600">
                    {table.row_count} 筆資料 | {table.column_count} 欄位
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Data */}
          <div className="col-span-3 bg-white rounded-lg shadow-md p-4">
            {selectedTable && tableData ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    {selectedTable} ({tableData.total} 筆資料)
                  </h2>
                  <button
                    onClick={() => clearTable(selectedTable)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    清空表格
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {tableData.columns.map((col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableData.data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {tableData.columns.map((col) => (
                            <td key={col} className="px-4 py-3 whitespace-nowrap text-sm">
                              {typeof row[col] === 'object'
                                ? JSON.stringify(row[col])
                                : String(row[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      onClick={() => fetchTableData(selectedTable, currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      上一頁
                    </button>
                    <span className="px-3 py-1">
                      第 {currentPage} / {totalPages} 頁
                    </span>
                    <button
                      onClick={() => fetchTableData(selectedTable, currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      下一頁
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">請從左側選擇一個資料表</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
