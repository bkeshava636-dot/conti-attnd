if (process.env.VERCEL) {
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-supabase'));
  const hasSupabaseKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    throw new Error(
      '[Vercel Runtime Configuration Error] SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required on Vercel. Local file store cannot be written in read-only serverless functions.'
    );
  }
}

const app = require('../backend/src/server.js');

module.exports = app;
