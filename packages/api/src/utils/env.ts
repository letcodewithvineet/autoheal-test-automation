import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('4000'),
  MONGO_URI: z.string().default('mongodb://mongo:27017/autoheal'),
  ARTIFACT_STORAGE: z.enum(['gridfs', 'fs']).default('gridfs'),
  LLM_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
  LLM_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_INSTALLATION_ID: z.string().optional(),
  GITHUB_PRIVATE_KEY: z.string().optional(),
  REPO_FULL_NAME: z.string().default('org/repo'),
  DEFAULT_BRANCH: z.string().default('main'),
  ALLOW_CROSS_ORIGIN: z.string().default('true'),
  MAX_PAYLOAD_MB: z.string().default('50'),
});

export const env = envSchema.parse(process.env);
