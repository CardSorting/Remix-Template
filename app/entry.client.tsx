import React from 'react';
import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

// Hydrate function with a clear purpose
function hydrate(): void {
  startTransition(() => {
    hydrateRoot(
      document.getElementById('root') as HTMLElement,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>
    );
  });
}

// Check if the browser supports requestIdleCallback, fallback to setTimeout if not
if ('requestIdleCallback' in window) {
  requestIdleCallback(hydrate);
} else {
  setTimeout(hydrate, 1);
}