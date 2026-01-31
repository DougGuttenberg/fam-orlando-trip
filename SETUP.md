# Orlando Trip Planner - Setup Guide

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project**
3. Give it a name like "orlando-trip"
4. Choose a strong database password (save it somewhere)
5. Select a region close to you
6. Click **Create new project** and wait ~2 minutes

### 2. Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Paste this entire SQL block and click **Run**:

```sql
-- Create the feedback table
CREATE TABLE trip_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  person_name TEXT NOT NULL,
  section_feedback JSONB DEFAULT '[]'::jsonb,
  lodging_preference TEXT,
  lodging_constraints TEXT,
  dietary_restrictions TEXT,
  dietary_preferences TEXT,
  private_budget TEXT,
  private_pace TEXT,
  private_kids TEXT,
  private_other TEXT
);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE trip_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read feedback (for the "what others said" feature)
CREATE POLICY "Allow public read" ON trip_feedback
  FOR SELECT USING (true);

-- Allow anyone to insert feedback (no auth required)
CREATE POLICY "Allow public insert" ON trip_feedback
  FOR INSERT WITH CHECK (true);

-- Create an index for faster queries
CREATE INDEX idx_trip_feedback_created_at ON trip_feedback(created_at DESC);
```

You should see "Success. No rows returned" - that's correct.

### 3. Get Your API Credentials

1. Go to **Project Settings** (gear icon, bottom left)
2. Click **API** in the sidebar
3. You'll need two values:
   - **Project URL** - looks like `https://xxxxx.supabase.co`
   - **anon public** key - the long string under "Project API keys"

### 4. Set Up Environment Variables

Create a file called `.env` in the project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual credentials from step 3.

### 5. Deploy to Vercel

1. Push the code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
6. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will run at `http://localhost:5173`

Without environment variables, it runs in "demo mode" - you can explore but feedback won't save.

---

## Exporting Feedback Data

### Option A: Supabase Dashboard (easiest)

1. Go to **Table Editor** in your Supabase dashboard
2. Click on `trip_feedback`
3. Click **Export** → **Export as CSV**

### Option B: SQL Query for Custom Export

In the SQL Editor, run:

```sql
-- All feedback, newest first
SELECT
  person_name,
  created_at,
  section_feedback,
  lodging_preference,
  lodging_constraints,
  dietary_restrictions,
  dietary_preferences,
  private_budget,
  private_pace,
  private_kids,
  private_other
FROM trip_feedback
ORDER BY created_at DESC;
```

### Option C: Flattened by Section

```sql
-- Flatten section feedback for analysis
SELECT
  person_name,
  created_at,
  section->>'sectionId' as section_id,
  section->>'sentiment' as sentiment,
  section->>'comment' as comment
FROM trip_feedback,
LATERAL jsonb_array_elements(section_feedback) as section
ORDER BY created_at DESC, section_id;
```

---

## Troubleshooting

**"Demo mode" message showing?**
- Check that `.env` file exists with correct values
- Restart the dev server after adding env vars
- Make sure variable names start with `VITE_`

**Feedback not saving?**
- Check browser console for errors
- Verify the table was created in Supabase
- Check that RLS policies were added

**Want to clear all test data?**
```sql
DELETE FROM trip_feedback;
```

---

## Project Structure

```
orlando-trip-app/
├── src/
│   ├── App.jsx          # Main app with all sections
│   ├── main.jsx         # Entry point
│   ├── index.css        # All styling
│   └── supabaseClient.js # Database connection
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
├── .env                 # Your credentials (don't commit!)
└── SETUP.md            # This file
```

---

## Security Notes

- The `anon` key is safe to expose in frontend code
- Row Level Security (RLS) controls what users can do
- Current setup: anyone can read and insert, but not update/delete
- Private feedback fields are visible in the database - only Doug should access it directly
