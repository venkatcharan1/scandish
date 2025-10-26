# QR Menu Platform - Test Plan

## Test Environment
- **Frontend**: Lovable Preview / Netlify Deploy
- **Backend**: Lovable Cloud (Supabase)
- **Payment Gateway**: Razorpay Test Mode
- **Test Keys**: 
  - Key ID: `4c2e93473922b6b4363508d4cc02a41e0dc831bae592f4506704964e23e65fe6`
  - Key Secret: `24db084ee7ccbc9533d21f4fdb11566a9ee797bec3df3626e18c51eb97e8d8c5`

---

## 1. Authentication Tests

### 1.1 Signup Flow
- [ ] Navigate to `/signup`
- [ ] Enter new email + password
- [ ] Submit form
- [ ] **Expected**: Shop auto-created with Free plan (1 product limit)
- [ ] **Expected**: Redirect to `/shop/:slug/admin`
- [ ] Verify shop exists in database with `owner_user_id` matching authenticated user

### 1.2 Login Flow
- [ ] Sign out from admin dashboard
- [ ] Navigate to `/login`
- [ ] Enter existing credentials
- [ ] **Expected**: Load same shop data (no duplicate shop creation)
- [ ] **Expected**: Redirect to `/shop/:slug/admin`
- [ ] Verify `current_products_count`, `product_limit`, `subscription_tier` display correctly

### 1.3 Login Persistence
- [ ] Log in successfully
- [ ] Refresh page
- [ ] **Expected**: User remains logged in, session persists
- [ ] Navigate to admin dashboard
- [ ] **Expected**: Shop data loads without re-authentication

### 1.4 Duplicate Account Prevention
- [ ] Try to signup with an existing email
- [ ] **Expected**: Error message "This account already has a shop. Please login."

### 1.5 Reset Password Flow
- [ ] Navigate to `/forgot-password`
- [ ] Enter registered email
- [ ] **Expected**: Reset email sent with secure, time-limited link
- [ ] Click reset link (opens `/reset-password?token=...`)
- [ ] Enter new password
- [ ] **Expected**: Password updated in database
- [ ] Navigate to `/login`
- [ ] Login with new password
- [ ] **Expected**: Successful login with updated credentials

---

## 2. Shop & Admin Tests

### 2.1 Shop Information Update
- [ ] Navigate to `/shop/:slug/admin` → "Shop Details" tab
- [ ] Update `shop_name`, `description`, `address`, `whatsapp_number`
- [ ] Upload shop logo (test image file)
- [ ] **Expected**: Upload progress bar displayed
- [ ] **Expected**: Logo preview shown after upload
- [ ] Click "Save Changes"
- [ ] **Expected**: Success toast notification
- [ ] Refresh page
- [ ] **Expected**: All changes persisted correctly

### 2.2 QR Code Generation
- [ ] In admin dashboard, locate QR code section
- [ ] **Expected**: QR code displayed linking to `/shop/:slug`
- [ ] Update shop `slug` in form
- [ ] Save changes
- [ ] **Expected**: QR code automatically regenerates with new URL
- [ ] Click "Download QR Code" button
- [ ] **Expected**: QR code image downloaded as PNG file

### 2.3 Subscription Status Display
- [ ] Check admin dashboard "Subscription Status" card
- [ ] **Expected**: Displays current `plan`, `product count`, `expiry date`
- [ ] **Expected**: If expiry within 3 days, warning banner shown

---

## 3. Product Management Tests

### 3.1 Add Product (Within Limit)
- [ ] Navigate to "Products" tab in admin
- [ ] Click "Add Product"
- [ ] Fill in: `name`, `price`, `category`, `description`
- [ ] Upload product image
- [ ] **Expected**: Image preview displayed
- [ ] Click "Add Product"
- [ ] **Expected**: Product created, `current_products_count` incremented
- [ ] **Expected**: Product appears in product grid

### 3.2 Product Limit Enforcement
- [ ] Add products until `current_products_count >= product_limit`
- [ ] **Expected**: "Add Product" button disabled
- [ ] **Expected**: Alert shown: "You've reached your product limit. Upgrade to add more."
- [ ] **Expected**: Upgrade CTA displayed

