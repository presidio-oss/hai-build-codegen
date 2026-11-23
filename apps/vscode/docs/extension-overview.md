# Extension Overview

HAI Build Code Generator provides a suite of features to enhance developer productivity.

## Core Features

- **AI-Powered Chat**: An interactive chat interface for asking questions, requesting code changes, or debugging.
- **Automated Task Execution**: HAI Build can plan and execute complex coding tasks, managing file operations, terminal commands, and testing.
- **Context Awareness**: Integrates deeply with your workspace to provide context-aware responses and changes.
- **Tool Integration (MCP)**: Extensible via the Model Context Protocol, allowing connection to external APIs, databases, and services.
- **Deployment & Setup**: Includes built-in support for environment setup and task management.

## Key Components

- **`src/core/controller`**: Manages the orchestration of tasks and state.
- **`src/core/webview`**: Handles communication with the webview UI.
- **`src/sdk`**: Provides the SDK for developers to extend or integrate HAI Build into other environments.
- **`src/shared`**: Shared types, interfaces, and constants used across both the extension host and the webview.
- **`src/utils`**: Utility functions for file system, Git, terminal, and AI model interactions.

## Deployment Guidelines

- The extension is packaged using standard VS Code packaging tools.
- To release, ensure all tests in `src/test` pass.
- Use `vsce` (Visual Studio Code Extensions) to package and publish the extension.
