import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage';
import { TrainingPage } from '@/pages/TrainingPage';
import { AddCardPage } from '@/pages/AddCardPage';
import { CardManagerPage } from '@/pages/CardManagerPage';
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/train",
    element: <TrainingPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/add",
    element: <AddCardPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/manage",
    element: <CardManagerPage />,
    errorElement: <RouteErrorBoundary />,
  },
]);
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
)