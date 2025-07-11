# IDE Web Application - Production Deployment Guide

## Overview

This guide covers deploying a production-ready IDE for Codeunia.com with real code execution capabilities using Judge0 CE. This is NOT a demo - it's a complete production system.

## Production Architecture

```
Users → Vercel (Frontend/API) → Judge0 CE Server → Real Code Execution
                ↓
        Supabase Database (Results, Users, Contests)
```

## Required Infrastructure

### ✅ What You Need for Production

1. **Vercel Account** - Frontend hosting and API routes
2. **VPS/Cloud Server** - For Judge0 CE (minimum 2GB RAM, 2 CPUs)
3. **Supabase Database** - For storing contests, submissions, users
4. **Domain** - For your Codeunia.com platform
5. **SSL Certificate** - Automatic with Vercel
6. **Monitoring** - For uptime and performance tracking

## Production Setup Steps

### 1. Deploy Judge0 CE Server

#### Option A: Self-Hosted VPS (Recommended for cost)

```bash
# On your VPS (Ubuntu 20.04+)
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Deploy Judge0 CE
docker run -d \
  --name judge0-server \
  --restart always \
  -p 2358:2358 \
  --privileged \
  -e REDIS_HOST=judge0-redis \
  -e POSTGRES_HOST=judge0-postgres \
  judge0/judge0:1.13.0

# Deploy Redis
docker run -d \
  --name judge0-redis \
  --restart always \
  redis:6.0-alpine

# Deploy PostgreSQL
docker run -d \
  --name judge0-postgres \
  --restart always \
  -e POSTGRES_PASSWORD=judge0 \
  -e POSTGRES_USER=judge0 \
  -e POSTGRES_DB=judge0 \
  postgres:13-alpine
```

#### Option B: Judge0 API (RapidAPI) - Easier but more expensive

1. Sign up at [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0-ce)
2. Get your API key
3. Use `https://judge0-ce.p.rapidapi.com` as base URL

### 2. Update Code for Production

### 2. Update Code for Production

Replace the demo Judge0 implementation with real production code:

```bash
# Backup current demo file
mv app/api/judge0/submissions/route.ts app/api/judge0/submissions/route-demo.ts

# Use production version
mv app/api/judge0/submissions/route-production.ts app/api/judge0/submissions/route.ts
```

### 3. Environment Variables

Set these in your Vercel dashboard:

```env
# Database (Required)
DATABASE_URL="postgresql://username:password@host:port/database"

# Judge0 Configuration (Choose one option)

# Option A: Self-hosted Judge0
JUDGE0_URL="http://your-vps-ip:2358"
USE_RAPIDAPI="false"

# Option B: RapidAPI Judge0
JUDGE0_URL="https://judge0-ce.p.rapidapi.com"
RAPIDAPI_KEY="your_rapidapi_key_here"
USE_RAPIDAPI="true"

# Authentication (Required for user management)
NEXTAUTH_SECRET="your_super_secret_key_here"
NEXTAUTH_URL="https://codeunia.com"

# Optional: Monitoring and analytics
SENTRY_DSN="your_sentry_dsn"
ANALYTICS_ID="your_analytics_id"
```

### 4. Security Configuration

Create security middleware for production:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Rate limiting for submissions
  if (request.nextUrl.pathname.startsWith('/api/judge0/submissions')) {
    // Implement rate limiting logic
    const ip = request.ip || 'unknown';
    // Check rate limits per IP
  }
  
  // Security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}
```

## Production Deployment Process

### 1. Prepare for Deployment

```bash
# Install dependencies
npm install

# Run tests (if you have them)
npm test

# Build and verify
npm run build
npm start

# Test Judge0 connection
curl http://localhost:3000/api/judge0/about
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add JUDGE0_URL
vercel env add DATABASE_URL
# ... add all other env vars
```

#### Option B: GitHub Integration
```bash
# Push to GitHub
git add .
git commit -m "Production ready deployment"
git push origin main

# Connect repository in Vercel dashboard
# Set environment variables in dashboard
# Deploy automatically on push
```

### 3. Configure Custom Domain

In Vercel dashboard:
1. Go to Project Settings → Domains
2. Add `codeunia.com` and `www.codeunia.com`
3. Update DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

### 4. Database Setup

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Seed database with initial data
npx prisma db seed
```

## Production Features

### ✅ Real Code Execution
- **Languages**: C, C++, Java, JavaScript, Python, Ruby, Rust, Kotlin, Perl, Go
- **Time Limits**: 1-10 seconds per execution
- **Memory Limits**: 64MB-512MB configurable
- **Security**: Sandboxed execution environment

### ✅ Contest System
- **Real-time Contests**: Live leaderboards and rankings
- **Test Case Validation**: Actual input/output verification
- **Plagiarism Detection**: Code similarity analysis
- **Performance Metrics**: Real execution time and memory usage

