# Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration
DATABASE_URL=your_postgresql_database_url
DIRECT_URL=your_postgresql_direct_connection_url

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: For production
# NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## How to Get These Values

### 1. Supabase URL and Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database URLs

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Copy:
   - **Connection string** → `DATABASE_URL` (use the pooled connection)
   - **Direct connection** → `DIRECT_URL` (use the direct connection)

### 3. Site URL

- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

## Security Notes

- **Never commit** `.env.local` to version control
- The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges - keep it secure
- Use different keys for development and production environments
