import { Routes as RouterRoutes, Route } from 'react-router-dom';

// Placeholder for routes
function Routes(): JSX.Element {
  return (
    <RouterRoutes>
      <Route path="/" element={<div>Home Page</div>} />
      <Route path="*" element={<div>Not Found</div>} />
    </RouterRoutes>
  );
}

export default Routes;
