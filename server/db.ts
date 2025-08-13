import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For demo purposes, use a default database URL if not provided
const databaseUrl = process.env.DATABASE_URL || 'postgresql://demo:demo@localhost:5432/autoheal_demo';

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
