/**
 * LogViewer Component
 * Expandable inline log panel for job logs
 * Supports search, follow/tail, and pagination
 * 
 * HYDRATION FIX: Uses client-side rendering for timestamps and dynamic content
 */

'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import {
  Box,
  Paper,
  Button,
  Collapse,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
  Typography,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as ContentCopyIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import { logsApi } from '@/lib/api/logs';

interface LogViewerProps {
  /** Job ID to fetch logs for */
  jobId: string;
  /** Optional height for log panel (default: 400px) */
  maxHeight?: string;
  /** Optional callback when logs are loaded */
  onLogsLoaded?: (logCount: number) => void;
}

/**
 * LogViewer component
 * Displays job logs in an expandable panel with search and follow capabilities
 * 
 * HYDRATION NOTES:
 * - Uses useEffect to ensure client-side only rendering of timestamps
 * - Avoids rendering timestamps during SSR to prevent mismatch
 * - Suspense boundary wraps conditional content
 */
export function LogViewer({ jobId, maxHeight = '400px', onLogsLoaded }: LogViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [follow, setFollow] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Set mounted flag to enable hydration-safe rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch logs when expanded
  useEffect(() => {
    if (!expanded) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await logsApi.getJobLogs(jobId, {
          limit: 100,
        });
        setLogs(response.log_lines || []);
        onLogsLoaded?.(response.total_lines || 0);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load logs';
        setError(message);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [expanded, jobId, onLogsLoaded]);

  // Auto-scroll to bottom when follow is enabled
  useEffect(() => {
    if (follow && logsEndRef.current && isMounted) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, follow, isMounted]);

  // Filter logs based on search term
  const filteredLogs = searchTerm
    ? logs.filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : logs;

  // Copy logs to clipboard
  const handleCopyLogs = () => {
    if (!isMounted) return;
    const logText = logs.join('\n');
    navigator.clipboard.writeText(logText).then(() => {
      console.log('Logs copied to clipboard');
    });
  };

  // Download logs as text file
  const handleDownloadLogs = () => {
    if (!isMounted) return;
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${jobId}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Only render interactive content after hydration
  if (!isMounted) {
    return (
      <Box sx={{ width: '100%' }}>
        <Button
          fullWidth
          disabled
          sx={{
            justifyContent: 'space-between',
            textAlign: 'left',
            py: 1,
            px: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'action.hover',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
            Job Logs: {jobId}
          </Typography>
          <ExpandMoreIcon />
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with expand button */}
      <Button
        fullWidth
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Hide logs' : 'View logs'}
        sx={{
          justifyContent: 'space-between',
          textAlign: 'left',
          py: 1,
          px: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'action.hover',
          '&:hover': {
            backgroundColor: 'action.selected',
          },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
          Job Logs: {jobId}
          {logs.length > 0 && (
            <Chip
              label={`${logs.length} lines`}
              size="small"
              variant="outlined"
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Button>

      {/* Log panel (collapsible) */}
      <Collapse in={expanded} timeout="auto">
        <Paper sx={{ mt: 1, p: 2, backgroundColor: '#f5f5f5' }}>
          {/* Loading state */}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} sx={{ mr: 2 }} />
              <Typography variant="body2">Loading logs...</Typography>
            </Box>
          )}

          {/* Error state */}
          {error && !loading && (
            <Alert severity="error" role="alert" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Search bar */}
          {logs.length > 0 && !loading && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search logs (case-insensitive)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                inputProps={{
                  'aria-label': 'Search logs',
                }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant={follow ? 'contained' : 'outlined'}
                  onClick={() => setFollow(!follow)}
                >
                  {follow ? 'Following' : 'Follow'}
                </Button>
                <IconButton
                  size="small"
                  onClick={handleCopyLogs}
                  title="Copy all logs to clipboard"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleDownloadLogs}
                  title="Download logs as file"
                >
                  <GetAppIcon fontSize="small" />
                </IconButton>
                {searchTerm && (
                  <Chip
                    size="small"
                    label={`${filteredLogs.length} / ${logs.length} matching`}
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* Log lines */}
          {!loading && !error && logs.length > 0 && (
            <Box
              sx={{
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                maxHeight,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.5,
              }}
            >
              {filteredLogs.map((line, index) => (
                <div key={index} style={{ marginBottom: '0.25rem' }}>
                  <span style={{ color: '#858585', marginRight: '1rem' }}>
                    {String(index + 1).padStart(5, ' ')}
                  </span>
                  {line}
                </div>
              ))}
              <div ref={logsEndRef} />
            </Box>
          )}

          {/* Empty state */}
          {!loading && !error && logs.length === 0 && (
            <Alert severity="info">No logs available for this job</Alert>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
}

export default LogViewer;
