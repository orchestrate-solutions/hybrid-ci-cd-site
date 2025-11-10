import React from 'react';
import { Lock, Network, Database, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export type IsolationLevel = 'strict' | 'standard' | 'moderate';
export type SandboxStatus = 'active' | 'inactive';

export interface Sandbox {
  id: string;
  name: string;
  isolationLevel: IsolationLevel;
  resources: {
    cpuLimit: string;
    memoryLimit: string;
    diskLimit: string;
  };
  networkAccess: {
    enabled: boolean;
    allowedDomains: string[];
    blockedPorts: string[];
  };
  fileSystemAccess: {
    readPaths: string[];
    writePaths: string[];
    restrictedPaths: string[];
  };
  status: SandboxStatus;
}

interface SandboxPreviewProps {
  sandbox: Sandbox;
}

function getIsolationColor(level: IsolationLevel): string {
  switch (level) {
    case 'strict':
      return 'var(--semantic-success)';
    case 'standard':
      return 'var(--semantic-info)';
    case 'moderate':
      return 'var(--semantic-warning)';
  }
}

function getStatusIcon(status: SandboxStatus) {
  return status === 'active' ? (
    <CheckCircle2 size={16} style={{ color: 'var(--semantic-success)' }} />
  ) : (
    <XCircle size={16} style={{ color: 'var(--semantic-error)' }} />
  );
}

export function SandboxPreview({ sandbox }: SandboxPreviewProps) {
  return (
    <div
      className="space-y-4 rounded-lg border p-6"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--ui-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {sandbox.name}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ID: {sandbox.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(sandbox.status)}
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {sandbox.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Isolation badge */}
      <div className="flex items-center gap-2">
        <Lock size={16} style={{ color: getIsolationColor(sandbox.isolationLevel) }} />
        <div
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: `${getIsolationColor(sandbox.isolationLevel)}20`,
            color: getIsolationColor(sandbox.isolationLevel),
          }}
        >
          {sandbox.isolationLevel.charAt(0).toUpperCase() + sandbox.isolationLevel.slice(1)} Isolation
        </div>
      </div>

      {/* Resources */}
      <div>
        <h4 className="mb-2 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          Resources
        </h4>
        <div
          className="grid grid-cols-3 gap-3 rounded border p-3"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--ui-border)',
          }}
        >
          <div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              CPU
            </p>
            <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
              {sandbox.resources.cpuLimit}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Memory
            </p>
            <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
              {sandbox.resources.memoryLimit}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Disk
            </p>
            <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
              {sandbox.resources.diskLimit}
            </p>
          </div>
        </div>
      </div>

      {/* Network Access */}
      <div>
        <h4 className="mb-2 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          Network Access
        </h4>
        <div
          className="rounded border p-3 space-y-3"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--ui-border)',
          }}
        >
          <div className="flex items-center gap-2">
            <Network size={14} style={{ color: sandbox.networkAccess.enabled ? 'var(--semantic-success)' : 'var(--semantic-error)' }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {sandbox.networkAccess.enabled ? 'Network access enabled' : 'Network access disabled'}
            </span>
          </div>

          {sandbox.networkAccess.enabled && (
            <>
              {/* Allowed domains */}
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Allowed Domains:
                </p>
                {sandbox.networkAccess.allowedDomains.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {sandbox.networkAccess.allowedDomains.map(domain => (
                      <span
                        key={domain}
                        className="rounded bg-opacity-20 px-2 py-1 text-xs font-mono"
                        style={{
                          backgroundColor: `${getIsolationColor('standard')}20`,
                          color: getIsolationColor('standard'),
                        }}
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    No domains allowed
                  </p>
                )}
              </div>

              {/* Blocked ports */}
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Blocked Ports:
                </p>
                {sandbox.networkAccess.blockedPorts.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {sandbox.networkAccess.blockedPorts.map(port => (
                      <span
                        key={port}
                        className="rounded bg-opacity-20 px-2 py-1 text-xs font-mono"
                        style={{
                          backgroundColor: `var(--semantic-error)20`,
                          color: 'var(--semantic-error)',
                        }}
                      >
                        {port}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    No ports blocked
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* File System Access */}
      <div>
        <h4 className="mb-2 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          File System Access
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {/* Read */}
          <div
            className="rounded border p-3"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--ui-border)',
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--semantic-info)' }}>
              Read Paths
            </p>
            <div className="space-y-1">
              {sandbox.fileSystemAccess.readPaths.map(path => (
                <p key={path} className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {path}
                </p>
              ))}
            </div>
          </div>

          {/* Write */}
          <div
            className="rounded border p-3"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--ui-border)',
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--semantic-success)' }}>
              Write Paths
            </p>
            <div className="space-y-1">
              {sandbox.fileSystemAccess.writePaths.map(path => (
                <p key={path} className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {path}
                </p>
              ))}
            </div>
          </div>

          {/* Restricted */}
          <div
            className="rounded border p-3"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--ui-border)',
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--semantic-error)' }}>
              Blocked Paths
            </p>
            <div className="space-y-1">
              {sandbox.fileSystemAccess.restrictedPaths.map(path => (
                <p key={path} className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {path}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
