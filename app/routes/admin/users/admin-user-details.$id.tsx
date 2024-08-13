import { json, type LoaderFunction, type ActionFunction, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link, useNavigation } from "@remix-run/react";
import { Auth0Service } from '../../../services/Auth0Service';
import { db } from '../../../utils/db.server';
import { Prisma, User as PrismaUser, Product, Source } from '@prisma/client';

type UserId = PrismaUser['id'];

interface UserWithDetails extends PrismaUser {
  products: Array<Pick<Product, 'id' | 'name' | 'link'>>;
  sources: Array<Pick<Source, 'id' | 'name' | 'url'>>;
}

interface LoaderData {
  user: UserWithDetails;
  isAdmin: boolean;
}

interface ActionData {
  errors?: {
    name?: string;
    email?: string;
    general?: string;
  };
}

const auth0Service = new Auth0Service(
  process.env.AUTH0_DOMAIN!,
  process.env.AUTH0_CLIENT_ID!,
  process.env.AUTH0_CLIENT_SECRET!,
  process.env.AUTH0_AUDIENCE!,
  process.env.AUTH0_CALLBACK_URL!,
  process.env.AUTH0_LOGOUT_RETURN_TO!,
  process.env.SESSION_SECRET!
);

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function getUserWithDetails(userId: UserId): Promise<UserWithDetails | null> {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      products: { select: { id: true, name: true, link: true } },
      sources: { select: { id: true, name: true, url: true } },
    },
  });
}

async function updateUserDetails(userId: UserId, data: Partial<Pick<PrismaUser, "email" | "name">>): Promise<PrismaUser> {
  return db.user.update({
    where: { id: userId },
    data,
  });
}

async function deleteUser(userId: UserId): Promise<PrismaUser> {
  return db.user.delete({ where: { id: userId } });
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const userStatus = await auth0Service.getUserAndAdminStatus(request);
  if (!userStatus) {
    return redirect('/login');
  }

  const { user: auth0User, isAdmin } = userStatus;

  if (!auth0User || !isAdmin) {
    return redirect('/login');
  }

  const userId = Number(params.id);
  if (isNaN(userId)) {
    return json({ error: "Invalid User ID" }, { status: 400 });
  }

  const user = await getUserWithDetails(userId);
  if (!user) {
    return json({ error: "User not found" }, { status: 404 });
  }

  return json<LoaderData>({ user, isAdmin });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userStatus = await auth0Service.getUserAndAdminStatus(request);
  if (!userStatus) {
    return redirect('/login');
  }

  const { user: auth0User, isAdmin } = userStatus;

  if (!auth0User || !isAdmin) {
    return redirect('/login');
  }

  const userId = Number(params.id);
  if (isNaN(userId)) {
    return json<ActionData>({ errors: { general: "Invalid User ID" } }, { status: 400 });
  }

  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "updateUser") {
    const name = formData.get("name") as string | null;
    const email = formData.get("email") as string;

    if (!isValidEmail(email)) {
      return json<ActionData>({ errors: { email: "Invalid email address" } }, { status: 400 });
    }

    try {
      await updateUserDetails(userId, { name, email });
      return redirect(`/admin/users/admin-user-details/${userId}`);
    } catch (error) {
      console.error("Failed to update user:", error);
      return json<ActionData>({ errors: { general: "Failed to update user" } }, { status: 500 });
    }
  }

  if (actionType === "deleteUser") {
    try {
      await deleteUser(userId);
      return redirect("/admin/users");
    } catch (error) {
      console.error("Failed to delete user:", error);
      return json<ActionData>({ errors: { general: "Failed to delete user" } }, { status: 500 });
    }
  }

  return json<ActionData>({ errors: { general: "Invalid action" } }, { status: 400 });
};

export default function AdminUserDetails() {
  const { user, isAdmin } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();

  if (!isAdmin) {
    return (
      <div className="error-container">
        <h1>Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
        <Link to="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-user-details">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Details</h2>
        <Link to="/admin/users" className="text-blue-500 hover:underline">
          Back to Users List
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              defaultValue={user.name || ""}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
            {actionData?.errors?.name && <p className="text-red-500 text-sm">{actionData.errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              defaultValue={user.email || ""}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              required
            />
            {actionData?.errors?.email && <p className="text-red-500 text-sm">{actionData.errors.email}</p>}
          </div>

          {actionData?.errors?.general && <p className="text-red-500 text-sm">{actionData.errors.general}</p>}

          <div className="flex space-x-4">
            <button
              type="submit"
              name="_action"
              value="updateUser"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              disabled={navigation.state === "submitting"}
            >
              {navigation.state === "submitting" ? "Updating..." : "Update User"}
            </button>
            <button
              type="submit"
              name="_action"
              value="deleteUser"
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                  e.preventDefault();
                }
              }}
              disabled={navigation.state === "submitting"}
            >
              {navigation.state === "submitting" ? "Deleting..." : "Delete User"}
            </button>
          </div>
        </Form>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">User's Products</h3>
          {user.products.length > 0 ? (
            <ul className="space-y-2">
              {user.products.map(product => (
                <li key={product.id} className="text-sm">
                  <span className="font-medium">{product.name}</span>
                  <br />
                  <a href={product.link} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    {product.link}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">This user has no products.</p>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">User's Sources</h3>
          {user.sources.length > 0 ? (
            <ul className="space-y-2">
              {user.sources.map(source => (
                <li key={source.id} className="text-sm">
                  <span className="font-medium">{source.name}</span>
                  <br />
                  <a href={source.url} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    {source.url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">This user has no sources.</p>
          )}
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
      <p>Sorry, an unexpected error occurred while loading the user details.</p>
    </div>
  );
}

export function CatchBoundary() {
  return (
    <div className="error-container">
      <h1>User Not Found</h1>
      <p>The requested user does not exist or you don't have permission to view their details.</p>
      <Link to="/admin/users" className="text-blue-500 hover:underline">
        Back to Users List
      </Link>
    </div>
  );
}