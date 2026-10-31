import "server-only";
import { env } from "@/lib/env";
import { anthropicProvider } from "./anthropic";
import type { AiProvider } from "./provider";

const PROVIDERS: Record<string, AiProvider> = { anthropic: anthropicProvider };

export function getProvider(): AiProvider {
  return PROVIDERS[env().AI_PROVIDER] ?? anthropicProvider;
}

export * from "./provider";
