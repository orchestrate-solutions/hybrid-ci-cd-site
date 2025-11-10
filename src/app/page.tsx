'use client';

import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowRight,
  Code2,
  Share2,
  Shield,
  Zap,
  Network,
  GitBranch,
  Users,
  Rocket,
  Lock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 50%, #c3cfe2 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Navigation Header */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(0, 0, 0, 0.6)'
              : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 2,
              px: { xs: 2, sm: 3 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                }}
              >
                ⚙️
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
                Hybrid CI/CD
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: { xs: 1, md: 3 }, alignItems: 'center' }}>
              {!isMobile && (
                <>
                  <Link href="/docs/overview" style={{ textDecoration: 'none' }}>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.95rem',
                        '&:hover': { color: 'primary.main' },
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                      }}
                    >
                      Vision
                    </Typography>
                  </Link>
                  <Link href="/docs/solution-architecture" style={{ textDecoration: 'none' }}>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.95rem',
                        '&:hover': { color: 'primary.main' },
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                      }}
                    >
                      Docs
                    </Typography>
                  </Link>
                </>
              )}
              <ThemeSwitcher />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 6, md: 10 }, px: { xs: 2, sm: 3 } }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: { xs: 10, md: 14 } }}>
          <Stack spacing={3} alignItems="center">
            {/* Badge */}
            <Chip
              label="🚀 Federated DevOps Protocol"
              sx={{
                height: 'auto',
                py: 1.5,
                px: 2,
                fontSize: '0.95rem',
                fontWeight: 500,
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(76, 175, 80, 0.1)'
                    : 'rgba(76, 175, 80, 0.1)',
                color: (theme) => theme.palette.primary.main,
                border: (theme) => `1px solid ${theme.palette.primary.light}`,
              }}
            />

            {/* Main Headline */}
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.8rem' },
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}
            >
              You Build It.<br />You Own It.
            </Typography>

            {/* Subheading - The Vision */}
            <Typography
              variant="h5"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '1rem', md: '1.3rem' },
                maxWidth: '650px',
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              Not a product. A <strong>protocol</strong> for community-owned DevOps configurations, 
              plugins, and integrations. Zero vendor lock-in. Everything federated through GitHub.
            </Typography>

            {/* CTA Button */}
            <Button
              variant="contained"
              color="primary"
              size="large"
              href="/dashboard"
              sx={{
                mt: 4,
                px: 5,
                py: 1.8,
                fontSize: '1.05rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: (theme) => `0 12px 24px ${theme.palette.primary.main}40`,
                },
                transition: 'all 0.3s ease',
              }}
              endIcon={<ArrowRight size={20} />}
            >
              Explore Platform
            </Button>
          </Stack>
        </Box>

        {/* Three Pillars: Vision */}
        <Box sx={{ mb: { xs: 10, md: 14 } }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              mb: 6,
              fontWeight: 700,
              fontSize: { xs: '1.8rem', md: '2.5rem' },
            }}
          >
            The Three Pillars
          </Typography>

          <Grid container spacing={3}>
            {/* Pillar 1: Own */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid',
                  borderColor: 'divider',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'primary.main',
                    boxShadow: (theme) =>
                      `0 8px 24px ${theme.palette.primary.main}20`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      color: 'primary.main',
                    }}
                  >
                    <Code2 size={24} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Build & Own
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Create tool configs, schemas, IaC templates in your GitHub repos. 
                    You control the code. You own the work. Forever.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Pillar 2: Share */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid',
                  borderColor: 'divider',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'primary.main',
                    boxShadow: (theme) =>
                      `0 8px 24px ${theme.palette.primary.main}20`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      color: 'primary.main',
                    }}
                  >
                    <Share2 size={24} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Share & Collaborate
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Publish to marketplace (public) or keep private (personal). Fork, 
                    improve, contribute back. Community thrives through shared patterns.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Pillar 3: Earn */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid',
                  borderColor: 'divider',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'primary.main',
                    boxShadow: (theme) =>
                      `0 8px 24px ${theme.palette.primary.main}20`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      color: 'primary.main',
                    }}
                  >
                    <Rocket size={24} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Earn Recognition
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Build reputation through GitHub stars, contribution badges, impact metrics. 
                    Your work becomes your portfolio. Career growth through community.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Key Features */}
        <Box sx={{ mb: { xs: 10, md: 14 } }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              mb: 6,
              fontWeight: 700,
              fontSize: { xs: '1.8rem', md: '2.5rem' },
            }}
          >
            Built for Community
          </Typography>

          <Grid container spacing={3}>
            {[
              {
                icon: GitBranch,
                title: 'Federated by Design',
                description: 'Configs live in your GitHub repos. We index and connect. You maintain control.',
              },
              {
                icon: Lock,
                title: 'Zero Vendor Lock-In',
                description: 'Export anytime. Use configs anywhere. No proprietary formats. Pure YAML/JSON.',
              },
              {
                icon: Layers,
                title: 'Infinitely Extensible',
                description: 'Build custom plugins, schemas, and automations. Community contributors define the future.',
              },
              {
                icon: Network,
                title: 'Protocol-Based',
                description: 'Config-driven integrations work with any CI/CD tool, cloud provider, or DevOps platform.',
              },
              {
                icon: Shield,
                title: 'Permissions-First',
                description: 'Plugins declare permissions upfront. Users approve. Sandboxed execution. Full audit trail.',
              },
              {
                icon: Users,
                title: 'Community Owned',
                description: 'No gatekeepers. Governance via RFCs. Meritocracy. Your contributions shape the platform.',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box sx={{ p: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '10px',
                        background: (theme) =>
                          `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        color: 'primary.main',
                      }}
                    >
                      <Icon size={22} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* What You Can Build */}
        <Box sx={{ mb: { xs: 10, md: 14 } }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              mb: 3,
              fontWeight: 700,
              fontSize: { xs: '1.8rem', md: '2.5rem' },
            }}
          >
            What You Can Build
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: 'center', mb: 6, maxWidth: '700px', mx: 'auto' }}
          >
            The platform doesn't limit what you create. Configs, schemas, plugins, LLM integrations, 
            IaC templates—anything that solves DevOps problems.
          </Typography>

          <Grid container spacing={2}>
            {[
              { icon: Zap, label: 'CI/CD Integrations' },
              { icon: Cloud, label: 'Cloud Provider Configs' },
              { icon: FileCode, label: 'IaC Templates' },
              { icon: Brain, label: 'LLM Integrations' },
              { icon: Settings, label: 'Custom Schemas' },
              { icon: Gauge, label: 'Monitoring Stacks' },
            ].map((item, index) => {
              const Icon = item.icon === Zap ? Zap : item.icon === 'Cloud' ? Network : item.icon === 'FileCode' ? Code2 : item.icon === 'Brain' ? Users : item.icon === 'Settings' ? Shield : Layers;
              return (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    sx={{
                      p: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '8px',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.7)',
                      },
                    }}
                  >
                    <Box sx={{ color: 'primary.main' }}>
                      <Icon size={24} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {item.label}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Final CTA */}
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            borderRadius: '16px',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(33, 150, 243, 0.05))'
                : 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(33, 150, 243, 0.1))',
            border: '1px solid',
            borderColor: 'primary.light',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            Ready to Build?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
            Explore the platform, connect your GitHub repos, and start building configs that solve real problems. 
            Your contributions shape the future of DevOps.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            href="/dashboard"
            sx={{
              px: 5,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
            }}
            endIcon={<ArrowRight size={20} />}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(0, 0, 0, 0.3)'
              : 'rgba(255, 255, 255, 0.5)',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              © 2025 Hybrid CI/CD. Community-owned protocol. <strong>Not a product.</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link href="/docs/overview" style={{ textDecoration: 'none' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                  Vision
                </Typography>
              </Link>
              <Link href="https://github.com/orchestrate-solutions/hybrid-ci-cd-site" target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                  GitHub
                </Typography>
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

