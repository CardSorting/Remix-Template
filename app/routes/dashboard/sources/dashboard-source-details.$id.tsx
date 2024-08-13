import { json, LoaderFunction, ActionFunction, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link } from "@remix-run/react";
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

interface LoaderData {
  source: SourceWithProduct;
}

interface SourceWithProduct extends Omit<Source, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
  product: Pick<Product, 'id' | 'name'> | null;
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

export const loader: LoaderFunction = async ({ request, params }): Promise<Response> => {
  try {
    const userResult = await auth0.getUserAndAdminStatus(request);
    if (!userResult) {
      return redirect("/unauthorized");
    }

    const userId = getNumericUserId(userResult.user.sub);

    const sourceId = parseInt(params.id!, 10);
    if (isNaN(sourceId)) {
      throw new Response("Invalid Source ID", { status: 400 });
    }

    const source = await db.source.findUnique({
      where: { id: sourceId },
      include: { product: { select: { id: true, name: true } } },
    });

    if (!source || source.userId !== userId) {
      throw new Response("Source not found", { status: 404 });
    }

    return json<LoaderData>({
      source: {
        ...source,
        createdAt: source.createdAt.toISOString(),
        updatedAt: source.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in loader function:', error);
    return redirect('/login');
  }
};

interface ActionData {
  errors?: {
    name?: string;
    url?: string;
  };
}

export const action: ActionFunction = async ({ request, params }): Promise<Response> => {
  try {
    const userResult = await auth0.getUserAndAdminStatus(request);
    if (!userResult) {
      return redirect("/unauthorized");
    }

    const sourceId = parseInt(params.id!, 10);
    if (isNaN(sourceId)) {
      throw new Response("Invalid Source ID", { status: 400 });
    }

    const formData = await request.formData();
    const name = formData.get("name");
    const url = formData.get("url");

    if (typeof name !== "string" || name.length === 0) {
      return json<ActionData>({ errors: { name: "Name is required" } }, { status: 400 });
    }

    if (typeof url !== "string" || url.length === 0) {
      return json<ActionData>({ errors: { url: "URL is required" } }, { status: 400 });
    }

    await db.source.update({
      where: { id: sourceId },
      data: { name, url },
    });

    return redirect("/dashboard/sources/dashboard-sources-list");
  } catch (error) {
    console.error("Failed to update source:", error);
    return json<ActionData>({ errors: { name: "Failed to update source" } }, { status: 500 });
  }
};

export default function DashboardSourceDetails() {
  const { source } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  return (
    <div className="dashboard-source-details">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Source Details</h2>
        <Link to="/dashboard/sources/dashboard-sources-list" className="text-blue-500 hover:underline">
          Back to Sources
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={source.name}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {actionData?.errors?.name && (
              <p className="mt-2 text-sm text-red-600">{actionData.errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
            <input
              type="url"
              id="url"
              name="url"
              defaultValue={source.url}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {actionData?.errors?.url && (
              <p className="mt-2 text-sm text-red-600">{actionData.errors.url}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Associated Product</label>
            <p className="mt-1 text-sm text-gray-500">
              {source.product ? source.product.name : 'No associated product'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Created At</label>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(source.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Updated</label>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(source.updatedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Update Source
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="error-container">
      <h1>Error</h1>
      <p>Sorry, an unexpected error occurred while loading the source details.</p>
    </div>
  );
}

export function CatchBoundary() {
  return (
    <div className="error-container">
      <h1>Source Not Found</h1>
      <p>The requested source does not exist or you don't have permission to view it.</p>
      <Link to="/dashboard/sources/dashboard-sources-list" className="text-blue-500 hover:underline">
        Back to Sources List
      </Link>
    </div>
  );
}