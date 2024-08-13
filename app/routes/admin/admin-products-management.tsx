import React from 'react';
import { json, type LoaderFunction, type ActionFunction, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link, useNavigation } from "@remix-run/react";
import { Auth0Service, Auth0User } from '../../services/Auth0Service';
import { db } from '../../utils/db.server';
import type { Product } from '@prisma/client';
import { env } from '~/env.server';

type ProductId = Product['id'];

interface ProductWithDetails extends Omit<Product, 'createdAt' | 'updatedAt'> {
  userEmail: string;
  sourceCount: number;
  createdAt: string;
  updatedAt: string;
}

interface LoaderData {
  products: ProductWithDetails[];
  totalPages: number;
  currentPage: number;
}

interface ActionData {
  errors?: {
    name?: string;
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

async function getProductsWithDetails(page: number, limit: number): Promise<ProductWithDetails[]> {
  const products = await db.product.findMany({
    include: {
      user: { select: { email: true } },
      sources: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return products.map(product => ({
    ...product,
    userEmail: product.user.email,
    sourceCount: product.sources.length,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));
}

async function getTotalProductCount(): Promise<number> {
  return db.product.count();
}

async function deleteProduct(productId: ProductId): Promise<void> {
  await db.product.delete({ where: { id: productId } });
}

export const loader: LoaderFunction = async ({ request }): Promise<Response> => {
  const userResult = await auth0Service.getUserAndAdminStatus(request);
  if (!userResult || !userResult.isAdmin) {
    throw new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 10;

  try {
    const [products, totalProducts] = await Promise.all([
      getProductsWithDetails(page, limit),
      getTotalProductCount(),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    return json<LoaderData>({ products, totalPages, currentPage: page });
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Response("Internal Server Error", { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }): Promise<Response> => {
  const userResult = await auth0Service.getUserAndAdminStatus(request);
  if (!userResult || !userResult.isAdmin) {
    throw new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "delete") {
    const productId = parseInt(formData.get("productId") as string, 10);
    if (isNaN(productId)) {
      return json<ActionData>({ errors: { name: "Invalid product ID" } }, { status: 400 });
    }

    try {
      await deleteProduct(productId);
      return redirect("/admin/admin-products-management");
    } catch (error) {
      console.error("Failed to delete product:", error);
      return json<ActionData>({ errors: { general: "Failed to delete product" } }, { status: 500 });
    }
  }

  return json<ActionData>({ errors: { general: "Invalid action" } }, { status: 400 });
};

export default function AdminProductsManagement() {
  const { products, totalPages, currentPage } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();

  return (
    <div className="admin-products-management">
      <h2 className="text-2xl font-bold mb-6">Manage Products</h2>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sources</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a href={product.link} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    {product.link}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{product.userEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.sourceCount}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(product.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/admin/products/${product.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Edit
                  </Link>
                  <Form method="post" style={{ display: 'inline' }}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      name="_action"
                      value="delete"
                      className="text-red-600 hover:text-red-900"
                      onClick={(e) => {
                        if (!confirm("Are you sure you want to delete this product?")) {
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
                to={`/admin/admin-products-management?page=${page}`}
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

      {navigation.state === "submitting" && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
          <h2 className="text-center text-white text-xl font-semibold">Loading...</h2>
          <p className="w-1/3 text-center text-white">This may take a few seconds, please don't close this page.</p>
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
      <p>Sorry, an unexpected error occurred while managing products.</p>
    </div>
  );
}

export function CatchBoundary() {
  return (
    <div className="error-container">
      <h1>Access Denied</h1>
      <p>You do not have permission to manage products.</p>
      <Link to="/dashboard" className="text-blue-500 hover:underline">
        Return to Dashboard
      </Link>
    </div>
  );
}