# ChatGPT Clone

A modern ChatGPT clone built with Next.js 14, Supabase, and Claude API.

## Features

- 🤖 **Claude AI Integration**: Powered by Anthropic's Claude API for intelligent conversations
- 🔐 **Google OAuth Authentication**: Secure login with Google accounts
- 💬 **Real-time Streaming**: Live response streaming for natural conversation flow
- 📚 **Session Management**: Create, manage, and organize chat sessions
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🔒 **Secure**: Row-level security with Supabase
- ⚡ **Fast**: Built with Next.js 14 and Turbopack

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **AI**: Anthropic Claude API
- **State Management**: Zustand
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Anthropic API key
- Google OAuth credentials (for authentication)

### 1. Clone and Install

```bash
git clone <repository-url>
cd chatgpt-clone
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database migrations:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Initialize Supabase locally
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Push database schema
supabase db push
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)

### 5. Anthropic API Setup

1. Sign up at [Anthropic Console](https://console.anthropic.com)
2. Generate an API key
3. Add it to your `.env.local` file

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack

# Building
npm run build        # Build for production
npm start           # Start production server

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Linting
npm run lint        # Run ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application
│   └── api/               # API endpoints
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── chat/             # Chat-related components
│   └── sessions/         # Session management components
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase client configuration
│   ├── claude/           # Claude API client
│   ├── stores/           # Zustand stores
│   └── utils/            # Helper functions
└── types/                # TypeScript type definitions
```

## Database Schema

The application uses a PostgreSQL database with the following main tables:

- **users**: User profiles and authentication data
- **chat_sessions**: Chat session management
- **messages**: Individual chat messages

All tables include Row Level Security (RLS) policies to ensure data isolation between users.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or run into issues, please check the documentation or create an issue in the repository.