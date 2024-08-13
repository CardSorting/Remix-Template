import React from 'react';
import { Outlet, Link, useLoaderData, Form } from "@remix-run/react";
import { json, type LoaderFunction, redirect } from "@remix-run/node";
import { Auth0Service, type Auth0User } from '../services/Auth0Service';
import { env } from '~/env.server';

// Ensure required environment variables are present
if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET || !process.env.AUTH0_AUDIENCE || !process.env.AUTH0_CALLBACK_URL || !process.env.AUTH0_LOGOUT_RETURN_TO || !process.env.SESSION_SECRET) {
  throw new Error("Missing AUTH0 environment variables");
}

// Initialize Auth0 service
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

// Loader function to authenticate the user
export const loader: LoaderFunction = async ({ request }) => {
  const user = await auth0.getUser(request);
  if (!user) {
    return redirect("/login");
  }
  return json<LoaderData>({ user });
};

// Main layout for the dashboard
export default function DashboardLayout() {
  const { user } = useLoaderData<LoaderData>();

  return (
    <div className="dashboard-layout">
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
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
              <Link to="/dashboard" className="block p-2 hover:bg-gray-100 rounded">
                Dashboard Home
              </Link>
            </li>
            <li>
              <Link to="/dashboard/products/dashboard-products-list" className="block p-2 hover:bg-gray-100 rounded">
                Products
              </Link>
            </li>
            <li>
              <Link to="/dashboard/sources/dashboard-sources-list" className="block p-2 hover:bg-gray-100 rounded">
                Sources
              </Link>
            </li>
            {user.email === "admin@example.com" && (
              <li>
                <Link to="/admin/admin-home" className="block p-2 hover:bg-gray-100 rounded">
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <main className="w-3/4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Error boundary for handling unexpected errors in the dashboard
export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="error-container">
      <h1>Error</h1>
      <p>Sorry, an unexpected error occurred in the dashboard.</p>
    </div>
  );
}

// Catch boundary for handling general errors
export function CatchBoundary() {
  return (
    <div className="error-container">
      <h1>Oops!</h1>
      <p>Something went wrong. Please try again later or contact support if the problem persists.</p>
    </div>
  );
}