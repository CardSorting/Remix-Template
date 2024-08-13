import React from 'react';
import { Link, useLoaderData, Form, useNavigate } from "@remix-run/react";
import { json, LoaderFunction, MetaFunction, redirect } from "@remix-run/node";
import { Auth0Service } from '../../../services/Auth0Service';
import { db } from '../../../utils/db.server';
import { env } from '~/env.server';
import type { Product, Source } from '@prisma/client';

interface LoaderData {
  product: Product & { sources: Source[], user: { email: string } };
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

export const loader: LoaderFunction = async ({ request, params }) => {
  const userResult = await auth0Service.getUserAndAdminStatus(request);
  if (!userResult) {
    return redirect('/login');
  }

  const productId = Number(params.id);
  if (isNaN(productId)) {
    throw new Response('Invalid product ID', { status: 400 });
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      sources: true,
      user: { select: { email: true } },
    },
  });

  if (!product) {
    throw new Response('Product not found', { status: 404 });
  }

  const isAdmin = userResult.isAdmin || product.user.email === userResult.user.email;
  return json<LoaderData>({ product, isAdmin });
};

export const meta: MetaFunction = ({ data }: { data?: unknown }) => {
  const loaderData = data as LoaderData | undefined;

  return [
    {
      title: loaderData ? `Product Details - ${loaderData.product.name}` : 'Product Details',
      description: loaderData ? `Details of ${loaderData.product.name}` : 'Details of the product',
    }
  ];
};

export default function ProductDetails() {
  const { product, isAdmin } = useLoaderData<LoaderData>();
  const navigate = useNavigate();

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`/admin/products/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: product.id }),
      });

      if (response.ok) {
        navigate("/dashboard");
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to delete product: ${errorText}`);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred while trying to delete the product. Please try again.");
    }
  };

  return (
    <div className="product-details">
      <h2 className="text-2xl font-bold">Product Details</h2>
      <div className="product-info">
        <p><strong>Name:</strong> {product.name}</p>
        <p><strong>Link:</strong> {product.link ? <a href={product.link} target="_blank" rel="noopener noreferrer">{product.link}</a> : 'No link available'}</p>
        <p><strong>User:</strong> {product.user.email}</p>
        <p><strong>Created At:</strong> {new Date(product.createdAt).toLocaleDateString()}</p>
        <p><strong>Updated At:</strong> {new Date(product.updatedAt).toLocaleDateString()}</p>
      </div>

      {isAdmin && (
        <div className="mt-4">
          <Form method="post" onSubmit={handleDelete} className="inline-block">
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-md">
              Delete Product
            </button>
          </Form>
        </div>
      )}

      <h3 className="text-xl font-semibold mt-8">Sources</h3>
      <ul>
        {product.sources.map((source) => (
          <li key={source.id} className="mb-4">
            <p><strong>Name:</strong> {source.name}</p>
            <p><strong>URL:</strong> <a href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a></p>
            <p><strong>Created At:</strong> {new Date(source.createdAt).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>

      <Link to="/dashboard" className="text-blue-500 hover:underline mt-4 block">
        Back to Dashboard
      </Link>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="error-container">
      <h1>Error</h1>
      <p>Something went wrong while fetching the product details.</p>
    </div>
  );
}

export function CatchBoundary() {
  return (
    <div className="error-container">
      <h1>Product Not Found</h1>
      <p>The product you're looking for does not exist.</p>
      <Link to="/dashboard" className="text-blue-500 hover:underline">
        Back to Dashboard
      </Link>
    </div>
  );
}