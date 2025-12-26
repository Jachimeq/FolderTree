import React from "react";
import { AlertTriangle, CheckCircle, Folder, FileText, Info } from "lucide-react";
import type { PlanResult } from "../api/ops";

interface PlanPanelProps {
  plan: PlanResult | null;
  onApply?: () => void;
  onCancel?: () => void;
  busy?: boolean;
}

export default function PlanPanel({ plan, onApply, onCancel, busy }: PlanPanelProps) {
  if (!plan) {
    return (
      <div className="card">
        <div className="p-4 text-center text-neutral-500">
          <Info size={24} className="mx-auto mb-2" />
          No plan generated yet. Use AI Generate or Plan from Text.
        </div>
      </div>
    );
  }

  const { stats, operations, rollback } = plan;
  const hasConflicts = stats.overwriteCount > 0;

  return (
    <div className="card space-y-3">
      <div className="card-header">
        <div>
          <div className="card-title">Execution Plan</div>
          <div className="card-subtitle">Review operations before applying</div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Total Operations</div>
          <div className="text-2xl font-semibold text-blue-400">{stats.total}</div>
        </div>
        <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Directories</div>
          <div className="text-2xl font-semibold text-neutral-200">{stats.dirs}</div>
        </div>
        <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Files</div>
          <div className="text-2xl font-semibold text-neutral-200">{stats.files}</div>
        </div>
        <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">Overwrites</div>
          <div className={`text-2xl font-semibold ${hasConflicts ? 'text-yellow-400' : 'text-green-400'}`}>
            {stats.overwriteCount}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {hasConflicts && (
        <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
          <AlertTriangle size={18} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-200">
            <strong>Warning:</strong> {stats.overwriteCount} file{stats.overwriteCount !== 1 ? 's' : ''} will be overwritten.
            Existing files will be replaced.
          </div>
        </div>
      )}

      {/* Rollback info */}
      <div className="p-3 rounded bg-blue-500/10 border border-blue-500/30 flex items-start gap-2">
        <Info size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-200">
          <strong>Rollback:</strong> {rollback.note}
        </div>
      </div>

      {/* Operations list */}
      <div>
        <div className="text-sm font-medium text-neutral-300 mb-2">Operations Preview (first 50)</div>
        <div className="max-h-64 overflow-auto rounded border border-neutral-800 bg-neutral-950">
          <ul className="divide-y divide-neutral-900">
            {operations.slice(0, 50).map((op, idx) => (
              <li
                key={idx}
                className={`px-3 py-2 text-sm flex items-center gap-2 ${
                  op.willOverwrite ? 'bg-yellow-500/5' : ''
                }`}
              >
                {op.op === 'mkdir' ? (
                  <Folder size={16} className="text-blue-400 flex-shrink-0" />
                ) : (
                  <FileText size={16} className="text-neutral-300 flex-shrink-0" />
                )}
                {op.exists && !op.willOverwrite && (
                  <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                )}
                {op.willOverwrite && (
                  <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
                )}
                <span className="text-neutral-400 text-xs uppercase">{op.op}</span>
                <span className="text-neutral-200 truncate flex-1">{op.path}</span>
                {op.willOverwrite && (
                  <span className="text-xs text-yellow-400 flex-shrink-0">OVERWRITE</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          className="btn-primary flex-1"
          onClick={onApply}
          disabled={busy}
        >
          {busy ? 'Applying...' : 'Apply Changes'}
        </button>
        <button
          className="btn-secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
