# MCP tools for this Elsa app.
#
# These are simple Python tools that can be exposed as MCP tools in Elsa chat.
# When an MCP tool has no resourceURI, Elsa auto-generates a basic form for it.
#
# After adding or changing tools here, update mcp/py_mcp.json — either edit it by hand
# or regenerate by running MakePythonMCP(<project_id>) in Elsa.
#
# The temperature converters below are TEMPLATE examples — replace them with your own tools.

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