### ✅ User Management
- **Authentication**: Secure user registration and login
- **Profiles**: User statistics and submission history
- **Roles**: Admin, contest creators, participants
- **Teams**: Multi-user team support

### ✅ Admin Features
- **Contest Management**: Create, edit, schedule contests
- **Problem Creation**: Add problems with test cases
- **User Management**: Moderate users and submissions
- **Analytics**: Platform usage and performance stats

## Monitoring and Maintenance

### 1. Uptime Monitoring

```bash
# Set up monitoring for:
# - Main application (codeunia.com)
# - Judge0 server health
# - Database connectivity
# - API response times
```

### 2. Error Tracking

```bash
# Install Sentry for error tracking
npm install @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
```

### 3. Performance Optimization

```bash
# Enable caching for static content
# Optimize images and assets
# Use CDN for global distribution
# Database query optimization
```

## Scaling Considerations

### Traffic Expectations for Codeunia.com

| Metric | Small Scale | Medium Scale | Large Scale |
|--------|-------------|--------------|-------------|
| **Concurrent Users** | 10-100 | 100-1000 | 1000+ |
| **Executions/Day** | 1K-10K | 10K-100K | 100K+ |
| **Response Time** | <2s | <3s | <3s |
| **Uptime** | 99% | 99.5% | 99.9% |

### Infrastructure Scaling

#### Small Scale ($50-100/month)
- Single Judge0 VPS (2GB RAM, 2 CPU)
- Vercel Pro plan
- Supabase Pro plan

#### Medium Scale ($200-500/month)
- Multiple Judge0 instances with load balancer
- Vercel Team plan
- Dedicated database
- CDN and monitoring

#### Large Scale ($500-2000/month)
- Auto-scaling Judge0 cluster
- Multiple regions
- Advanced monitoring and analytics
- Dedicated support

## Security Best Practices

### 1. Code Execution Security
```typescript
// Secure execution limits
const SECURITY_LIMITS = {
  cpu_time_limit: 5,        // 5 seconds max
  memory_limit: 256000,     // 256MB max
  wall_time_limit: 10,      // 10 seconds total
  max_file_size: 1024,      // 1KB output max
  max_processes: 60         // Process limit
};
```

### 2. Rate Limiting
```typescript
// Per-user submission limits
const RATE_LIMITS = {
  submissions_per_minute: 10,
  submissions_per_hour: 100,
  submissions_per_day: 1000
};
```

### 3. Input Validation
```typescript
// Validate all user inputs
const MAX_CODE_LENGTH = 100000; // 100KB max code
const ALLOWED_LANGUAGES = [50, 54, 62, 63, 71]; // Restrict languages
```

## Cost Breakdown

### Monthly Operating Costs

#### Judge0 Self-Hosted
- **VPS (4GB RAM, 2 CPU)**: $25-50/month
- **Bandwidth**: $5-15/month
- **Backup Storage**: $5/month
- **Total**: $35-70/month

#### Judge0 RapidAPI
- **API Calls (10K/month)**: $50-100/month
- **No server maintenance**: $0/month
- **Total**: $50-100/month

#### Platform Costs
- **Vercel Pro**: $20/month
- **Domain**: $12/year
- **Supabase Pro**: $25/month
- **Monitoring**: $10/month
- **Total**: $55/month + Judge0 costs

### Total: $90-170/month for production platform

## Launch Checklist

### Pre-Launch
- [ ] Judge0 server deployed and tested
- [ ] All environment variables configured
- [ ] Database migrated and seeded
- [ ] SSL certificates active
- [ ] Domain DNS configured
- [ ] Error tracking configured
- [ ] Backup systems in place

### Launch Day
- [ ] Final deployment to production
- [ ] Smoke tests on all features
- [ ] Load testing for expected traffic
- [ ] Monitor error rates and response times
- [ ] User acceptance testing
- [ ] Marketing and user onboarding ready

### Post-Launch
- [ ] Monitor system health 24/7
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Feature usage analytics
- [ ] Security monitoring
- [ ] Regular backups verified

---

## Support and Troubleshooting

### Common Issues

1. **Judge0 Connection Failed**
   ```bash
   # Check server status
   curl http://your-judge0-server:2358/about
   
   # Check Docker containers
   docker ps
   docker logs judge0-server
   ```

2. **Slow Execution Times**
   ```bash
   # Monitor server resources
   htop
   docker stats
   
   # Scale Judge0 instances if needed
   ```

3. **Database Connection Issues**
   ```bash
   # Test database connection
   npx prisma db pull
   
   # Check connection string format
   ```

### Getting Help

- **Judge0 Documentation**: https://github.com/judge0/judge0
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs

Your production-ready IDE platform for Codeunia.com is now ready for real users with genuine code execution capabilities!
