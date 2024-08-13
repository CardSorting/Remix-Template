import React from 'react';
import { Link, useLocation } from '@remix-run/react';
import { User } from '@prisma/client';

interface NavBarProps {
  user: User | null;
}

export default function NavBar({ user }: NavBarProps) {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img className="h-8 w-auto" src="/logo.svg" alt="Logo" />
            </Link>
            {user && (
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                <NavLink to="/dashboard" current={location.pathname === '/dashboard'}>
                  Dashboard
                </NavLink>
                <NavLink to="/dashboard/products" current={location.pathname.startsWith('/dashboard/products')}>
                  Products
                </NavLink>
                <NavLink to="/dashboard/sources" current={location.pathname.startsWith('/dashboard/sources')}>
                  Sources
                </NavLink>
              </div>
            )}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="ml-3 relative">
                <div>
                  <span className="inline-flex rounded-md">
                    <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      {user.email}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, current, children }: { to: string; current: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`${
        current
          ? 'border-indigo-500 text-gray-900'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
    >
      {children}
    </Link>
  );
}