# Java Reactors

Backend logic for Elsa apps. Reactors are Java classes that handle complex operations like database access, heavy computation, and LLM interactions. Optional — only needed when Python or pure-frontend logic isn't enough.

## Structure

```
java/
├── src/
│   ├── reactors/
│   │   ├── AbstractProjectReactor.java   Base class for all reactors
│   │   └── GetWeatherReactor.java        Example reactor (template — replace)
│   └── util/
│       ├── Constants.java                Shared constants
│       ├── HelperMethods.java            Utility functions
│       └── ProjectProperties.java        Config loader
└── project.properties                    Project configuration
```

## Creating a Reactor

1. Create a new class in `src/reactors/` that extends `AbstractProjectReactor`
2. Define parameters in `keysToGet` (names) and `keyRequired` (1 = required, 0 = optional)
3. Implement `doExecute()` with your logic — do **not** call `organizeKeys()` (it runs automatically)
4. Implement `getDescriptionForKey()` and `getReactorDescription()` for MCP manifest generation
5. Return results via `new NounMetadata(responseMap, PixelDataType.MAP)`
6. Return errors via `NounMetadata.getErrorNounMessage("description")`

See `GetWeatherReactor.java` for a working example.

## Compiling

When deploying via `semoss_asset_sync.py`, the script auto-runs `CompileAppReactors` before publishing — `.java` changes get compiled to bytecode automatically. When uploading via the Elsa UI editor instead, click **"Compile and publish the app"** in the editor after dragging files in (it does both compile and publish in one step).

## Declaring a Reactor as an MCP Tool

Add an entry for the reactor to `mcp/pixel_mcp.json`. Each entry lists the tool name, input schema, description, and a bit of render metadata. Drop the "Reactor" suffix from the tool name (e.g., `GetWeatherReactor` → `GetWeather`). The existing `GetWeather` entry is a working example to copy from.

## Calling from Frontend

```js
actions.run('GetWeather(city="Boston")')
```

Drop the "Reactor" suffix. Parameters are passed inline in the Pixel command.

## Key Rules

- Extend `AbstractProjectReactor`, not other base classes
- `IModelEngine.ask()` returns response objects — use reflection to call `getResponse()`, never `toString()`
- File paths: use `this.insight.getInsightFolder()`
- Don't edit `classes/` directly — it's auto-generated from this folder
