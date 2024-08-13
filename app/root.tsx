import React from 'react';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import type { MetaFunction, LinksFunction } from '@remix-run/node';
import { env } from '~/env.server';
// MetaFunction to set up the document's metadata
export const meta: MetaFunction = () => {
  return [
    { charset: 'utf-8' },
    { title: 'Link Management System' },
    { name: 'viewport', content: 'width=device-width,initial-scale=1' },
  ];
};

// LinksFunction to include global styles and other external resources
export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: '/styles/app.css' },
];

// Main App component
export default function App(): JSX.Element {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}