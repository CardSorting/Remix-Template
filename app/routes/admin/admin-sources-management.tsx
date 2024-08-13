import React from 'react';
import { json, type LoaderFunction, type ActionFunction, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import { Auth0Service, Auth0User } from '../../services/Auth0Service';
import { db } from '../../utils/db.server';
import type { Source } from '@prisma/client';
import { env } from '~/env.server';

interface SourceWithDetails extends Omit<Source, 'createdAt' | 'updatedAt'> {
  userEmail: string;
  productName?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LoaderData {
  sources: SourceWithDetails[];
  totalPages: number;
  currentPage: number;
}

interface ActionData {
  errors?: {
    general?: string;
  };
}

const auth0Service = new Auth0Service(
  env.AUTH0_DOMAIN,
  env.AUTH0_CLIENT_ID,
  env.AUTH0_CLIENT_SECRET,
  env.AUTH0_AUDIENCE,
  env.AUTH0_CALLBACK_URL,
  env.AUTH0_LOGOUT_RETURN_TO,
  env.SESSION_SECRET
);

async function getSourcesWithDetails(page: number, limit: number): Promise<SourceWithDetails[]> {
  const sources = await db.source.findMany({
    include: {
      user: { select: { email: true } },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return sources.map(source => ({
    ...source,
    userEmail: source.user.email,
    productName: source.product?.name || null,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  }));
}

async function getTotalSourceCount(): Promise<number> {
  return db.source.count();
}

async function deleteSource(sourceId: Source['id']): Promise<void> {
  await db.source.delete({ where: { id: sourceId } });
}

export const loader: LoaderFunction = async ({ request }) => {
  const userResult = await auth0Service.getUserAndAdminStatus(request);
  if (!userResult || !userResult.isAdmin) {
    throw new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 10;

  try {
    const [sources, totalSources] = await Promise.all([
      getSourcesWithDetails(page, limit),
      getTotalSourceCount(),
    ]);

    const totalPages = Math.ceil(totalSources / limit);
    return json<LoaderData>({ sources, totalPages, currentPage: page });
  } catch (error) {
    console.error('Error fetching sources:', error);
    throw new Response("Internal Server Error", { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  const userResult = await auth0Service.getUserAndAdminStatus(request);
  if (!userResult || !userResult.isAdmin) {
    throw new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "delete") {
    const sourceId = parseInt(formData.get("sourceId") as string, 10);
    if (isNaN(sourceId)) {
      return json<ActionData>({ errors: { general: "Invalid source ID" } }, { status: 400 });
    }

    try {
      await deleteSource(sourceId);
      return redirect("/admin/admin-sources-management");
    } catch (error) {
      console.error("Failed to delete source:", error);
      return json<ActionData>({ errors: { general: "Failed to delete source" } }, { status: 500 });
    }
  }

  return json<ActionData>({ errors: { general: "Invalid action" } }, { status: 400 });
};

export default function AdminSourcesManagement() {
  const { sources, totalPages, currentPage } = useLoaderData<LoaderData>();

  return (
    <div className="admin-sources-management">
      <h2 className="text-2xl font-bold mb-6">Manage Sources</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sources.map((source) => (
              <tr key={source.id}>
                <td className="px-6 py-4 whitespace-nowrap">{source.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a href={source.url} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    {source.url}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{source.userEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap">{source.productName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(source.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/admin/sources/${source.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Edit
                  </Link>
                  <Form method="post" style={{ display: 'inline' }}>
                    <input type="hidden" name="sourceId" value={source.id} />
                    <button
                      type="submit"
                      name="_action"
                      value="delete"
                      className="text-red-600 hover:text-red-900"
                      onClick={(e) => {
                        if (!confirm("Are you sure you want to delete this source?")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                to={`/admin/admin-sources-management?page=${page}`}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="error-container">
      <h1>Error</h1>
      <p>Sorry, an unexpected error occurred while managing sources.</p>
    </div>
  );
}

export function CatchBoundary() {
  return (
    <div className="error-container">
      <h1>Access Denied</h1>
      <p>You do not have permission to manage sources.</p>
      <Link to="/dashboard" className="text-blue-500 hover:underline">
        Return to Dashboard
      </Link>
    </div>
  );
}