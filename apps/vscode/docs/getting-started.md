# Getting Started with HAI Build

## Prerequisites

- [VS Code](https://code.visualstudio.com/) (Version ^1.101.0)
- Node.js (Development environment)

## Setup and Installation

### For Development

1.  Clone the repository:
    ```bash
    git clone https://github.com/presidio-oss/hai-build-codegen
    cd hai-build-codegen/apps/vscode
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the project:
    ```bash
    npm run build
    ```
4.  Launch in VS Code:
    - Press `F5` to open a new Extension Development Host window.

### For Usage

1.  Install the extension from the VS Code Marketplace or build it from source.
2.  Open the HAI Build panel from the Activity Bar (Ctrl/Cmd + ').
3.  Configure your API keys in the settings if required by your chosen AI model.

## Configuration

The extension is configurable via VS Code Settings (`settings.json`).

- `hai.api.provider`: Choose your AI provider (e.g., Anthropic, OpenAI, etc.).
- `hai.api.key`: Configure your API key.

*(Note: These settings may change. Check the Settings UI for the most up-to-date configuration options.)*
