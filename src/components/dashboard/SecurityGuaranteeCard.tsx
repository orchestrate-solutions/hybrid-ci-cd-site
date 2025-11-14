'use client';

import {
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  Box,
  CheckCircle,
  ErrorOutline,
} from '@mui/material';
import { SecurityGuaranteeDetail } from '@/lib/api/architecture';

interface SecurityGuaranteeCardProps {
  guarantee: SecurityGuaranteeDetail;
}

export default function SecurityGuaranteeCard({
  guarantee,
}: SecurityGuaranteeCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 1,
        '&:hover': { boxShadow: 3 },
        transition: 'box-shadow 0.3s',
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        <Stack spacing={2}>
          {/* Header with Title and Status */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            <Typography variant="h6" sx={{ flex: 1 }}>
              {guarantee.title}
            </Typography>
            <Chip
              icon={guarantee.verified ? <CheckCircle /> : <ErrorOutline />}
              label={guarantee.verified ? 'Verified' : 'Unverified'}
              color={guarantee.verified ? 'success' : 'warning'}
              size="small"
              sx={{ flexShrink: 0 }}
            />
          </Box>

          {/* Description */}
          <Typography variant="body2" color="textSecondary">
            {guarantee.description}
          </Typography>

          {/* Implementation Details */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'action.hover',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="textSecondary">
              Implementation
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {guarantee.implementation}
            </Typography>
          </Box>

          {/* Test Cases */}
          <Box>
            <Typography variant="caption" color="textSecondary">
              {guarantee.testCases.length} test case{guarantee.testCases.length !== 1 ? 's' : ''}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {guarantee.testCases.slice(0, 3).map((test, idx) => (
                <Chip
                  key={`${test}-${idx}`}
                  label={test}
                  size="small"
                  variant="outlined"
                />
              ))}
              {guarantee.testCases.length > 3 && (
                <Chip label={`+${guarantee.testCases.length - 3}`} size="small" />
              )}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
