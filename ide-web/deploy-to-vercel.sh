#!/bin/bash

# Codeunia.com - Production Deployment Script
# This script deploys your IDE with real Judge0 integration

echo "🚀 Codeunia.com - Production Deployment"
echo "======================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the IDE project root."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Verify production setup
echo "🔍 Checking production readiness..."

# Check if production Judge0 file exists
if [ ! -f "app/api/judge0/submissions/route-production.ts" ]; then
    echo "❌ Production Judge0 file not found. Please run the setup first."
    exit 1
fi

# Switch to production Judge0 implementation
echo "🔄 Switching to production Judge0 implementation..."
if [ -f "app/api/judge0/submissions/route.ts" ]; then
    mv "app/api/judge0/submissions/route.ts" "app/api/judge0/submissions/route-demo.ts"
    echo "   Backed up demo version to route-demo.ts"
fi
cp "app/api/judge0/submissions/route-production.ts" "app/api/judge0/submissions/route.ts"
echo "   ✅ Production Judge0 implementation activated"

# Build the project to check for errors
echo "🔧 Building project for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Environment variables check
echo "🔍 Environment variables checklist:"
echo "   Make sure these are set in Vercel dashboard:"
echo "   ✅ DATABASE_URL (Supabase connection string)"
echo "   ✅ JUDGE0_URL (your Judge0 server or RapidAPI URL)"
echo "   ✅ NEXTAUTH_SECRET (secure random string)"
echo "   ✅ NEXTAUTH_URL (https://codeunia.com)"
echo "   📋 Optional: RAPIDAPI_KEY (if using RapidAPI Judge0)"
echo ""

# Judge0 server check
echo "🔍 Judge0 server status check:"
read -p "Enter your Judge0 server URL (e.g., http://your-vps:2358): " JUDGE0_SERVER

if [ ! -z "$JUDGE0_SERVER" ]; then
    echo "   Testing connection to $JUDGE0_SERVER..."
    if curl -s "$JUDGE0_SERVER/about" > /dev/null; then
        echo "   ✅ Judge0 server is responding"
    else
        echo "   ⚠️  Warning: Cannot connect to Judge0 server"
        echo "      Make sure your Judge0 server is running and accessible"
    fi
else
    echo "   ⚠️  Skipping Judge0 server check"
fi

echo ""
read -p "🚀 Ready to deploy to production? (y/N): " confirm

if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "   Deployment cancelled."
    exit 0
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Production deployment successful!"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "   1. ✅ Verify Judge0 integration is working"
    echo "   2. ✅ Test code execution with different languages"
    echo "   3. ✅ Check contest and submission features"
    echo "   4. ✅ Configure monitoring and error tracking"
    echo "   5. ✅ Set up backup procedures"
    echo ""
    echo "🔗 Your production platform is now live!"
    echo "   • Real code execution with Judge0"
    echo "   • Full contest management system"
    echo "   • User authentication and profiles"
    echo "   • Admin dashboard for platform management"
    echo ""
    echo "🧪 Test your deployment:"
    echo "   curl https://codeunia.com/api/judge0/about"
    echo ""
    echo "📚 For monitoring and scaling, see VERCEL_DEPLOYMENT.md"
else
    echo "❌ Deployment failed. Check the errors above."
    
    # Restore demo version on failure
    echo "🔄 Restoring demo version..."
    if [ -f "app/api/judge0/submissions/route-demo.ts" ]; then
        mv "app/api/judge0/submissions/route-demo.ts" "app/api/judge0/submissions/route.ts"
        echo "   Demo version restored"
    fi
    
    exit 1
fi
