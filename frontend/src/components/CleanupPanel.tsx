import React, { useState } from "react";
import { Trash2, Search, AlertCircle, CheckCircle, FolderOpen, FileWarning, Copy, HardDrive } from "lucide-react";
import type { CleanupPlan, CleanupItem } from "../api/ops";

interface CleanupPanelProps {
  plan: CleanupPlan | null;
  selectedPaths: string[];
  onTogglePath: (path: string) => void;
  onClearSelection: () => void;
  onApplyCleanup: (paths?: string[]) => void;
  busy?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getItemIcon(type: CleanupItem['type']) {
  switch (type) {
    case 'emptyDir':
      return <FolderOpen size={16} className="text-blue-400" />;
    case 'largeFile':
      return <FileWarning size={16} className="text-orange-400" />;
    case 'duplicate':
      return <Copy size={16} className="text-yellow-400" />;
    case 'cacheDir':
      return <HardDrive size={16} className="text-purple-400" />;
  }
}

function getTypeLabel(type: CleanupItem['type']) {
  switch (type) {
    case 'emptyDir':
      return 'Empty Dir';
    case 'largeFile':
      return 'Large File';
    case 'duplicate':
      return 'Duplicate';
    case 'cacheDir':
      return 'Cache Dir';
  }
}

export default function CleanupPanel({
  plan,
  selectedPaths,
  onTogglePath,
  onClearSelection,
  onApplyCleanup,
  busy,
}: CleanupPanelProps) {
  const [filter, setFilter] = useState<CleanupItem['type'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!plan) {
    return (
      <div className="card">
        <div className="p-4 text-center text-neutral-500">
          <Search size={24} className="mx-auto mb-2" />
          No cleanup scan yet. Click "Scan Directory" to analyze.
        </div>
      </div>
    );
  }

  const { summary, items } = plan;
  const filteredItems = items
    .filter((item) => filter === 'all' || item.type === filter)
    .filter((item) => item.path.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedItems = items.filter((item) => selectedPaths.includes(item.path));
  const selectedBytes = selectedItems.reduce((acc, item) => acc + item.size, 0);

  const handleSelectAll = () => {
    if (selectedPaths.length === filteredItems.length) {
      onClearSelection();
    } else {
      filteredItems.forEach((item) => {
        if (!selectedPaths.includes(item.path)) {
          onTogglePath(item.path);
        }
      });
    }
  };

  return (
    <div className="card space-y-3">
      <div className="card-header">
        <div>
          <div className="card-title">Cleanup Plan</div>
          <div className="card-subtitle">Select items to delete</div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Empty Dirs</div>
          <div className="text-xl font-semibold text-blue-400">{summary.emptyDirs}</div>
        </div>
        <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Large Files</div>
          <div className="text-xl font-semibold text-orange-400">{summary.largeFiles}</div>
        </div>
        <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Duplicates</div>
          <div className="text-xl font-semibold text-yellow-400">{summary.duplicates}</div>
        </div>
        <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Cache Dirs</div>
          <div className="text-xl font-semibold text-purple-400">{summary.cacheDirs}</div>
        </div>
        <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Total Size</div>
          <div className="text-xl font-semibold text-green-400">{formatBytes(summary.estimatedBytes)}</div>
        </div>
      </div>

      {/* Selection info */}
      {selectedPaths.length > 0 && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400" />
            <span className="text-sm text-red-200">
              <strong>{selectedPaths.length}</strong> items selected ({formatBytes(selectedBytes)} to free)
            </span>
          </div>
          <button className="text-xs text-red-400 hover:text-red-300" onClick={onClearSelection}>
            Clear
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          className="input flex-1 min-w-[200px]"
          placeholder="Search paths..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="select" aria-label="Filter cleanup items by type" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
          <option value="all">All Types</option>
          <option value="emptyDir">Empty Dirs</option>
          <option value="largeFile">Large Files</option>
          <option value="duplicate">Duplicates</option>
          <option value="cacheDir">Cache Dirs</option>
        </select>
      </div>

      {/* Items list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-neutral-300">
            Items ({filteredItems.length})
          </div>
          <button
            className="text-xs text-blue-400 hover:text-blue-300"
            onClick={handleSelectAll}
          >
            {selectedPaths.length === filteredItems.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="max-h-96 overflow-auto rounded border border-neutral-800 bg-neutral-950">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-neutral-500 text-sm">No items match filters</div>
          ) : (
            <ul className="divide-y divide-neutral-900">
              {filteredItems.map((item, idx) => {
                const isSelected = selectedPaths.includes(item.path);
                return (
                  <li
                    key={idx}
                    className={`px-3 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-neutral-900/50 ${
                      isSelected ? 'bg-red-500/10' : ''
                    }`}
                    onClick={() => onTogglePath(item.path)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="flex-shrink-0"
                      aria-label={`Select ${item.path}`}
                    />
                    {getItemIcon(item.type)}
                    <span className="text-xs text-neutral-400 uppercase w-20 flex-shrink-0">
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="text-neutral-200 truncate flex-1" title={item.path}>
                      {item.path}
                    </span>
                    <span className="text-xs text-neutral-400 flex-shrink-0">
                      {formatBytes(item.size)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
          onClick={() => onApplyCleanup(selectedPaths.length > 0 ? selectedPaths : undefined)}
          disabled={busy || items.length === 0}
        >
          <Trash2 size={16} />
          {busy ? 'Deleting...' : selectedPaths.length > 0 ? `Delete Selected (${selectedPaths.length})` : 'Delete All'}
        </button>
      </div>
    </div>
  );
}
