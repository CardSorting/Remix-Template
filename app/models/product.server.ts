import { db } from "~/utils/db.server";
import { Auth0Service } from '~/utils/Auth0Service';
import { Prisma, Product as PrismaProduct } from '@prisma/client';

// Define types based on your actual database schema
export type Product = PrismaProduct;

export type ProductInput = {
  name: string;
  link: string;
};

type Auth0User = {
  sub: string;
  email?: string;
  // Add other Auth0 user properties as needed
};

const auth0Service = new Auth0Service(
  process.env.AUTH0_DOMAIN!,
  process.env.AUTH0_CLIENT_ID!,
  process.env.AUTH0_CLIENT_SECRET!,
  process.env.AUTH0_AUDIENCE
);

// Helper function to get authenticated user
async function getAuthenticatedUser(request: Request): Promise<Auth0User> {
  const auth0User = await auth0Service.getUser(request);
  if (!auth0User) {
    throw new Error('User not authenticated');
  }
  return auth0User as Auth0User;
}

// Helper function to get database user ID from Auth0 user
async function getDbUserId(auth0User: Auth0User): Promise<number> {
  const dbUser = await db.user.findUnique({ where: { email: auth0User.email } });
  if (!dbUser) {
    throw new Error('User not found in database');
  }
  return dbUser.id;
}

// Fetch products for the authenticated user
export async function getProducts(request: Request): Promise<Product[]> {
  const auth0User = await getAuthenticatedUser(request);
  const userId = await getDbUserId(auth0User);
  return db.product.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { sources: true }
  });
}

// Fetch a specific product for the authenticated user
export async function getProduct(id: number, request: Request): Promise<Product | null> {
  const auth0User = await getAuthenticatedUser(request);
  const userId = await getDbUserId(auth0User);
  return db.product.findFirst({
    where: { 
      id,
      userId
    },
    include: { sources: true }
  });
}

// Create a new product for the authenticated user
export async function createProduct(
  request: Request, 
  { name, link }: ProductInput
): Promise<Product> {
  const auth0User = await getAuthenticatedUser(request);
  const userId = await getDbUserId(auth0User);
  return db.product.create({
    data: {
      name,
      link,
      userId,
    },
    include: { sources: true }
  });
}

// Update an existing product for the authenticated user
export async function updateProduct(
  id: number,
  { name, link }: ProductInput,
  request: Request
): Promise<Product | null> {
  const auth0User = await getAuthenticatedUser(request);
  const userId = await getDbUserId(auth0User);

  return db.product.update({
    where: { id },
    data: {
      name,
      link,
      userId, // Ensure the userId is included to maintain ownership
    },
    include: { sources: true }
  });
}

// Delete a product for the authenticated user
export async function deleteProduct(id: number, request: Request): Promise<Product | null> {
  const auth0User = await getAuthenticatedUser(request);
  const userId = await getDbUserId(auth0User);

  return db.product.delete({
    where: { 
      id,
      userId, // Ensure only the owner can delete the product
    },
    include: { sources: true }
  });
}