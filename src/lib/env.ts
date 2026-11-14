import "server-only";
import { z } from "zod";

/**
 * Server-side environment. Never import this file from a client component:
 * the "server-only" import makes the build fail if that happens.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // The old *.vercel.app address is replaced by the official domain, so links never point at it.
  APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000")
    .transform((u) => (/\.vercel\.app\/?$/.test(u) ? "https://huzamaju.my" : u.replace(/\/$/, ""))),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  DATA_ENCRYPTION_KEY: z.string().optional(),

  AI_PROVIDER: z.enum(["anthropic"]).default("anthropic"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-opus-5-5"),
  ANTHROPIC_API_URL: z.string().url().default("https://api.anthropic.com/v1/messages"),
  AI_EFFORT: z.enum(["low", "medium", "high", "xhigh", "max"]).default("medium"),
  AI_MAX_TOKENS: z.coerce.number().int().min(1024).max(64000).default(16000),
  AI_TEMPERATURE: z.string().optional(),
  AI_FALLBACKS: z.enum(["default", "off"]).default("default"),
  AI_DAILY_REQUEST_LIMIT: z.coerce.number().int().min(0).default(300),
  AI_PER_IP_HOURLY_LIMIT: z.coerce.number().int().min(1).default(6),
  AI_INPUT_USD_PER_MTOK: z.coerce.number().default(4),
  AI_OUTPUT_USD_PER_MTOK: z.coerce.number().default(20),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./storage"),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().default("auto"),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),

  EMAIL_PROVIDER: z.enum(["resend", "none"]).default("none"),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("HUZA MAJU <noreply@huzamaju.my>"),
  ADMIN_NOTIFY_EMAIL: z.string().optional(),

  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ADMIN_TO: z.string().optional(),

  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const isProd = () => env().NODE_ENV === "production";
