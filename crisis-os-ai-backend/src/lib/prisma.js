import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma;

export function getPrisma() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    const error = new Error(
      "DATABASE_URL is required to use database-backed API routes."
    );
    error.statusCode = 500;
    error.publicMessage = "Backend database is not configured.";
    throw error;
  }

  if (!prisma) {
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
  }

  return prisma;
}