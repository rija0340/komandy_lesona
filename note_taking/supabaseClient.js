// === Initialize Supabase Client ===
// 
// IMPORTANT: Before using this application, you need to:
// 1. Create a Supabase project at https://supabase.com
// 2. Get your Project URL and anon public key from Project Settings > API
// 3. Replace the placeholders below with your actual credentials
//
// SECURITY WARNING: In a production app, never expose your anon key in client-side code.
// This is only for development/testing purposes.
//

// The Supabase library is loaded via CDN in the HTML and is available as window.supabase
const SUPABASE_URL = 'https://jttwnrynhosatfykxyzr.supabase.co';  // Replace with your project URL
const SUPABASE_ANON_KEY = 'sb_publishable_TzbWNML3lb41Ea55hS1B0g_IIUGiPiN';             // Replace with your anon key

// Initialize the Supabase client using the library from CDN
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make the supabase client available globally for the application
window.supabase = supabaseClient;