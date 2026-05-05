// Env.update() configures the SEMOSS SDK with connection details from .env.
// QueryClientProvider enables TanStack Query throughout the app.
// InsightProvider initializes a GovConnect.ai Insight session and exposes
// the useInsight() hook (actions.run, tool parameters, MCP responses).

import { Env } from "@semoss/sdk";
import { InsightProvider } from "@semoss/sdk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Router } from "./pages";

Env.update({
	MODULE: import.meta.env.MODULE || "",
	ACCESS_KEY: import.meta.env.VITE_ACCESS_KEY || "",
	SECRET_KEY: import.meta.env.VITE_SECRET_KEY || "",
	APP: import.meta.env.APP || "",
});

const queryClient = new QueryClient();

export const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<InsightProvider>
				<Router />
				<Toaster />
			</InsightProvider>
		</QueryClientProvider>
	);
};
