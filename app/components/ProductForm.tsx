import React from 'react';
import { Form, useActionData, useTransition } from '@remix-run/react';

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    description: string;
    shopifyUrl: string;
  };
}

export default function ProductForm({ product }: ProductFormProps) {
  const actionData = useActionData();
  const transition = useTransition();
  const isSubmitting = transition.state === 'submitting';

  return (
    <Form method="post" className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Product Name
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="name"
            id="name"
            defaultValue={product?.name}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        {actionData?.errors?.name && (
          <p className="mt-2 text-sm text-red-600" id="name-error">
            {actionData.errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
          />
        </div>
        {actionData?.errors?.description && (
          <p className="mt-2 text-sm text-red-600" id="description-error">
            {actionData.errors.description}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="shopifyUrl" className="block text-sm font-medium text-gray-700">
          Shopify URL
        </label>
        <div className="mt-1">
          <input
            type="url"
            name="shopifyUrl"
            id="shopifyUrl"
            defaultValue={product?.shopifyUrl}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        {actionData?.errors?.shopifyUrl && (
          <p className="mt-2 text-sm text-red-600" id="shopifyUrl-error">
            {actionData.errors.shopifyUrl}
          </p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </Form>
  );
}