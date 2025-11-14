import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Alert,
  TextField,
  Chip,
  useTheme,
} from '@mui/material';
import {
  ContentCopy,
  Download,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

interface PayloadViewerProps {
  payload: Record<string, any> | null;
  hash: string;
  searchable?: boolean;
}

export default function PayloadViewer({
  payload,
  hash,
  searchable = true,
}: PayloadViewerProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const redactSensitiveValues = useCallback((obj: any, depth = 0): any => {
    if (depth > 10) return obj; // Prevent infinite recursion

    const sensitivePatterns = [/token|secret|password|key|api_key|auth/i];

    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string' && sensitivePatterns.some((p) => p.test(obj))) {
        return '[REDACTED]';
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => redactSensitiveValues(item, depth + 1));
    }

    const redacted: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitivePatterns.some((p) => p.test(key))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveValues(value, depth + 1);
      }
    }
    return redacted;
  }, []);

  const sanitizedPayload = payload ? redactSensitiveValues(payload) : null;

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(JSON.stringify(sanitizedPayload, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  }, [sanitizedPayload]);

  const handleDownload = useCallback(() => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(sanitizedPayload, null, 2)], {
      type: 'application/json',
    });
    element.href = URL.createObjectURL(file);
    element.download = `payload-${hash}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [sanitizedPayload, hash]);

  const toggleExpandKey = (key: string) => {
    const newSet = new Set(expandedKeys);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedKeys(newSet);
  };

  if (!payload) {
    return (
      <Box p={2}>
        <Alert severity="info">No payload data available</Alert>
      </Box>
    );
  }

  const payloadSize = Object.keys(sanitizedPayload).length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Payload Preview</Typography>
        <Box>
          <Button
            size="small"
            startIcon={<ContentCopy />}
            onClick={handleCopy}
            sx={{ mr: 1 }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            size="small"
            startIcon={<Download />}
            onClick={handleDownload}
          >
            Download
          </Button>
        </Box>
      </Box>

      <Box mb={2} display="flex" gap={1} alignItems="center">
        <Chip label={`Hash: ${hash.substring(0, 16)}...`} size="small" />
        <Chip label={`${payloadSize} fields`} size="small" />
      </Box>

      {payloadSize > 100 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This payload contains {payloadSize} fields. Large payloads may take time to load.
        </Alert>
      )}

      {searchable && (
        <TextField
          placeholder="Search payload..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        />
      )}

      <Paper
        sx={{
          p: 2,
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          maxHeight: 400,
          overflow: 'auto',
        }}
      >
        <PayloadObject
          obj={sanitizedPayload}
          searchQuery={searchQuery}
          expandedKeys={expandedKeys}
          onToggleExpand={toggleExpandKey}
        />
      </Paper>
    </Box>
  );
}

interface PayloadObjectProps {
  obj: any;
  searchQuery: string;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
  depth?: number;
}

function PayloadObject({
  obj,
  searchQuery,
  expandedKeys,
  onToggleExpand,
  depth = 0,
}: PayloadObjectProps) {
  if (typeof obj !== 'object' || obj === null) {
    const valueStr = String(obj);
    const isHighlighted =
      searchQuery && valueStr.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      <span className={isHighlighted ? 'highlighted' : ''}>
        {typeof obj === 'string' ? `"${valueStr}"` : valueStr}
      </span>
    );
  }

  if (Array.isArray(obj)) {
    return (
      <span>
        [
        {obj.map((item, idx) => (
          <div key={idx} style={{ marginLeft: `${(depth + 1) * 16}px` }}>
            <PayloadObject
              obj={item}
              searchQuery={searchQuery}
              expandedKeys={expandedKeys}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
            />
            {idx < obj.length - 1 && ','}
          </div>
        ))}
        ]
      </span>
    );
  }

  return (
    <div>
      {'{'}
      {Object.entries(obj).map(([key, value]) => {
        const isExpanded = expandedKeys.has(key);
        const isComplex = typeof value === 'object' && value !== null;

        return (
          <div key={key} style={{ marginLeft: `${(depth + 1) * 16}px` }}>
            <span
              onClick={() => isComplex && onToggleExpand(key)}
              style={{ cursor: isComplex ? 'pointer' : 'default' }}
            >
              {isComplex &&
                (isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
              <strong>{key}</strong>: {isExpanded ? '' : '...'}
            </span>
            {isExpanded && (
              <div style={{ marginLeft: 16 }}>
                <PayloadObject
                  obj={value}
                  searchQuery={searchQuery}
                  expandedKeys={expandedKeys}
                  onToggleExpand={onToggleExpand}
                  depth={depth + 1}
                />
              </div>
            )}
            {!isExpanded && !isComplex && (
              <span>
                <PayloadObject
                  obj={value}
                  searchQuery={searchQuery}
                  expandedKeys={expandedKeys}
                  onToggleExpand={onToggleExpand}
                  depth={depth}
                />
              </span>
            )}
          </div>
        );
      })}
      {'}'}
    </div>
  );
}
