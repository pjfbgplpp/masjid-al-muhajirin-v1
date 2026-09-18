import app from '../server';

// Catch-all so every /api/* route (health, displays, supabase, ai/generate-content)
// runs through the same Express app instead of hitting Vercel's static 404 page.
// api/keep-alive.ts stays a separate function; Vercel matches that exact path
// before falling through to this dynamic segment.
export default app;
