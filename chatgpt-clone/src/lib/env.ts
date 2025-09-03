import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required"),

  // Anthropic Claude API
  ANTHROPIC_API_KEY: z.string().min(1, "Anthropic API key is required"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, "Google Client ID is required")
    .optional(),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, "Google Client Secret is required")
    .optional(),

  // Next.js
  NEXTAUTH_URL: z.string().url("Invalid NextAuth URL").optional(),
  NEXTAUTH_SECRET: z.string().min(1, "NextAuth secret is required").optional(),

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

export const env = validateEnv();

// Client-side environment variables (safe to expose to browser)
export const clientEnv = {
  SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_NAME: env.APP_NAME,
  APP_VERSION: env.APP_VERSION,
} as const;

// Server-side environment variables (never exposed to browser)
export const serverEnv = {
  ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
  GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_URL: env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
} as const;