### 3.3 Edit Product
- [ ] Click "Edit" on existing product
- [ ] Update `name`, `price`, `description`
- [ ] Replace product image
- [ ] Click "Update Product"
- [ ] **Expected**: Product updated successfully
- [ ] **Expected**: Changes reflected in product grid

### 3.4 Delete Product
- [ ] Click "Delete" on a product
- [ ] Confirm deletion
- [ ] **Expected**: Product removed from database
- [ ] **Expected**: `current_products_count` decremented
- [ ] **Expected**: Product no longer visible in grid

### 3.5 Subscription Expiry Behavior
- [ ] Manually set `subscription_expiry` to past date in database
- [ ] Refresh admin dashboard
- [ ] **Expected**: Alert banner: "⚠️ Your subscription has expired. Please recharge to add new products."
- [ ] **Expected**: "Add Product" button disabled
- [ ] **Expected**: Existing products still visible and editable

---

## 4. Payment & Subscription Tests

### 4.1 Razorpay Test Payment
- [ ] Navigate to "Billing" tab in admin
- [ ] Select plan (e.g., ₹100 Basic - 5 products)
- [ ] Click "Pay Now"
- [ ] **Expected**: Razorpay test popup opens
- [ ] Use test card: `4111 1111 1111 1111`, any future CVV/expiry
- [ ] Complete payment
- [ ] **Expected**: Payment success callback triggered

### 4.2 Payment Verification (Server-side)
- [ ] After successful Razorpay payment
- [ ] **Expected**: Client calls `/functions/verify-payment` edge function
- [ ] **Expected**: Function verifies Razorpay signature using Key Secret
- [ ] **Expected**: On success:
  - `product_limit` updated (e.g., 5 for Basic plan)
  - `subscription_expiry` set to `now() + 30 days`
  - `subscription_tier` updated (e.g., 'basic')
  - Payment record saved in `payments` table
- [ ] **Expected**: Page reloads, admin dashboard shows updated plan

### 4.3 Payment History
- [ ] Navigate to "Billing" tab → "Payment History"
- [ ] **Expected**: List of all payments with:
  - `plan_name`, `amount`, `payment_date`, `status`
- [ ] **Expected**: Most recent payment at top

---

## 5. Public Shop Page Tests

### 5.1 Public Access
- [ ] Navigate to `/shop/:slug` (without login)
- [ ] **Expected**: Shop header displayed (logo, name, description)
- [ ] **Expected**: Product grid visible (all products)
- [ ] **Expected**: Categories filter displayed
- [ ] **Expected**: Search bar functional

### 5.2 Product Search & Filter
- [ ] Enter product name in search bar
- [ ] **Expected**: Matching products displayed
- [ ] Select category filter
- [ ] **Expected**: Only products in selected category shown

### 5.3 WhatsApp Order Flow
- [ ] Click "Order" on a product
- [ ] **Expected**: Opens WhatsApp link: `https://wa.me/{whatsapp_number}?text=...`
- [ ] **Expected**: Pre-filled message includes:
  - Shop name
  - Product name
  - Product ID
  - Default quantity (1)
- [ ] Example: `"Order from My Shop - Burger (ID: abc123) — Qty: 1"`

### 5.4 QR Code Download (Public)
- [ ] On public shop page, locate QR code section
- [ ] Click "Download QR Code"
- [ ] **Expected**: QR code image downloaded
- [ ] Scan downloaded QR with mobile device
- [ ] **Expected**: Opens `/shop/:slug` page

---

## 6. Image Upload Tests

### 6.1 Shop Logo Upload
- [ ] In admin "Shop Details", click "Upload Logo"
- [ ] Select image file (PNG/JPG)
- [ ] **Expected**: Upload progress displayed
- [ ] **Expected**: Thumbnail preview shown
- [ ] **Expected**: `logo_url` saved to database
- [ ] Navigate to public shop page
- [ ] **Expected**: Logo displayed in shop header

### 6.2 Product Image Upload
- [ ] Add/Edit product, click "Upload Image"
- [ ] Select product image
- [ ] **Expected**: Upload progress bar
- [ ] **Expected**: Image preview displayed
- [ ] Save product
- [ ] **Expected**: Image visible in product grid (admin & public)

