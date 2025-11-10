'use client';

import Link from 'next/link';
import { Box, Container, Typography, Button, Grid, Card, CardContent, CardActions } from '@mui/material';
import { ArrowRight, BarChart3, Zap, Shield, Users } from 'lucide-react';

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) => 
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
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
            theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
              Hybrid CI/CD
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Link href="/docs/overview" style={{ textDecoration: 'none' }}>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                >
                  Docs
                </Typography>
              </Link>
              <Link href="/docs/solution-architecture" style={{ textDecoration: 'none' }}>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                >
                  Architecture
                </Typography>
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 6, md: 12 } }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 12 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 'bold',
              mb: 3,
              fontSize: { xs: '2rem', md: '3.5rem' },
              color: 'text.primary',
            }}
          >
            Enterprise CI/CD Platform
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              mb: 4,
              fontSize: { xs: '1rem', md: '1.25rem' },
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Federated DevOps orchestration with multi-region agent support, configuration-driven tool integrations,
            and community-extensible plugins.
          </Typography>

          {/* CTA Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowRight size={20} />}
              href="/dashboard"
              component={Link}
              sx={{ py: 1.5, px: 4 }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/docs/overview"
              component={Link}
              sx={{ py: 1.5, px: 4 }}
            >
              Learn More
            </Button>
          </Box>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={3} sx={{ mb: 12 }}>
          {[
            {
              title: 'Job Management',
              description: 'Queue, prioritize, and execute jobs with atomic operations and state machines.',
              icon: BarChart3,
              href: '/dashboard/jobs',
            },
            {
              title: 'Agent Orchestration',
              description: 'Multi-region agent pools with health monitoring and distributed execution.',
              icon: Users,
              href: '/dashboard/agents',
            },
            {
              title: 'Deployment Lifecycle',
              description: 'Track deployments with rollback support and real-time status updates.',
              icon: Zap,
              href: '/dashboard/deployments',
            },
            {
              title: 'Metrics & Insights',
              description: 'Real-time dashboards with performance analytics and health monitoring.',
              icon: BarChart3,
              href: '/dashboard',
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <Grid item xs={12} sm={6} md={6} key={feature.title}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 8px 24px rgba(66, 165, 245, 0.2)'
                          : '0 8px 24px rgba(25, 118, 210, 0.2)',
                    },
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Icon size={24} />
                      <Box />
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Link href={feature.href} style={{ textDecoration: 'none' }}>
                      <Button size="small" color="primary">
                        Learn more →
                      </Button>
                    </Link>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Capabilities Section */}
        <Card
          sx={{
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(102, 51, 153, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(102, 51, 153, 0.1) 100%)',
            mb: 8,
            border: 1,
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(66, 165, 245, 0.2)' : 'rgba(66, 165, 245, 0.3)',
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}>
              Platform Capabilities
            </Typography>
            <Grid container spacing={4}>
              {[
                {
                  title: 'Configuration-Driven',
                  description: 'Tool integrations defined via JSON configs. Add new tools without code changes.',
                  icon: Zap,
                },
                {
                  title: 'Type-Safe',
                  description: 'Python 3.11+ backend, TypeScript 5 frontend. Zero runtime type surprises.',
                  icon: Shield,
                },
                {
                  title: 'Community-Extensible',
                  description: 'Plugin system for custom integrations. Federated architecture scales globally.',
                  icon: Users,
                },
              ].map((capability) => {
                const Icon = capability.icon;
                return (
                  <Grid item xs={12} md={4} key={capability.title}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Icon size={24} style={{ minWidth: 24, marginTop: 4 }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          {capability.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {capability.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>

        {/* Documentation Section */}
        <Box>
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}>
            Documentation
          </Typography>
          <Grid container spacing={2}>
            {[
              { title: 'Architecture', desc: 'Learn about our system design', href: '/docs/solution-architecture' },
              { title: 'Tech Stack', desc: 'Explore the tech we use', href: '/docs/technology-stack' },
              { title: 'Features', desc: 'Discover capabilities', href: '/docs/features-benefits' },
              { title: 'Security', desc: 'Authentication and access control', href: '/docs/authentication' },
            ].map((doc) => (
              <Grid item xs={12} sm={6} md={6} key={doc.title}>
                <Link href={doc.href} style={{ textDecoration: 'none' }}>
                  <Card
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {doc.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {doc.desc}
                    </Typography>
                  </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
