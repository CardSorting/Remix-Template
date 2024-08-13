import React from 'react';
import { Outlet, Link, useLoaderData, Form } from "@remix-run/react";
import { json, type LoaderFunction, redirect } from "@remix-run/node";
import { Auth0Service, type Auth0User } from '../services/Auth0Service';
import { env } from '~/env.server';

// Ensure required environment variables are set
if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET || !process.env.AUTH0_AUDIENCE || !process.env.AUTH0_CALLBACK_URL || !process.env.AUTH0_LOGOUT_RETURN_TO || !process.env.SESSION_SECRET) {
  throw new Error("Missing AUTH0 environment variables");
}

// Initialize the Auth0 service
const auth0 = new Auth0Service(
  process.env.AUTH0_DOMAIN,
  process.env.AUTH0_CLIENT_ID,
  process.env.AUTH0_CLIENT_SECRET,
  process.env.AUTH0_AUDIENCE,
  process.env.AUTH0_CALLBACK_URL,
  process.env.AUTH0_LOGOUT_RETURN_TO,
  process.env.SESSION_SECRET
);

interface LoaderData {
  user: Auth0User;
}

// Loader function to authenticate user and check admin privileges
export const loader: LoaderFunction = async ({ request }) => {
  const userAndAdminStatus = await auth0.getUserAndAdminStatus(request);

  if (!userAndAdminStatus || !userAndAdminStatus.isAdmin) {
    return redirect("/login");
  }

  return json<LoaderData>({ user: userAndAdminStatus.user });
};

// Main layout for the admin dashboard
export default function AdminLayout() {
  const { user } = useLoaderData<LoaderData>();

  return (
    <div className="admin-layout">
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span>Welcome, {user.name || user.email}</span>
            <Form action="/logout" method="post">
              <button type="submit" className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
                Logout
              </button>
            </Form>
          </div>
        </div>
      </header>

      <div className="container mx-auto mt-8 flex">
        <nav className="w-1/4 pr-8">
          <ul className="space-y-2">
            <li>
              <Link to="/admin" className="block p-2 hover:bg-gray-100 rounded">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin/users" className="block p-2 hover:bg-gray-100 rounded">
                Manage Users
              </Link>
            </li>
            <li>
              <Link to="/admin/products" className="block p-2 hover:bg-gray-100 rounded">
                Manage Products
              </Link>
            </li>
            <li>
              <Link to="/admin/sources" className="block p-2 hover:bg-gray-100 rounded">
                Manage Sources
              </Link>
            </li>
          </ul>
        </nav>

        <main className="w-3/4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Error boundary for handling unexpected errors in the admin dashboard
export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="error-container">
      <h1>Error</h1>
      <p>An unexpected error occurred in the admin dashboard. Please try again later.</p>
    </div>
  );
}

// Catch boundary for handling unauthorized access
export function CatchBoundary() {
  return (
    <div className="error-container">
      <h1>Access Denied</h1>
      <p>You do not have permission to access the admin dashboard.</p>
      <Link to="/" className="text-blue-500 hover:underline">
        Return to Home
      </Link>
    </div>
  );
}