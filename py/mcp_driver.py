# MCP tools for this SEMOSS app.
#
# These are simple Python tools that can be exposed as MCP tools in the SEMOSS Playground.
# When an MCP tool has no resourceURI, Playground auto-generates a basic form for it.
#
# After adding or changing tools here, run MakePythonMCP(<project_id>) in the SEMOSS
# Playground to regenerate mcp/py_mcp.json.
#
# The temperature converters below are TEMPLATE examples — replace them with your own tools.
# The `echo` function at the bottom is a platform-recommended pattern; keep it if you want
# UI-driven ("ask") tools to be able to hand context back to Playground.

import json

from smssutil import mcp_metadata


@mcp_metadata(
    {
        "execution": "auto",
        "displayLocation": "inline",
        "loadingMessage": "Converting temperature...",
    }
)
def fahrenheit_to_celsius(temperature_f: float) -> str:
    """Convert a temperature from Fahrenheit to Celsius."""
    celsius = (temperature_f - 32) * 5 / 9
    return json.dumps({"fahrenheit": temperature_f, "celsius": round(celsius, 2)})


@mcp_metadata(
    {
        "execution": "auto",
        "displayLocation": "inline",
        "loadingMessage": "Converting temperature...",
    }
)
def celsius_to_fahrenheit(temperature_c: float) -> str:
    """Convert a temperature from Celsius to Fahrenheit."""
    fahrenheit = temperature_c * 9 / 5 + 32
    return json.dumps({"celsius": temperature_c, "fahrenheit": round(fahrenheit, 2)})


@mcp_metadata({"execution": "auto"})
def echo(context):
    """Return the accumulated context back to Playground unchanged.

    Used by "ask" tools (custom-UI tools that need user interaction). After the user
    is done in the custom UI, the frontend calls:
        actions.runMCPTool('echo', { context: accumulatedContext })
    to send the final assimilated context back to the Playground chat. The platform
    docs recommend keeping this function in every MCP-enabled app.
    """
    return context
