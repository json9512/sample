# Deployment Guide

This guide covers deploying the ChatGPT Clone application to various production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Platforms](#deployment-platforms)
4. [Production Checklist](#production-checklist)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services

1. **Supabase Account & Project**
   - Create a new project at [supabase.com](https://supabase.com)
   - Set up Google OAuth provider
   - Create database tables using provided SQL schema

2. **Anthropic Claude API Access**
   - Sign up at [console.anthropic.com](https://console.anthropic.com)
   - Generate an API key with appropriate usage limits

3. **Domain (Optional)**
   - Custom domain for production deployment
   - SSL certificate (usually handled by deployment platform)

### Local Development Setup

```bash
# Clone and install dependencies
git clone <your-repo-url>
cd chatgpt-clone
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your actual values in .env.local

# Run development server
npm run dev
```

## Environment Configuration

### Required Environment Variables

Copy `.env.example` to your deployment platform's environment configuration:

```bash
# Required - Anthropic Claude API
ANTHROPIC_API_KEY=your_claude_api_key_here

# Required - Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required - Authentication
NEXTAUTH_SECRET=your_32_char_minimum_secret
NEXTAUTH_URL=https://your-domain.com

# Production Environment
NODE_ENV=production
```

### Optional Performance Variables

```bash
# Caching Configuration
CACHE_TTL=300000
MAX_CACHE_SIZE=100

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Monitoring
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_DETAILED_LOGGING=false
```

### Security Considerations

- **Never commit** real API keys to version control
- Use different API keys for staging and production
- Rotate keys regularly
- Monitor API usage and costs
- Enable rate limiting in production

## Deployment Platforms

### Vercel (Recommended)

**Advantages:** Excellent Next.js integration, automatic deployments, edge functions

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from command line
vercel

# Or connect GitHub repo in Vercel dashboard
```

**Vercel Configuration:**
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Configure custom domain (optional)
4. Enable automatic deployments on git push

**Environment Variables in Vercel:**
- Go to Project Settings > Environment Variables
- Add all required variables from `.env.example`
- Separate staging and production environments

### Railway

**Advantages:** Database hosting, simple configuration, fair pricing

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Railway Configuration:**
1. Create new project in Railway dashboard
2. Connect GitHub repository
3. Add environment variables
4. Configure custom domain

### Netlify

**Advantages:** Static site optimization, edge functions, form handling

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=.next
```

**Netlify Configuration:**
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Configure environment variables
5. Enable serverless functions

### Digital Ocean App Platform

**Advantages:** Predictable pricing, managed infrastructure

1. Create new App in DO dashboard
2. Connect GitHub repository
3. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
4. Set environment variables
5. Configure domain and SSL

### Heroku

**Advantages:** Mature platform, extensive add-ons

```bash
# Install Heroku CLI
# Create heroku app
heroku create your-app-name

# Set environment variables
heroku config:set ANTHROPIC_API_KEY=your_key
heroku config:set NEXTAUTH_SECRET=your_secret
# ... set all required variables

# Deploy
git push heroku main
```

## Production Checklist

### Before Deployment

- [ ] All environment variables configured
- [ ] Database schema applied to production Supabase
- [ ] Google OAuth configured with production domains
- [ ] API keys are production-ready (not test keys)
- [ ] Build passes locally: `npm run build`
- [ ] Tests pass: `npm run test:ci`
- [ ] Type checking passes: `npm run type-check`
- [ ] ESLint passes: `npm run lint`

### Supabase Production Setup

1. **Create Production Tables**
   ```sql
   -- Run the SQL from database-schema.sql
   -- Set up Row Level Security policies
   -- Create indexes for performance
   ```

2. **Configure OAuth**
   - Add production domains to Google OAuth settings
   - Update Supabase Auth settings with production URLs
   - Test authentication flow

3. **Security Settings**
   - Enable RLS on all tables
   - Configure CORS for your domain only
   - Set up proper API key permissions

### Post-Deployment Verification

- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Authentication flow works end-to-end
- [ ] Message sending and streaming works
- [ ] Conversation persistence works
- [ ] Error handling works properly
- [ ] Performance is acceptable
- [ ] SSL certificate is valid
- [ ] Analytics/monitoring is collecting data

## Monitoring & Maintenance

### Health Monitoring

The application exposes a health check endpoint:

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "claude_api": true
  },
  "system": {
    "environment": "production",
    "platform": "vercel",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Performance Monitoring

Monitor key metrics:
- Response times for API endpoints
- Database query performance
- Claude API response times
- Error rates
- Memory and CPU usage

### Cost Management

**Claude API Costs:**
- Monitor usage in Anthropic console
- Set up billing alerts
- Consider implementing usage limits per user

**Supabase Costs:**
- Monitor database usage
- Optimize queries for performance
- Consider connection pooling for high traffic

### Backup Strategy

- Supabase automatically backs up your data
- Export conversation data periodically for additional safety
- Test restore procedures

## Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Check for missing dependencies
npm install

# Verify environment variables
npm run type-check
```

**Authentication Issues:**
- Verify Google OAuth settings match your domain
- Check NEXTAUTH_URL matches your deployed URL
- Ensure NEXTAUTH_SECRET is set and secure

**Database Connection Issues:**
- Verify Supabase URL and keys are correct
- Check if database tables exist
- Verify RLS policies are not blocking access

**Claude API Issues:**
- Check API key is valid and has sufficient credits
- Monitor rate limits
- Verify API endpoint connectivity

### Debugging Tools

```bash
# Check application health
curl https://your-domain.com/api/health

# View production logs
# (Platform specific - check your deployment platform's logs)

# Test API endpoints
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### Performance Issues

**Slow Loading:**
- Check bundle size with `npm run build`
- Enable compression in Next.js config
- Optimize images and assets
- Consider CDN for static assets

**Database Performance:**
- Add indexes to frequently queried columns
- Optimize conversation and message queries
- Consider pagination for large conversations

**High API Costs:**
- Implement rate limiting per user
- Add message length limits
- Cache responses where appropriate
- Monitor usage patterns

### Getting Help

1. Check application logs first
2. Verify health check endpoint
3. Test each component in isolation
4. Check third-party service status pages
5. Review recent deployments for changes

### Rollback Strategy

**Quick Rollback:**
- Most platforms support instant rollback to previous deployment
- Keep stable version tags in git
- Test rollback process in staging

**Database Rollback:**
- Supabase provides point-in-time recovery
- Test restore process
- Consider feature flags for safer deployments

---

## Platform-Specific Notes

### Vercel Specific

- Serverless functions have execution time limits
- Use Edge Runtime for better performance when possible
- Configure regions close to your users

### Railway Specific

- Supports both containerized and buildpack deployments
- Good for applications needing persistent storage
- Built-in monitoring and logging

### Netlify Specific

- Excellent for static site generation
- Edge functions for dynamic functionality
- Built-in form handling and analytics

Remember to test your deployment thoroughly in a staging environment before going to production!