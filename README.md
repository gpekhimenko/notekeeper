# NoteKeeper

A personal note-taking app with calendar organization, markdown support, tags, voice dictation, and AI-powered suggestions.

**Live:** https://gp-notetaker.vercel.app

## Features

- **Calendar sidebar** — browse and create notes by date
- **Markdown editor** — write notes with full Markdown support, rendered in view mode
- **Tags** — colored tag pills with hash-based 8-color palette, multi-tag AND filtering
- **Search** — full-text search across titles, bodies, and tags
- **Voice dictation** — speech-to-text with automatic autocorrect (Web Speech API)
- **AI title suggestion** — auto-suggests a title based on note body (Groq LLM, 1s debounce)
- **AI tag suggestions** — suggests 2-4 tags preferring existing tags for consistency (Groq LLM, 1.5s debounce)
- **Auth** — GitHub and Google OAuth via NextAuth.js v5
- **Mobile-friendly** — responsive layout with panel navigation, tap-friendly controls

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Auth:** NextAuth.js v5 (beta.30) with GitHub and Google OAuth
- **Database:** Supabase Postgres (via `pg` + `@auth/pg-adapter`)
- **AI:** Groq API with `openai/gpt-oss-20b` model
- **Other:** react-day-picker, react-markdown

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase Postgres database (or any Postgres instance)
- A GitHub OAuth app and/or Google OAuth app (for authentication)
- A Groq API key (for AI suggestions)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

Run the schema against your Postgres database:

```bash
psql $DATABASE_URL -f schema.sql
```

### 3. Configure environment variables

Create `.env.local` with:

```
AUTH_SECRET=<random-secret>
AUTH_TRUST_HOST=true
AUTH_GITHUB_ID=<github-oauth-client-id>
AUTH_GITHUB_SECRET=<github-oauth-client-secret>
AUTH_GOOGLE_ID=<google-oauth-client-id>
AUTH_GOOGLE_SECRET=<google-oauth-client-secret>
DATABASE_URL=<postgres-connection-string>
GROQ_API_KEY=<groq-api-key>
```

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

## Project Structure

```
app/
  page.tsx                    # Main app (state management, layout)
  login/page.tsx              # Login page
  api/
    auth/[...nextauth]/       # NextAuth route handler
    notes/                    # CRUD endpoints for notes
    autocorrect/              # Voice dictation autocorrect
    suggest-title/            # AI title suggestion
    suggest-tags/             # AI tag suggestion
  components/
    CalendarSidebar.tsx       # Date picker + tag filter
    NotesList.tsx             # Notes list with search
    NoteEditor.tsx            # View/edit/create notes
    EmptyState.tsx            # Empty state placeholder
  lib/
    db.ts                     # Postgres connection pool
    types.ts                  # TypeScript types
    notesApi.ts               # Client-side API functions
    useNotesReducer.ts        # State management (useReducer)
    useTitleSuggestion.ts     # AI title suggestion hook
    useTagSuggestion.ts       # AI tag suggestion hook
    useSpeechRecognition.ts   # Voice dictation hook
    noteUtils.ts              # ID generation utilities
    tagColors.ts              # Tag color palette
auth.ts                       # NextAuth configuration
schema.sql                    # Database schema
```

## Deployment

Deployed on Vercel. Push to `master` triggers automatic deployment.

```bash
npx vercel --prod
```

Set the same environment variables listed above in Vercel project settings.
