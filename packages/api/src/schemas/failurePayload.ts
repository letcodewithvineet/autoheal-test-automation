import { z } from 'zod';

export const failurePayloadSchema = z.object({
  runId: z.string(),
  repo: z.string(),
  branch: z.string(),
  commit: z.string(),
  suite: z.string(),
  test: z.string(),
  specPath: z.string(),
  browser: z.string(),
  viewport: z.string(),
  domHtml: z.string(),
  consoleLogs: z.array(z.any()).default([]),
  networkLogs: z.array(z.any()).default([]),
  currentSelector: z.string(),
  selectorContext: z.object({
    domPath: z.string(),
    neighbors: z.array(z.string()),
    parentElements: z.array(z.string()),
  }),
  errorMessage: z.string().optional(),
});

export type FailurePayload = z.infer<typeof failurePayloadSchema>;
