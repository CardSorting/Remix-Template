import React from 'react';
import { Link, useFetcher } from '@remix-run/react';
import { Source } from '~/types';

interface SourceListProps {
  sources: Source[];
}

export default function SourceList({ sources }: SourceListProps) {
  const fetcher = useFetcher();

  const handleDelete = (sourceId: string) => {
    if (window.confirm('Are you sure you want to delete this source?')) {
      fetcher.submit(
        { id: sourceId },
        { method: 'delete', action: `/dashboard/sources/${sourceId}/delete` }
      );
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {sources.map((source) => (
          <li key={source.id}>
            <div className="px-4 py-4 flex items-center sm:px-6">
              <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="truncate">
                  <div className="flex text-sm">
                    <p className="font-medium text-indigo-600 truncate">{source.url}</p>
                  </div>
                  <div className="mt-2 flex">
                    <div className="flex items-center text-sm text-gray-500">
                      <p>Associated Product: {source.product.name}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-5 flex-shrink-0 flex space-x-2">
                <Link
                  to={`/dashboard/sources/${source.id}`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(source.id)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}