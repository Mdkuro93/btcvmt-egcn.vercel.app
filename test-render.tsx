import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App';
import { MemoryRouter } from 'react-router-dom';

try {
  renderToString(<MemoryRouter><App /></MemoryRouter>);
  console.log("Rendered successfully");
} catch(e) {
  console.log("CAUGHT EXCEPTION:");
  console.error(e);
}
