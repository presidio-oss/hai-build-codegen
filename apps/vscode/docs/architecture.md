# Architecture Overview

HAI Build is a VS Code extension built using TypeScript. It follows a modular architecture to separate concerns between the extension host, webview UI, and core business logic.

## High-Level Architecture

The extension is composed of several key layers:

1.  **Extension Host (`src/extension.ts`)**: The entry point of the VS Code extension. It manages the lifecycle of the extension, registers commands, and handles VS Code API interactions.
2.  **Core Business Logic (`src/core/`)**: This layer contains the core logic for:
    - **Tasks**: Execution of AI-driven tasks.
    - **Context Management**: Tracking workspace context and memory.
    - **Webview Communication**: Handling communication between the UI and the extension host.
    - **API Interactions**: Communication with LLM providers.
3.  **Standalone Engine (`src/standalone/`)**: Implements the core HAI Build engine that can potentially run outside of the VS Code environment. It handles core connection protocols and services.
4.  **Webview UI (`webview-ui/`)**: A React-based webview that provides the user interface for interaction.
5.  **SDK (`src/sdk/`)**: Provides an interface for building and testing sessions, interacting with VS Code, and handling tool execution.
6.  **Integrations (`src/integrations/`)**: Connectors for various external tools and services (e.g., terminal, diagnostics, custom MCP tools).

## Data Flow

1.  **User Interaction**: The user interacts with the HAI Build panel (Webview).
2.  **Message Passing**: The Webview sends messages to the Extension Host via `postMessage`.
3.  **Command Execution**: The Extension Host processes the message, invoking `src/core` logic or calling `src/sdk` methods.
4.  **AI Orchestration**: The core engine orchestrates interaction with LLM providers to generate code, run commands, or analyze context.
5.  **UI Update**: Results are sent back to the Webview to update the chat interface.

## Key Design Principles

- **Separation of Concerns**: UI is strictly separated from business logic.
- **Extensibility**: Uses MCP (Model Context Protocol) to extend capabilities with new tools and data sources.
- **Testability**: Significant emphasis on unit and integration testing across `src/test` and `src/sdk`.
