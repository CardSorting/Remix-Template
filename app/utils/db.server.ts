import { PrismaClient } from '@prisma/client';

// Declare a global interface that works for both Node.js and browser environments
declare global {
  var __db: PrismaClient | undefined;
}

// Function to initialize the PrismaClient instance with a clear purpose
function initializePrismaClient(): PrismaClient {
  const prisma = new PrismaClient();
  prisma.$connect().catch((error) => {
    console.error('Failed to connect to the database:', error);
    throw error;
  });
  return prisma;
}

// Use a singleton pattern to ensure a single instance of PrismaClient is used
const db: PrismaClient = (() => {
  if (process.env.NODE_ENV === 'production') {
    // In production, always create a new PrismaClient instance
    return initializePrismaClient();
  } else {
    // In development, reuse the existing PrismaClient instance if available
    if (!global.__db) {
      global.__db = initializePrismaClient();
    }
    return global.__db;
  }
})();

export { db };