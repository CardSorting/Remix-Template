import { db } from "../utils/db.server";
import { Auth0Service } from '~/utils/Auth0Service';
import { Prisma, Source as PrismaSource } from '@prisma/client';

// Types
export type Auth0User = {
  sub: string;
  email?: string;
  [key: string]: any;
};

export type Source = PrismaSource & {
  product?: {
    id: number;
    name: string;
    link: string;
    userId: number;
  } | null;
};

type SourceInput = {
  name: string;
  url: string;
  productId?: number | null;
};

// Auth0 service initialization
const auth0Service = new Auth0Service(
  process.env.AUTH0_DOMAIN!,
  process.env.AUTH0_CLIENT_ID!,
  process.env.AUTH0_CLIENT_SECRET!,
  process.env.AUTH0_AUDIENCE
);

// Helper function to get authenticated user
async function getAuthenticatedUser(request: Request): Promise<number> {
  const auth0User = await auth0Service.getUser(request);
  if (!auth0User) {
    throw new Error('User not authenticated');
  }
  const dbUser = await db.user.findUnique({ where: { email: auth0User.email } });
  if (!dbUser) {
    throw new Error('User not found in database');
  }
  return dbUser.id;
}

// Fetch sources for the authenticated user
export async function getSources(request: Request): Promise<Source[]> {
  const userId = await getAuthenticatedUser(request);
  return db.source.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          link: true,
          userId: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Fetch a specific source for the authenticated user
export async function getSource(id: number, request: Request): Promise<Source | null> {
  const userId = await getAuthenticatedUser(request);
  return db.source.findFirst({
    where: { id, userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          link: true,
          userId: true,
        },
      },
    },
  });
}

// Create a new source for the authenticated user
export async function createSource(request: Request, { name, url, productId }: SourceInput): Promise<Source> {
  const userId = await getAuthenticatedUser(request);
  return db.source.create({
    data: {
      name,
      url,
      userId,
      productId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          link: true,
          userId: true,
        },
      },
    },
  });
}

// Update an existing source for the authenticated user
export async function updateSource(
  id: number,
  { name, url, productId }: SourceInput,
  request: Request
): Promise<Source> {
  const userId = await getAuthenticatedUser(request);
  return db.source.update({
    where: { id },
    data: {
      name,
      url,
      productId,
      userId, // Ensure the userId is included to maintain ownership
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          link: true,
          userId: true,
        },
      },
    },
  });
}

// Delete a source for the authenticated user
export async function deleteSource(id: number, request: Request): Promise<Source> {
  const userId = await getAuthenticatedUser(request);
  return db.source.delete({
    where: { id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          link: true,
          userId: true,
        },
      },
    },
  });
}