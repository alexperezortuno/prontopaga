import { StrictMode } from 'react';
import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';

function Bootstrap(): ReactElement {
  return <main>Financial Risk MVP</main>;
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found');
}

createRoot(root).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
