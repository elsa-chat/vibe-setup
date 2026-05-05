// Blocks rendering until the GovConnect.ai SDK is ready.
// Shows a loading spinner during init, error page on failure, child routes when ready.

import { useInsight } from "@semoss/sdk/react";
import { Outlet } from "react-router-dom";
import { LoadingScreen } from "@/components";
import { ErrorPage } from "../ErrorPage";

export const InitializedLayout = () => {
	const { isInitialized, error } = useInsight();

	return (
		<div className="flex flex-col h-screen">
			{isInitialized ? (
				<div className="p-4 overflow-auto h-full">
					<Outlet />
				</div>
			) : error ? (
				<ErrorPage />
			) : (
				<LoadingScreen />
			)}
		</div>
	);
};
