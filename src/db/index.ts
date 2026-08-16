import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalEnv = (typeof process !== "undefined" ? process.env : {}) as any;

export const db: any = globalEnv.DB
  ? drizzleD1(globalEnv.DB, { schema })
  : drizzlePg(
      postgres(globalEnv.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/recruitment_os", { prepare: false }),
      { schema }
    );
