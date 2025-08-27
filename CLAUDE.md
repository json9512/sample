# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a ChatGPT clone project with the following core features:
- Interactive chat UI for user questions and AI responses
- Real-time streaming request/response functionality
- Chat history persistence

## Tech Stack & Architecture

- **Frontend**: React-based application
- **Backend**: Can be implemented as either:
  - Single Next.js full-stack application, or
  - Separate frontend web app + backend service
- **Database**: Supabase
- **Authentication**: Google login via Supabase

## Development Notes

This is currently a planning/specification phase project. The actual implementation has not yet been created. When implementing:

1. Consider streaming API design for real-time chat responses
2. Design database schema for chat history storage in Supabase
3. Implement proper authentication flow with Google OAuth
4. Choose between monolithic Next.js approach vs. separate services based on complexity needs

## Current Status

The project currently contains only the specification document (project.md). No code implementation, build system, or development tooling has been set up yet.