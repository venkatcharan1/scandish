# QR Menu Platform - Deployment Guide

## Prerequisites
- Netlify account (https://netlify.com)
- GitHub account (recommended for continuous deployment)

## Deployment Steps

### 1. Prepare for Deployment

Ensure all environment variables are set correctly in your build:
- The app uses Lovable Cloud backend which is pre-configured
- All Supabase credentials are automatically injected during build

### 2. Deploy to Netlify

#### Option A: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

#### Option B: Deploy via Netlify Dashboard
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

### 3. Configure Custom Domain (Optional)

1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Follow the DNS configuration instructions
4. Update AUTH redirect URLs in Lovable Cloud dashboard

### 4. Update Authentication URLs

After deployment, update these URLs in your Lovable Cloud auth settings:

1. **Site URL**: Set to your deployed URL (e.g., `https://your-site.netlify.app`)
2. **Redirect URLs**: Add your deployed URL + `/reset-password` and `/`

### 5. Test Your Deployment

1. Visit your deployed site
2. Create a test account
3. Create a shop
4. Add products
5. Test the public shop page
6. Test QR code generation
7. Test ordering via WhatsApp
8. Test payment flow with Razorpay test keys

## Environment Configuration

The following are automatically configured via Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Storage bucket configuration
- Database tables and RLS policies

## Razorpay Configuration

### Test Mode (Development)
Currently configured with test keys in the code:
- Key ID: `4c2e93473922b6b4363508d4cc02a41e0dc831bae592f4506704964e23e65fe6`
- Key Secret: `24db084ee7ccbc9533d21f4fdb11566a9ee797bec3df3626e18c51eb97e8d8c5`

### Production Mode
For production:
1. Get your live Razorpay keys from https://dashboard.razorpay.com
2. Update the keys in `src/components/SubscriptionManager.tsx`
3. Update the secret in the edge function

## Clearing Cache

If you don't see updates after deployment:

### Clear Netlify CDN Cache
1. Go to Netlify dashboard
2. Click "Deploys"
3. Click "Clear cache and deploy site"

### Clear Browser Cache
- Chrome/Edge: Ctrl+Shift+Delete → Clear cached images and files
- Firefox: Ctrl+Shift+Delete → Cached Web Content
- Safari: Safari menu → Clear History → All History

## Troubleshooting

### 404 Errors on Refresh
- Check that `public/_redirects` file exists with: `/*    /index.html   200`
- Verify `netlify.toml` has the correct redirect configuration

### Authentication Issues
- Verify Site URL and Redirect URLs are set correctly in Lovable Cloud
- Check that email confirmation is auto-enabled for testing

### Image Upload Issues
- Verify storage bucket `shop-images` exists
- Check RLS policies allow authenticated uploads
- Ensure images are public for viewing

### Payment Issues
- Test with Razorpay test cards: 4111 1111 1111 1111
- Check browser console for errors
- Verify edge function `verify-payment` is deployed
- Check edge function logs in Lovable Cloud

## SEO Considerations

The app includes:
- Proper meta tags in `index.html`
- Semantic HTML structure
- Mobile-responsive design
- Fast loading times

## Monitoring

Monitor your deployment:
1. Netlify Analytics (if enabled)
2. Lovable Cloud function logs
3. Browser console for client-side errors
4. Razorpay dashboard for payment tracking

## Support

For issues or custom requirements:
- Email: venkattechstudios@gmail.com