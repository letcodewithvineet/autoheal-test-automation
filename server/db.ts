import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use the Replit provided database URL
const databaseUrl = process.env.DATABASE_URL;

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
