# MCP Integration

HAI Build leverages the Model Context Protocol (MCP) to extend its capabilities. MCP allows the agent to interact with external tools, APIs, and data sources in a standardized way.

## How it Works

- **Local MCP Registry**: HAI Build maintains a registry of local MCP servers (`src/utils/local-mcp-registry.ts`).
- **Services**: The `src/services/mcp` directory contains the logic for managing and communicating with MCP servers.
- **Tools**: MCP tools are registered and made available to the AI model during task execution.

## Adding New MCP Tools

To add new MCP tools:

1.  **Define the Server**: Create an MCP server definition.
2.  **Register the Tool**: Add the server configuration to the HAI Build MCP registry.
3.  **Use in Tasks**: Once registered, the AI model can discover and use these tools to perform tasks.

*Refer to the MCP documentation for details on how to write MCP-compliant servers.*
