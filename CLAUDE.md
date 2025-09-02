# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a ChatGPT clone project with the following specifications (from project.md):
- React-based frontend with Next.js
- Real-time streaming chat functionality
- Chat session management
- Supabase backend integration
- Google authentication

## Development Status

This repository is in early development stage with only project specifications defined. The codebase has not been implemented yet.

## Architecture Considerations

Based on the Korean project specification, the application should be structured as:
- Next.js application with React components
- Supabase integration for data persistence and real-time features
- Google OAuth for user authentication
- Streaming chat interface for real-time responses
- Session management for chat history

## Expected Project Structure

Once implemented, the project will likely follow Next.js conventions:
- `/app` or `/pages` directory for routing
- `/components` for React components
- `/lib` for utility functions and API integrations
- Supabase client configuration
- Authentication setup with Google OAuth

## Development Process

**CRITICAL: Always follow this TDD-based development process for all implementations:**

1. **Interface Definition**: Define clear TypeScript interfaces that specify requirements
2. **Unit Test Creation**: Write comprehensive unit tests using the interfaces as specification
3. **Test Validation**: Ensure tests are idempotent and properly validate the expected behavior
4. **Implementation**: Write code that passes all unit tests
5. **Test Execution**: Run tests rigorously to verify implementation correctness

**Testing Framework**: Use Jest and React Testing Library for all unit tests. Every function, component, and API endpoint must have corresponding tests before implementation.

**Key Principles**:
- Tests must be written BEFORE implementation code
- All tests must pass before code is considered complete
- Maintain idempotency in all tests
- Use interfaces as the single source of truth for requirements

## Subagent Collaboration Workflow

**Available Specialized Agents:**
- `database-architect`: Supabase schema design, RLS policies, performance optimization
- `api-developer`: Next.js API Routes, Claude API integration, authentication
- `frontend-architect`: React components, Zustand state management, responsive design
- `streaming-specialist`: Server-Sent Events, real-time data streaming, connection management
- `test-engineer`: Jest/RTL testing, TDD implementation, CI/CD test pipelines

**Collaboration Sequence:**
1. `database-architect`: Schema design → Test creation
2. `api-developer`: API design → Test creation  
3. `frontend-architect`: Component design → Test creation
4. `streaming-specialist`: Real-time features → Test creation
5. `test-engineer`: Integration testing & E2E tests

**Agent Dependencies:**
```
database-architect → api-developer
database-architect → frontend-architect
api-developer → streaming-specialist
frontend-architect → streaming-specialist
test-engineer → all other agents
```

Each agent MUST follow the TDD process and provide stable interfaces for subsequent agents to build upon.

## Branch Information

- Main development branch: `main` (Do not refer to this branch)
- Current working branch: `korean`