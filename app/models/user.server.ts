// Import necessary modules
import { Auth0Service } from '../services/Auth0Service';
import { db } from '../utils/db.server';
import { Prisma, User as PrismaUser } from '@prisma/client';

// Define User type based on your database schema
export type User = PrismaUser;

// Define Auth0User type
type Auth0User = {
  sub: string;
  email?: string;
  // Add other Auth0 user properties as needed
};

// Initialize Auth0Service with environment variables
const auth0Service = new Auth0Service(
  process.env.AUTH0_DOMAIN!,
  process.env.AUTH0_CLIENT_ID!,
  process.env.AUTH0_CLIENT_SECRET!,
  process.env.AUTH0_AUDIENCE!
);

// Fetch a user by their unique ID from the database
export async function getUserById(id: User["id"]): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

// Fetch a user by their email from the database
export async function getUserByEmail(email: User["email"]): Promise<User | null> {
  return db.user.findUnique({ where: { email } });
}

// Update user information in the database using Auth0 for validation
export async function updateUser(
  request: Request,
  data: Partial<Pick<User, "email" | "name">>
): Promise<User> {
  const auth0User = await auth0Service.getUser(request) as Auth0User | null;
  if (!auth0User) {
    throw new Error('User not authenticated');
  }

  const dbUser = await getUserByEmail(auth0User.email!);
  if (!dbUser) {
    throw new Error('User not found in database');
  }

  return db.user.update({
    where: { id: dbUser.id },
    data,
  });
}

// Fetch all users from the database with basic information and product count
export async function getAllUsers() {
  return db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          products: true,
          sources: true,
        },
      },
    },
  });
}

// Delete a user by their email from the database using Auth0 for validation
export async function deleteUserByEmail(request: Request, email: User["email"]): Promise<User> {
  const auth0User = await auth0Service.getUser(request) as Auth0User | null;
  if (!auth0User) {
    throw new Error('User not authenticated');
  }

  if (auth0User.email !== email) {
    throw new Error('Unauthorized action');
  }

  return db.user.delete({ where: { email } });
}

// Create a new user in the database
export async function createUser(userData: Prisma.UserCreateInput): Promise<User> {
  return db.user.create({
    data: userData,
  });
}

// Fetch user with their products and sources
export async function getUserWithRelations(id: User["id"]) {
  return db.user.findUnique({
    where: { id },
    include: {
      products: true,
      sources: true,
    },
  });
}