'use client';

import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import SecurityGuaranteeCard from '@/components/dashboard/SecurityGuaranteeCard';
import { useArchitecture } from '@/lib/hooks/useArchitecture';

export default function ArchitecturePage() {
  const {
    securityGuarantees,
    riskComparison,
    architectureFlow,
    netZeroModel,
    dataFlow,
    loading,
    error,
  } = useArchitecture();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorOutline />}>
          {error.message}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          NET ZERO Architecture
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Zero-trust security model where provider has ZERO access to secrets
        </Typography>
      </Box>

      {/* NET ZERO Model Overview */}
      {netZeroModel && (
        <Card sx={{ mb: 4, bgcolor: 'primary.light', color: 'primary.main' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Key Principle
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {netZeroModel.keyPrinciple}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {netZeroModel.benefits.map((benefit, idx) => (
                <Chip
                  key={`benefit-${idx}`}
                  label={benefit}
                  size="small"
                  sx={{ bgcolor: 'primary.main', color: 'white' }}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Security Guarantees */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          Security Guarantees
        </Typography>
        <Grid container spacing={2}>
          {securityGuarantees.length > 0 ? (
            securityGuarantees.map((guarantee) => (
              <Grid item xs={12} sm={6} md={4} key={guarantee.title}>
                <SecurityGuaranteeCard guarantee={guarantee} />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography color="textSecondary">
                No security guarantees loaded
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Architecture Flow */}
      {architectureFlow.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            Architecture Flow
          </Typography>
          <Grid container spacing={2}>
            {architectureFlow.map((section) => (
              <Grid item xs={12} sm={6} md={4} key={section.title}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {section.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {section.components.map((component) => (
                        <Chip
                          key={`${section.title}-${component}`}
                          label={component}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
                      {section.details}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Data Flow Stages */}
      {dataFlow && dataFlow.stages.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            Data Flow Pipeline
          </Typography>
          <Stack spacing={2}>
            {dataFlow.stages.map((stage, idx) => (
              <Card key={`stage-${idx}`}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`${idx + 1}`}
                      color={stage.dataVisible ? 'error' : 'success'}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">{stage.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {stage.description}
                      </Typography>
                    </Box>
                    <Chip
                      label={stage.dataVisible ? 'Data Visible' : 'Data Hidden'}
                      color={stage.dataVisible ? 'error' : 'success'}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* Risk Comparison Table */}
      {riskComparison.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            Risk Comparison
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Risk Factor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>GitHub Actions</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Jenkins (Self-Hosted)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Old Model</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>NET ZERO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riskComparison.map((row, idx) => (
                  <TableRow key={`comparison-${idx}`}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {row.riskFactor}
                    </TableCell>
                    <TableCell>{row.githubActions}</TableCell>
                    <TableCell>{row.jenkinsHosted}</TableCell>
                    <TableCell sx={{ color: 'error.main' }}>
                      {row.oldModel}
                    </TableCell>
                    <TableCell sx={{ color: 'success.main' }}>
                      {row.netZero}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Container>
  );
}
