import { TriangleAlert } from "lucide-react";

export const ErrorPage = () => {
	return (
		<div className="flex flex-col items-center justify-center h-full gap-2">
			<TriangleAlert className="size-8" />
			<div>
				An error has occurred. Please try again or contact support.
			</div>
		</div>
	);
};
