/**
 * InfrastructureSelector Component
 * Allows user to select from available infrastructure types (EC2, Lambda, AKS, etc.)
 * with descriptions and icons
 */

import React from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Alert,
  Chip,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import type { InfrastructureType } from '../../../lib/api/relayDeploy';

interface InfrastructureSelectorProps {
  options: InfrastructureType[];
  selected: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string;
}

/**
 * InfrastructureSelector Component
 */
export function InfrastructureSelector({
  options,
  selected,
  onSelect,
  disabled = false,
  isLoading = false,
  error,
}: InfrastructureSelectorProps) {
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} data-testid="loading-skeleton" />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 3, color: 'textSecondary' }}>
        Select the infrastructure type that best fits your deployment needs
      </Typography>

      <Grid container spacing={2}>
        {options.map((type) => (
          <Grid item xs={12} sm={6} md={4} key={type.id}>
            <Card
              component="button"
              onClick={() => onSelect(type.id)}
              disabled={disabled}
              sx={{
                height: '100%',
                position: 'relative',
                border: (theme) =>
                  selected === type.id
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                backgroundColor: (theme) =>
                  selected === type.id
                    ? theme.palette.mode === 'dark'
                      ? theme.palette.primary.dark
                      : theme.palette.primary.lighter
                    : 'transparent',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover:not(:disabled)': {
                  borderColor: (theme) => theme.palette.primary.main,
                  boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}20`,
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
              className={selected === type.id ? 'selected' : ''}
            >
              <CardContent>
                {/* Selected Badge */}
                {selected === type.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <CheckCircle
                      sx={{
                        color: (theme) => theme.palette.primary.main,
                        fontSize: '1.5rem',
                      }}
                    />
                  </Box>
                )}

                {/* Icon */}
                <Typography
                  sx={{
                    fontSize: '2.5rem',
                    mb: 1,
                  }}
                >
                  {type.icon || '☁️'}
                </Typography>

                {/* Label */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {type.label}
                </Typography>

                {/* Description */}
                <Typography
                  variant="body2"
                  sx={{
                    color: 'textSecondary',
                    mb: 2,
                    minHeight: '40px',
                  }}
                >
                  {type.description}
                </Typography>

                {/* Specs */}
                {type.regions && type.regions.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'textSecondary', display: 'block', mb: 0.5 }}>
                      Available regions: {type.regions.length}
                    </Typography>
                  </Box>
                )}

                {type.supported_sizes && type.supported_sizes.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {type.supported_sizes.slice(0, 2).map((size) => (
                      <Chip
                        key={size}
                        label={size}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.7rem',
                        }}
                      />
                    ))}
                    {type.supported_sizes.length > 2 && (
                      <Chip
                        label={`+${type.supported_sizes.length - 2} more`}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.7rem',
                        }}
                      />
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
