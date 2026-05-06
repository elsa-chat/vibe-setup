// Hash router required for GovConnect.ai iframe embedding — never use createBrowserRouter.
// All routes are gated by InitializedLayout (waits for SDK ready before rendering).
//
// To add a page:
//   1. Create a component in src/pages/
//   2. Add a route in the children array below
//   3. For MCP tool UIs, set the path to match resourceURI in pixel_mcp.json

import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import { ErrorPage } from "./ErrorPage";
import { HomePage } from "./HomePage";
import { InitializedLayout } from "./layouts";

const router = createHashRouter([
	{
		Component: InitializedLayout,
		ErrorBoundary: ErrorPage,
		children: [
			{
				index: true,
				Component: HomePage,
			},
			// {
			//     path: '/your-route',
			//     Component: YourPage,
			// },
			{
				path: "*",
				Component: () => <Navigate to="/" />,
			},
		],
	},
]);

export const Router = () => {
	return <RouterProvider router={router} />;
};
