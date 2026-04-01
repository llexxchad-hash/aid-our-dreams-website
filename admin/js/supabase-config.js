/* ============================================
   SUPABASE CONFIGURATION
   ============================================
   
   HOW TO SET UP:
   1. Go to https://supabase.com and create a free account
   2. Click "New Project" and give it a name (e.g. "aid-our-dreams")
   3. Copy your Project URL and anon/public API key from:
      Project Settings > API
   4. Paste them below replacing the placeholder values
   
   ============================================ */

const SUPABASE_URL = 'https://eoreisbzgveqgwkptciu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcmVpc2J6Z3ZlcWd3a3B0Y2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTA5NzAsImV4cCI6MjA5MDYyNjk3MH0._aI3u8qTIBxlxmeZ8eNPQuA6ozkZ2t9vujL7kTuqGIQ';

// Initialize Supabase client (loaded from CDN in HTML)
// NOTE: We use "supabaseClient" (not "supabase") because the CDN
// declares  var supabase = ...  globally, and re-declaring with let
// in the same scope causes a SyntaxError that silently kills this file.
let supabaseClient = null;

function initSupabase() {
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  }
  return false;
}

function isSupabaseConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

/* ============================================
   DATABASE TABLES TO CREATE IN SUPABASE:
   ============================================
   
   Go to SQL Editor in your Supabase dashboard and run:

   -- Gallery images table
   CREATE TABLE gallery (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     src TEXT NOT NULL,
     alt TEXT DEFAULT 'Gallery image',
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- Events table
   CREATE TABLE events (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     date TEXT NOT NULL,
     time TEXT,
     location TEXT NOT NULL,
     category TEXT DEFAULT 'upcoming',
     description TEXT,
     image TEXT,
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- Slides table
   CREATE TABLE slides (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     date TEXT,
     time TEXT,
     location TEXT,
     link TEXT,
     image TEXT,
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- Enable Row Level Security
   ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;
   ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

   -- Allow authenticated users full access
   CREATE POLICY "Authenticated users can do everything on gallery"
     ON gallery FOR ALL USING (auth.role() = 'authenticated');
   CREATE POLICY "Authenticated users can do everything on events"
     ON events FOR ALL USING (auth.role() = 'authenticated');
   CREATE POLICY "Authenticated users can do everything on slides"
     ON slides FOR ALL USING (auth.role() = 'authenticated');

   -- Allow public read access (for the website)
   CREATE POLICY "Public can view gallery" ON gallery FOR SELECT USING (true);
   CREATE POLICY "Public can view events" ON events FOR SELECT USING (true);
   CREATE POLICY "Public can view slides" ON slides FOR SELECT USING (true);

   -- Create a storage bucket for images
   INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);
   
   -- Allow authenticated uploads
   CREATE POLICY "Authenticated users can upload images"
     ON storage.objects FOR INSERT WITH CHECK (
       bucket_id = 'images' AND auth.role() = 'authenticated'
     );
   CREATE POLICY "Authenticated users can delete images"
     ON storage.objects FOR DELETE USING (
       bucket_id = 'images' AND auth.role() = 'authenticated'
     );
   CREATE POLICY "Public can view images"
     ON storage.objects FOR SELECT USING (bucket_id = 'images');

   ============================================
   
   THEN create an admin user:
   Go to Authentication > Users > Add User
   Email: admin@aidourdreams.org
   Password: (your secure password)
   
   ============================================ */
