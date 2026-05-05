// Demonstrates the full MCP tool UI pattern for GovConnect.ai apps.
//
// Key patterns shown here:
//   - Call a Java reactor via actions.run('ReactorName(param=["value"])')
//   - Read MCP parameters from Playground via tool.parameters
//   - Send results back via actions.sendMCPResponseToPlayground()
//   - Handle three states: fresh invocation / past execution / regular page
//
// Replace with your own UI. Keep the patterns — the MCP wiring is the hard part.

import { useInsight } from "@semoss/sdk/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export const ExampleComponent = () => {
	const [city, setCity] = useState("");
	const [forecast, setForecast] = useState("");
	const [isRunning, setIsRunning] = useState(false);
	const [hasSentToChat, setHasSentToChat] = useState(false);

	// actions — run Pixel commands and send MCP responses
	// tool   — populated when this UI is launched from Playground as an MCP tool
	const { actions, tool } = useInsight();

	// Pixel reactor call: "Reactor" suffix is stripped, all params are array-wrapped.
	// GetWeatherReactor → GetWeather(city=["Boston"])
	const handleGetForecast = useCallback(
		async (cityName: string) => {
			setIsRunning(true);
			try {
				const { pixelReturn } = await actions.run<[string]>(
					`GetWeather(city=${JSON.stringify(cityName)})`,
				);

				if (pixelReturn[0].operationType.includes("ERROR")) {
					throw new Error(pixelReturn[0].output as string);
				}

				setForecast(pixelReturn[0].output as string);
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e);
				toast.error(`Failed to get forecast: ${message}`);
			} finally {
				setIsRunning(false);
			}
		},
		[actions],
	);

	const handleSendToChat = () => {
		actions.sendMCPResponseToPlayground(forecast, "success", { city });
		setHasSentToChat(true);
	};

	// Runs once when the component mounts inside a Playground MCP tool invocation.
	// tool.tool_response  → past execution: restore previous result
	// tool.parameters     → fresh invocation: auto-fill inputs and run
	useEffect(() => {
		if (!tool) return;

		if (tool.tool_response) {
			setForecast(tool.tool_response as string);
			setCity(
				((tool.executedParameters?.city ??
					tool.parameters?.city) as string) ?? "",
			);
			setHasSentToChat(true);
		} else {
			const cityFromParams = (tool.parameters?.city as string) ?? "";
			setCity(cityFromParams);
			if (cityFromParams) {
				handleGetForecast(cityFromParams);
			}
		}
	}, [tool, handleGetForecast]);

	const disabled = isRunning || hasSentToChat;

	return (
		<div className="p-6 space-y-4">
			<h1 className="text-2xl font-semibold">Weather Forecast</h1>

			<div>
				<Label htmlFor="city">City</Label>
				<Input
					id="city"
					value={city}
					onChange={(e) => setCity(e.target.value)}
					placeholder="Enter a city name..."
					disabled={disabled}
				/>
			</div>

			<Button
				onClick={() => handleGetForecast(city)}
				disabled={disabled || !city.trim()}
			>
				{isRunning ? "Fetching forecast..." : "Get Forecast"}
			</Button>

			<div>
				<Label htmlFor="forecast">Forecast</Label>
				<Textarea
					id="forecast"
					value={forecast}
					readOnly
					placeholder="Forecast will appear here..."
					rows={6}
					disabled={disabled}
				/>
			</div>

			<Button
				variant="outline"
				onClick={handleSendToChat}
				disabled={!forecast || disabled}
			>
				Send to Playground
			</Button>
		</div>
	);
};
