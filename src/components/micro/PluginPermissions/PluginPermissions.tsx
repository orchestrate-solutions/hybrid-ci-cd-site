import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Permission {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
}

interface PluginPermissionsProps {
  permissions: Permission[];
  onApprove: (approvedPermissions: string[]) => void;
  onReject: () => void;
}

function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'var(--semantic-success)';
    case 'medium':
      return 'var(--semantic-warning)';
    case 'high':
      return 'var(--semantic-error)';
    case 'critical':
      return '#D32F2F';
  }
}

function getRiskLabel(level: RiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function getRiskIcon(level: RiskLevel) {
  switch (level) {
    case 'low':
      return null;
    case 'medium':
      return <AlertCircle size={14} />;
    case 'high':
      return <AlertTriangle size={14} />;
    case 'critical':
      return <ShieldAlert size={14} />;
  }
}

export function PluginPermissions({
  permissions,
  onApprove,
  onReject,
}: PluginPermissionsProps) {
  const [checkedPermissions, setCheckedPermissions] = useState<Set<string>>(
    new Set(permissions.map(p => p.id))
  );

  const handleToggle = (permissionId: string) => {
    const newChecked = new Set(checkedPermissions);
    if (newChecked.has(permissionId)) {
      newChecked.delete(permissionId);
    } else {
      newChecked.add(permissionId);
    }
    setCheckedPermissions(newChecked);
  };

  const handleApprove = () => {
    onApprove(Array.from(checkedPermissions));
  };

  if (permissions.length === 0) {
    return (
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--ui-border)',
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Permissions
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          No permissions required
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border p-6"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--ui-border)',
      }}
    >
      <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Required Permissions
      </h2>
      <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Review and approve the permissions this plugin requires:
      </p>

      {/* Permission list */}
      <div className="mb-6 space-y-3">
        {permissions.map(permission => (
          <div
            key={permission.id}
            className="flex items-start gap-3 rounded border p-3 transition-colors hover:bg-opacity-80"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--ui-border)',
            }}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              id={permission.id}
              checked={checkedPermissions.has(permission.id)}
              onChange={() => handleToggle(permission.id)}
              className="mt-1 cursor-pointer"
              style={{ accentColor: 'var(--brand-primary)' }}
              aria-label={`Approve ${permission.name}`}
            />

            {/* Permission details */}
            <div className="flex-1 min-w-0">
              <label
                htmlFor={permission.id}
                className="block cursor-pointer font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {permission.name}
              </label>
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {permission.description}
              </p>
            </div>

            {/* Risk badge */}
            <div
              className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap"
              data-testid={`risk-badge-${permission.riskLevel}`}
              style={{
                backgroundColor: `${getRiskColor(permission.riskLevel)}20`,
                color: getRiskColor(permission.riskLevel),
              }}
            >
              {getRiskIcon(permission.riskLevel)}
              <span>{getRiskLabel(permission.riskLevel)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          className="flex-1 rounded px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--semantic-success)' }}
        >
          Approve Permissions
        </button>
        <button
          onClick={onReject}
          className="flex-1 rounded px-4 py-2 font-medium transition-colors"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: `1px solid var(--ui-border)`,
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