### 6.3 Image Replacement
- [ ] Edit product with existing image
- [ ] Upload new image
- [ ] **Expected**: Old image replaced
- [ ] **Expected**: New image URL saved in database

---

## 7. Netlify Deployment Tests

### 7.1 SPA Routing
- [ ] Deploy to Netlify
- [ ] Navigate to `/shop/:slug`
- [ ] Refresh page
- [ ] **Expected**: Page loads correctly (no 404)
- [ ] Navigate to `/shop/:slug/admin`
- [ ] Refresh page
- [ ] **Expected**: Admin page loads (if authenticated)

### 7.2 _redirects File
- [ ] Verify `public/_redirects` contains:
  ```
  /*    /index.html   200
  ```
- [ ] **Expected**: All routes fallback to `index.html` for client-side routing

### 7.3 Environment Variables
- [ ] In Netlify, set environment variable:
  - `BASE_URL` = `https://dqrmenu.netlify.app`
- [ ] **Expected**: Generated QR codes use production URL

---

## 8. Security Tests

### 8.1 Admin Route Protection
- [ ] Log out
- [ ] Try to access `/shop/:slug/admin` directly
- [ ] **Expected**: Redirect to `/login`

### 8.2 Razorpay Signature Verification
- [ ] Attempt to call `/functions/verify-payment` with fake payment ID
- [ ] **Expected**: Payment rejected, no DB update
- [ ] **Expected**: Error logged in edge function logs

### 8.3 RLS Policies
- [ ] As user A, try to access user B's shop data
- [ ] **Expected**: Query returns empty (RLS blocks unauthorized access)
- [ ] Verify RLS policies:
  - `shops`: users can only update their own shop (`owner_user_id = auth.uid()`)
  - `products`: only shop owners can insert/update/delete
  - `payments`: only shop owners can view their payments

---

## 9. SEO & Metadata Tests

### 9.1 Meta Tags
- [ ] View page source on `/` and `/shop/:slug`
- [ ] **Expected**: Clean meta tags (no Lovable references)
- [ ] **Expected**: Title, description, Open Graph tags present

### 9.2 Favicon
- [ ] Check browser tab icon
- [ ] **Expected**: Custom favicon displayed (not default Lovable icon)
- [ ] Follow instructions in `DEPLOYMENT.md` to clear cache if needed

---

## 10. Edge Cases & Error Handling

### 10.1 Invalid Shop Slug
- [ ] Navigate to `/shop/nonexistent-slug`
- [ ] **Expected**: 404 or "Shop not found" message

### 10.2 Expired Payment Link
- [ ] Manually expire reset password token (set timestamp > 1 hour ago)
- [ ] Try to use expired link
- [ ] **Expected**: Error message "Reset link expired. Request a new one."

### 10.3 Network Errors
- [ ] Disable network, attempt to save shop details
- [ ] **Expected**: Error toast notification
- [ ] Re-enable network, retry
- [ ] **Expected**: Save succeeds

---

## Acceptance Criteria Summary

| Test Category | Pass Criteria |
|---------------|---------------|
| **Authentication** | Signup creates shop, login loads existing shop, reset password works |
| **Shop Management** | All fields editable, QR auto-updates, logo upload works |
| **Products** | CRUD works, limits enforced, images upload successfully |
| **Subscriptions** | Payment flow completes, limits update, expiry alerts work |
| **Public Shop** | Accessible without login, WhatsApp orders work, search/filter functional |
| **Deployment** | SPA routing works on Netlify, no 404 on refresh |
| **Security** | Admin routes protected, Razorpay verified server-side, RLS policies enforced |

---

## Test Execution Checklist

- [ ] All authentication tests passed
- [ ] All shop management tests passed
- [ ] All product CRUD tests passed
- [ ] All payment & subscription tests passed
- [ ] All public shop tests passed
- [ ] All image upload tests passed
- [ ] All Netlify deployment tests passed
- [ ] All security tests passed
- [ ] All edge case tests passed

**Tester Name**: _______________  
**Date**: _______________  
**Overall Status**: ☐ PASS | ☐ FAIL  
**Notes**: _______________________________________________
