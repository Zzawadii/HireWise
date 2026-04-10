# HireWise AI

An intelligent recruitment platform that leverages AI to streamline candidate screening and matching. HireWise helps recruiters efficiently evaluate candidates against job requirements while providing candidates with a transparent application experience.

## Features

### For Recruiters
- **AI-Powered Candidate Screening**: Automatically evaluate candidates based on skills, experience, and culture fit
- **Customizable Scoring Weights**: Adjust evaluation criteria to match your hiring priorities
- **Smart Interview Questions**: Generate targeted questions based on candidate gaps and strengths
- **Dashboard Analytics**: Track job postings, candidate pipeline, and screening results
- **Bulk Candidate Processing**: Screen multiple candidates simultaneously

### For Candidates
- **Job Board**: Browse and apply to open positions
- **Application Tracking**: Monitor application status and feedback
- **Profile Management**: Maintain resume and skills information
- **Transparent Feedback**: Receive detailed evaluation insights

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + shadcn/ui + Tailwind CSS
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI Integration**: Lovable AI Gateway (Gemini Flash)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + Playwright + Testing Library

## Prerequisites

- Node.js 18+ or Bun
- Supabase account
- Lovable AI API key (for candidate screening)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hirewise
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 4. Supabase Setup

1. Create a new Supabase project
2. Run the migrations in `superbase/migrations/` to set up the database schema
3. Deploy the edge functions:
   ```bash
   supabase functions deploy screen-candidates
   supabase functions deploy candidate-feedback
   ```
4. Set the `LOVABLE_API_KEY` secret for edge functions:
   ```bash
   supabase secrets set LOVABLE_API_KEY=your_api_key
   ```

### 5. Run Development Server

```bash
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── DashboardLayout.tsx
│   │   ├── CandidateLayout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/           # React contexts (Auth)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and configurations
│   ├── pages/              # Route components
│   │   ├── candidate/      # Candidate-facing pages
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CreateJob.tsx
│   │   ├── Candidates.tsx
│   │   └── Results.tsx
│   └── supabase/           # Supabase client and types
├── superbase/
│   ├── functions/          # Edge functions
│   │   ├── screen-candidates/
│   │   └── candidate-feedback/
│   └── migrations/         # Database migrations
└── ...config files
```

## Database Schema

### Tables
- **profiles**: User profile information (name, company)
- **jobs**: Job postings with requirements and scoring weights
- **candidates**: Candidate applications with resume and skills
- **screening_results**: AI evaluation results with scores and feedback

### Row Level Security
All tables implement RLS policies ensuring users can only access their own data.

## AI Screening Process

The candidate screening uses a weighted scoring system:

1. **Skills Match** (default 40%): Evaluates technical and soft skills alignment
2. **Experience Level** (default 30%): Assesses years and relevance of experience
3. **Culture Fit** (default 30%): Matches against top performer profiles

Each candidate receives:
- Overall score (0-100)
- Identified strengths and gaps
- Culture fit assessment (High/Medium/Low)
- Skill tags for quick filtering
- Targeted interview questions

## Deployment

### Frontend
Build and deploy to your preferred hosting platform:

```bash
npm run build
```

Deploy the `dist/` folder to platforms like Vercel, Netlify, or Cloudflare Pages.

### Backend
Supabase handles backend deployment. Ensure:
1. Migrations are applied
2. Edge functions are deployed
3. Environment secrets are configured
4. RLS policies are enabled

## License

This project is private and proprietary.

