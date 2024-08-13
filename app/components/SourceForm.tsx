import React from 'react';
import { Form, useActionData, useTransition } from '@remix-run/react';
import { Product } from '~/types';

interface SourceFormProps {
  source?: {
    id: string;
    url: string;
    productId: string;
  };
  products: Product[];
}

export default function SourceForm({ source, products }: SourceFormProps) {
  const actionData = useActionData();
  const transition = useTransition();
  const isSubmitting = transition.state === 'submitting';

  return (
    <Form method="post" className="space-y-6">
      {source && <input type="hidden" name="id" value={source.id} />}
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          Source URL
        </label>
        <div className="mt-1">
          <input
            type="url"
            name="url"
            id="url"
            defaultValue={source?.url}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        {actionData?.errors?.url && (
          <p className="mt-2 text-sm text-red-600" id="url-error">
            {actionData.errors.url}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
          Associated Product
        </label>
        <div className="mt-1">
          <select
            id="productId"
            name="productId"
            defaultValue={source?.productId}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        {actionData?.errors?.productId && (
          <p className="mt-2 text-sm text-red-600" id="productId-error">
            {actionData.errors.productId}
          </p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isSubmitting ? 'Saving...' : source ? 'Update Source' : 'Create Source'}
        </button>
      </div>
    </Form>
  );
}