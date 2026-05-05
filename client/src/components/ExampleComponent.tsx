// Example of calling a backend reactor from the frontend.
// Replace ExampleReactor with your reactor name and update the fields to match.

import { useInsight } from "@semoss/sdk/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export const ExampleComponent = () => {
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [isRunning, setIsRunning] = useState(false);

	const { actions } = useInsight();

	const handleRun = useCallback(async () => {
		setIsRunning(true);
		try {
			const { pixelReturn } = await actions.run<[string]>(
				// `ExampleReactor(input=${JSON.stringify(input)})`,
				`${JSON.stringify(`Hello World: ${input}`)}`,
			);

			if (pixelReturn[0].operationType.includes("ERROR")) {
				throw new Error(pixelReturn[0].output as string);
			}

			setOutput(pixelReturn[0].output as string);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			toast.error(`Failed: ${message}`);
		} finally {
			setIsRunning(false);
		}
	}, [actions, input]);

	return (
		<div className="p-6 space-y-4">
			<h1 className="text-2xl font-semibold">Example</h1>

			<div>
				<Label htmlFor="input">Input</Label>
				<Input
					id="input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Enter input..."
					disabled={isRunning}
				/>
			</div>

			<Button onClick={handleRun} disabled={isRunning || !input.trim()}>
				{isRunning ? "Running..." : "Run"}
			</Button>

			{output && (
				<div>
					<Label htmlFor="output">Output</Label>
					<Textarea id="output" value={output} readOnly rows={6} />
				</div>
			)}
		</div>
	);
};
