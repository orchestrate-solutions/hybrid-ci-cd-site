/**
 * ComingSoonCard Component
 * 
 * Placeholder for future features (AI Evaluations, Advanced Approvals, etc.)
 * Signals platform extensibility and manages user expectations
 */

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

interface ComingSoonCardProps {
  title: string;
  description: string;
  version?: string; // e.g., "v2", "Q1 2026"
  testId?: string;
}

export function ComingSoonCard({
  title,
  description,
  version = 'Coming Soon',
  testId,
}: ComingSoonCardProps) {
  return (
    <Box
      data-testid={testId}
      sx={{
        p: 3,
        borderRadius: 1.5,
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        textAlign: 'center',
        opacity: 0.6,
      }}
    >
      {/* Icon */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
        <LockIcon sx={{ fontSize: '2.5rem', color: 'text.secondary' }} />
      </Box>

      {/* Title */}
      <Typography
        variant="h6"
        component="h3"
        sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}
      >
        {title}
      </Typography>

      {/* Version */}
      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
        {version}
      </Typography>

      {/* Description */}
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2, lineHeight: 1.6 }}>
        {description}
      </Typography>

      {/* CTA */}
      <Button
        variant="outlined"
        size="small"
        disabled
        sx={{ textTransform: 'none' }}
      >
        Notify Me
      </Button>
    </Box>
  );
}
