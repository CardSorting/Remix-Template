import { json, LoaderFunction, redirect } from "@remix-run/node"; // Make sure redirect is imported
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { Auth0Service } from '~/services/Auth0Service';
import { db } from '~/utils/db.server';
import { Source, Product } from '@prisma/client';

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET || !process.env.AUTH0_AUDIENCE || !process.env.AUTH0_CALLBACK_URL || !process.env.AUTH0_LOGOUT_RETURN_TO || !process.env.SESSION_SECRET) {
  throw new Error("Missing AUTH0 environment variables");
}

const auth0 = new Auth0Service(
  process.env.AUTH0_DOMAIN,
  process.env.AUTH0_CLIENT_ID,
  process.env.AUTH0_CLIENT_SECRET,
  process.env.AUTH0_AUDIENCE,
  process.env.AUTH0_CALLBACK_URL,
  process.env.AUTH0_LOGOUT_RETURN_TO,
  process.env.SESSION_SECRET
);

interface SourceWithProduct extends Omit<Source, 'createdAt' | 'updatedAt'> {
  product: Pick<Product, 'name'> | null;
  createdAt: string;
  updatedAt: string;
}

interface LoaderData {
  sources: SourceWithProduct[];
  totalPages: number;
  currentPage: number;
}

function getNumericUserId(sub: string): number {
  const numericPart = sub.split('|').pop();
  if (!numericPart) {
    throw new Error('Invalid user ID format');
  }
  const numericId = parseInt(numericPart, 10);
  if (isNaN(numericId)) {
    throw new Error('User ID is not a valid number');
  }
  return numericId;
}

async function getSourcesForUser(userId: number, page: number, limit: number): Promise<SourceWithProduct[]> {
  const sources = await db.source.findMany({
    where: { userId },
    include: {
      product: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return sources.map(source => ({
    ...source,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  }));
}

async function getTotalSourcesCount(userId: number): Promise<number> {
  return db.source.count({ where: { userId } });
}

export const loader: LoaderFunction = async ({ request }): Promise<Response> => {
  try {
    const userResult = await auth0.getUserAndAdminStatus(request);
    if (!userResult) {
      return redirect("/unauthorized");
    }

    const userId = getNumericUserId(userResult.user.sub);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = 10;

    const [sources, totalSources] = await Promise.all([
      getSourcesForUser(userId, page, limit),
      getTotalSourcesCount(userId)
    ]);

    const totalPages = Math.ceil(totalSources / limit);

    return json<LoaderData>({
      sources,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    throw new Response("Internal Server Error", { status: 500 });
  }
};

export default function DashboardSourcesList() {
  const { sources, totalPages, currentPage } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();

  return (
    <div className="dashboard-sources-list">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Sources</h2>
        <Link to="/dashboard/sources/new" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Add New Source
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
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
                <td className="px-6 py-4 whitespace-nowrap">{source.product?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(source.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/dashboard/sources/${source.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                    Edit
                  </Link>
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
                to={`/dashboard/sources/dashboard-sources-list?${new URLSearchParams({
                  ...Object.fromEntries(searchParams),
                  page: page.toString(),
                })}`}
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
      <p>Sorry, an unexpected error occurred while loading the sources list.</p>
    </div>
  );
}

export function CatchBoundary() {
  return (
    <div className="error-container">
      <h1>Unauthorized</h1>
      <p>You must be logged in to view this page.</p>
    </div>
  );
}