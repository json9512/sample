# ChatGPT Clone Project

A conversational AI application built with Next.js, Supabase, and Anthropic Claude API.

## Overview

Simple ChatGPT-like interface with:
- Text-based chat conversations
- Streaming AI responses from Claude API
- Persistent conversation history
- Google OAuth authentication

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript & Tailwind CSS
- **Backend**: Next.js API routes with streaming
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth via Supabase
- **AI**: Anthropic Claude API

## Key Constraints

- Text-only conversations (no file attachments)
- Single-user conversations (no collaboration)
- No custom rate limiting (rely on Claude API limits)

## Documentation

See `CLAUDE.md` for complete technical specifications, interface definitions, database schema, and implementation plan.