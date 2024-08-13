import React from 'react';
import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Link } from "react-router-dom";
import { Auth0Service } from '../../services/Auth0Service';
import { db } from '../../utils/db.server';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';

interface UserWithCounts extends Omit<Prisma.UserGetPayload<{ include: { products: true; sources: true } }>, 'createdAt'> {
  createdAt: string;
  productCount: number;
  sourceCount: number;
}

interface LoaderData {
  users: UserWithCounts[];
  totalPages: number;
  currentPage: number;
}

const auth0Service = new Auth0Service(
  process.env.AUTH0_DOMAIN!,
  process.env.AUTH0_CLIENT_ID!,
  process.env.AUTH0_CLIENT_SECRET!,
  process.env.AUTH0_AUDIENCE!,
  process.env.AUTH0_CALLBACK_URL!,
  process.env.AUTH0_LOGOUT_RETURN_TO!,
  process.env.SESSION_SECRET!
);

type UserWithNestedData = User & {
  products: { id: number, name: string, link: string, userId: number, createdAt: Date, updatedAt: Date }[];
  sources: { id: number, name: string, url: string, productId: number | null, userId: number, createdAt: Date, updatedAt: Date }[];
};

async function getUsersWithCounts(page: number, limit: number, search: string): Promise<UserWithCounts[]> {
  const where = search
    ? {
        OR: [{ email: { contains: search } }, { name: { contains: search } }],
      }
    : {};

  const users: UserWithNestedData[] = await db.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      password: true,
      deletedAt: true,
      products: {
        select: {
          id: true,
          name: true,
          link: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      sources: {
        select: {
          id: true,
          name: true,
          url: true,
          productId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    productCount: user.products.length,
    sourceCount: user.sources.length,
  }));
}

async function getTotalUserCount(search: string): Promise<number> {
  const where = search
    ? {
        OR: [{ email: { contains: search } }, { name: { contains: search } }],
      }
    : {};

  return db.user.count({ where });
}

export const loader: LoaderFunction = async ({ request }) => {
  const userStatus = await auth0Service.getUserAndAdminStatus(request);
  if (!userStatus || !userStatus.isAdmin) {
    return redirect('/unauthorized');
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const search = url.searchParams.get("search") || "";
  const limit = 10;

  try {
    const [users, totalUsers] = await Promise.all([
      getUsersWithCounts(page, limit, search),
      getTotalUserCount(search),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);
    return json<LoaderData>({ users, totalPages, currentPage: page });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Response("Internal Server Error", { status: 500 });
  }
};

export default function AdminUsersList() {
  const { users, totalPages, currentPage } = useLoaderData<LoaderData>();

  return (
    <div className="admin-users-list">
      <h2 className="text-2xl font-bold mb-6">Users List</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">{user.name || user.email}</h3>
            <p>Products: {user.productCount}</p>
            <p>Sources: {user.sourceCount}</p>
            <p>Created At: {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <Link key={page} to={`?page=${page}`} className={`px-3 py-1 rounded ${page === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
            {page}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Error boundary for handling unexpected errors
export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="error-container">
      <h1>Error</h1>
      <p>Sorry, an unexpected error occurred while loading the users list.</p>
    </div>
  );
}

// Catch boundary for handling access denied or other user not found cases
export function CatchBoundary() {
  return (
    <div className="error-container">
      <h1>Access Denied</h1>
      <p>You do not have permission to view the users list.</p>
      <Link to="/admin" className="text-blue-500 hover:underline">Back to Admin Dashboard</Link>
    </div>
  );
}