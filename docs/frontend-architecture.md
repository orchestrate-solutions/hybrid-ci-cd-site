# Frontend Architecture: JAMstack

## Static Frontend (JAMstack Architecture)

The dashboard is a pre-built static site deployed globally via CDN, powered by a configuration-as-code workflow. Adding a new service is a simple pull request to a YAML file[5][6][7][8].

## Implementation Details

### Frontend Layer

- **Framework**: Next.js with Static Site Generation (SSG)
- **Hosting**: GitHub Pages / Cloudflare Pages / Vercel

### Configuration Layer

- **Format**: YAML/JSON schemas with validation
- **Storage**: Git repository as single source of truth

### Key Benefits

- **GitOps Workflow**: All configuration changes are managed through pull requests, providing a complete audit trail and instant rollback capabilities[6][12].
- **Global Distribution**: Static assets served via CDN for optimal performance
- **Version Control**: Complete history of all configuration changes

## Citations

[5] Building a Website with Jamstack - DEV Community https://dev.to/farrosfr/building-a-website-with-jamstack-5bc0

[6] How JAMstack Powers Modern Fullstack Web Development https://talent500.com/blog/jamstack-modern-fullstack-development/

[7] Mastering Config-Driven UI: A Beginner's Guide to Flexible and ... https://dev.to/lovishduggal/mastering-config-driven-ui-a-beginners-guide-to-flexible-and-scalable-interfaces-3l91

[8] Catalog Configuration | Backstage Software Catalog and Developer ... https://backstage.io/docs/features/software-catalog/configuration/

[12] JAMstack Workflow: From Markdown to Deployment - Software House https://softwarehouse.au/blog/jamstack-workflow-from-markdown-to-deployment/
