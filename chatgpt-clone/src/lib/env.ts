import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required"),

  // Anthropic Claude API
  ANTHROPIC_API_KEY: z.string().min(1, "Anthropic API key is required"),

  // Google OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Next.js (optional)
  NEXTAUTH_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),

  // Application
  APP_NAME: z.string().default("ChatGPT Clone"),
  APP_VERSION: z.string().default("0.1.0"),
});

export type Environment = z.infer<typeof envSchema>;

function validateEnv(): Environment {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

// Only validate env on server-side to avoid build-time issues
export const env = typeof window === 'undefined' ? validateEnv() : {} as Environment;

// Client-side environment variables (safe to expose to browser)
export const clientEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tjpmfwzcjjnbuqbbblne.supabase.co',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcG1md3pjampuYnVxYmJibG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NzYyOTMsImV4cCI6MjA3MjQ1MjI5M30.1QlBcRYKtzrsQvjtGc-_2Sc0A3SJU2qIx_vSyP8W7ns',
  APP_NAME: 'ChatGPT Clone',
  APP_VERSION: '0.1.0',
} as const;

// Server-side environment variables (never exposed to browser)
export const serverEnv = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
} as const;
