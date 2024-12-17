import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { Settings, X, Download, Trash2, Filter } from 'lucide-react';

type LogLevel = 'info' | 'warn' | 'error';

export function LogViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.level === filter;
    const matchesSearch = search === '' || 
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.data).toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const downloadLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!import.meta.env.DEV) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700"
        title="Ver logs"
      >
        <Settings className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed inset-4 bg-white rounded-lg shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Visor de Logs</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadLogs}
                  className="p-2 text-gray-600 hover:text-gray-900"
                  title="Descargar logs"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => logger.clearLogs()}
                  className="p-2 text-gray-600 hover:text-gray-900"
                  title="Limpiar logs"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 p-4 border-b">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as LogLevel | 'all')}
                  className="border rounded px-2 py-1"
                >
                  <option value="all">Todos</option>
                  <option value="info">Info</option>
                  <option value="warn">Warn</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en logs..."
                className="flex-1 border rounded px-3 py-1"
              />
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-2 p-2 rounded ${
                    log.level === 'error'
                      ? 'bg-red-50'
                      : log.level === 'warn'
                      ? 'bg-yellow-50'
                      : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        log.level === 'error'
                          ? 'bg-red-100 text-red-800'
                          : log.level === 'warn'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.level.toUpperCase()}
                    </span>
                    {log.userId && (
                      <span className="text-xs text-gray-500">
                        User: {log.userId}
                      </span>
                    )}
                  </div>
                  <div className="mt-1">{log.message}</div>
                  {log.data && (
                    <pre className="mt-1 text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(JSON.parse(log.data), null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}