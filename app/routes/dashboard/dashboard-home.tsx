import { json, LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Auth0Service, Auth0User } from '~/services/Auth0Service'; // Ensure Auth0User is imported
import { db as prisma } from '~/utils/db.server';

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET || !process.env.AUTH0_AUDIENCE || !process.env.AUTH0_CALLBACK_URL || !process.env.AUTH0_LOGOUT_RETURN_TO || !process.env.SESSION_SECRET) {
  throw new Error("Missing AUTH0 environment variables");
}

const auth0 = new Auth0Service(
  process.env.AUTH0_DOMAIN!,
  process.env.AUTH0_CLIENT_ID!,
  process.env.AUTH0_CLIENT_SECRET!,
  process.env.AUTH0_AUDIENCE!,
  process.env.AUTH0_CALLBACK_URL!,
  process.env.AUTH0_LOGOUT_RETURN_TO!,
  process.env.SESSION_SECRET!
);

type LoaderData = {
  user: Auth0User;
  productCount: number;
  sourceCount: number;
  recentProducts: Array<{ id: number; name: string; link: string }>;
  recentSources: Array<{ id: number; name: string; url: string }>;
};

// Helper function to safely convert Auth0 sub to a number
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

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const userResult = await auth0.getUserAndAdminStatus(request);
    if (!userResult) {
      return redirect("/unauthorized");
    }

    const { user } = userResult;
    const userId = getNumericUserId(user.sub);

    const [productCount, sourceCount, recentProducts, recentSources] = await Promise.all([
      prisma.product.count({ where: { userId } }),
      prisma.source.count({ where: { userId } }),
      prisma.product.findMany({
        where: { userId },
        select: { id: true, name: true, link: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.source.findMany({
        where: { userId },
        select: { id: true, name: true, url: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    return json<LoaderData>({ 
      user, 
      productCount, 
      sourceCount, 
      recentProducts, 
      recentSources 
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    throw new Response("Internal Server Error", { status: 500 });
  }
};

export default function DashboardHome() {
  const { user, productCount, sourceCount, recentProducts, recentSources } = useLoaderData<LoaderData>();

  return (
    <div className="dashboard-home">
      <h2 className="text-2xl font-bold mb-6">Welcome, {user.name || user.email}</h2>
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Products</h3>
          <p className="text-3xl font-bold">{productCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Sources</h3>
          <p className="text-3xl font-bold">{sourceCount}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Recent Products</h3>
          <ul className="bg-white rounded-lg shadow divide-y">
            {recentProducts.map(product => (
              <li key={product.id} className="p-4">
                <h4 className="font-medium">{product.name}</h4>
                <a href={product.link} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                  {product.link}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Recent Sources</h3>
          <ul className="bg-white rounded-lg shadow divide-y">
            {recentSources.map(source => (
              <li key={source.id} className="p-4">
                <h4 className="font-medium">{source.name}</h4>
                <a href={source.url} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                  {source.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="error-container">
      <h1>Error</h1>
      <p>Sorry, an unexpected error occurred loading the dashboard.</p>
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