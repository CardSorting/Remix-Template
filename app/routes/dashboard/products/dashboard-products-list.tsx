import React from 'react';
import { json, LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { Auth0Service } from '../../../services/Auth0Service';
import { db } from '../../../utils/db.server';
import { env } from '~/env.server';

interface ProductWithDetails {
  id: number;
  name: string;
  link?: string | null;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
}

interface LoaderData {
  products: ProductWithDetails[];
  isAdmin: boolean;
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

async function getProductsForUser(userId: number): Promise<ProductWithDetails[]> {
  const products = await db.product.findMany({
    where: { userId },
    include: {
      user: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map(product => ({
    id: product.id,
    name: product.name,
    link: product.link,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    userEmail: product.user.email,
  }));
}

export const loader: LoaderFunction = async ({ request }) => {
  try {
    // Ensure the user is authenticated and retrieve user and admin status
    const userResult = await auth0Service.getUserAndAdminStatus(request);
    if (!userResult) {
      return redirect("/unauthorized");
    }

    const userId = parseInt(userResult.user.sub, 10);
    const products = await getProductsForUser(userId);

    return json<LoaderData>({ products, isAdmin: userResult.isAdmin });
  } catch (error) {
    console.error('Error in loader function:', error);
    return redirect('/login');
  }
};

export default function DashboardProductsList() {
  const { products, isAdmin } = useLoaderData<LoaderData>();

  return (
    <div className="dashboard-products-list">
      <h2 className="text-2xl font-bold mb-6">Your Products</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.link ? (
                    <a href={product.link} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                      {product.link}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(product.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(product.updatedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a href={`/products/${product.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Edit
                  </a>
                  {isAdmin && (
                    <Form method="post" action={`/products/${product.id}/delete`} style={{ display: 'inline' }}>
                      <button
                        type="submit"
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </Form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}