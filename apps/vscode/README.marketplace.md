# HAI Build Code Generator

<div align="center">
<table>
<tbody>
<td align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=presidio-inc.hai-build-code-generator" target="_blank"><strong>Download on VS Marketplace</strong></a>
</td>
<td align="center">
<a href="https://github.com/presidio-oss/hai-build-codegen" target="_blank"><strong>GitHub</strong></a>
</td>
<td align="center">
<a href="https://github.com/presidio-oss/hai-build-codegen/issues" target="_blank"><strong>Issues</strong></a>
</td>
<td align="center">
<a href="https://github.com/presidio-oss/hai-build-codegen/discussions" target="_blank"><strong>Feature Requests</strong></a>
</td>
<td align="center">
<a href="https://github.com/presidio-oss/hai-build-codegen#readme" target="_blank"><strong>Getting Started</strong></a>
</td>
</tbody>
</table>
</div>

Meet HAI Build Code Generator, a Human AI VS Code extension that streamlines development workflows through AI-powered task execution, intelligent file management, and automated code generation.

Thanks to agentic coding capabilities, HAI can handle complex software development tasks step-by-step. With tools that let it create & edit files, explore large projects, use the browser, and execute terminal commands (after you grant permission), it can assist you in ways that go beyond code completion or tech support. HAI can even use the Model Context Protocol (MCP) to create new tools and extend its own capabilities. While autonomous AI scripts traditionally run in sandboxed environments, this extension provides a human-in-the-loop GUI to approve every file change and terminal command, providing a safe and accessible way to explore the potential of agentic AI.

1. Enter your task and add images to convert mockups into functional apps or fix bugs with screenshots.
2. HAI starts by analyzing your file structure & source code ASTs, running regex searches, and reading relevant files to get up to speed in existing projects. By carefully managing what information is added to context, HAI can provide valuable assistance even for large, complex projects without overwhelming the context window.
3. Once HAI has the information it needs, it can:
    - Create and edit files + monitor linter/compiler errors along the way, letting it proactively fix issues like missing imports and syntax errors on its own.
    - Execute commands directly in your terminal and monitor their output as it works, letting it e.g., react to dev server issues after editing a file.
    - For web development tasks, HAI can launch the site in a headless browser, click, type, scroll, and capture screenshots + console logs, allowing it to fix runtime errors and visual bugs.
4. When a task is completed, HAI will present the result to you with a terminal command like `open -a "Google Chrome" index.html`, which you run with a click of a button.

---

### Use any API and Model

HAI supports API providers like OpenRouter, Anthropic, OpenAI, Google Gemini, AWS Bedrock, Azure, GCP Vertex, Cerebras and Groq. You can also configure any OpenAI compatible API, or use a local model through LM Studio/Ollama. If you're using OpenRouter, the extension fetches their latest model list, allowing you to use the newest models as soon as they're available.

The extension also keeps track of total tokens and API usage cost for the entire task loop and individual requests, keeping you informed of spend every step of the way.

---

### Run Commands in Terminal

Thanks to the new [shell integration updates in VSCode v1.93](https://code.visualstudio.com/updates/v1_93#_terminal-shell-integration-api), HAI can execute commands directly in your terminal and receive the output. This allows it to perform a wide range of tasks, from installing packages and running build scripts to deploying applications, managing databases, and executing tests, all while adapting to your dev environment & toolchain to get the job done right.

For long running processes like dev servers, use the "Proceed While Running" button to let HAI continue in the task while the command runs in the background. As HAI works it'll be notified of any new terminal output along the way, letting it react to issues that may come up, such as compile-time errors when editing files.

---

### Create and Edit Files

HAI can create and edit files directly in your editor, presenting you a diff view of the changes. You can edit or revert HAI's changes directly in the diff view editor, or provide feedback in chat until you're satisfied with the result. HAI also monitors linter/compiler errors (missing imports, syntax errors, etc.) so it can fix issues that come up along the way on its own.

All changes made by HAI are recorded in your file's Timeline, providing an easy way to track and revert modifications if needed.

---

### Use the Browser

HAI can launch a browser, click elements, type text, and scroll, capturing screenshots and console logs at each step. This allows for interactive debugging, end-to-end testing, and even general web use — giving it autonomy to fix visual bugs and runtime issues without you needing to copy-paste error logs yourself.

---

### "add a tool that..."

Thanks to the [Model Context Protocol](https://github.com/modelcontextprotocol), HAI can extend its capabilities through custom tools. While you can use [community-made servers](https://github.com/modelcontextprotocol/servers), HAI can instead create and install tools tailored to your specific workflow. Just ask HAI to "add a tool" and it will handle everything, from creating a new MCP server to installing it into the extension.

-   "add a tool that fetches Jira tickets": Retrieve ticket ACs and put HAI to work
-   "add a tool that manages AWS EC2s": Check server metrics and scale instances up or down
-   "add a tool that pulls the latest PagerDuty incidents": Fetch details and ask HAI to fix bugs

---

### Add Context

**`@url`:** Paste in a URL for the extension to fetch and convert to markdown, useful when you want to give HAI the latest docs

**`@problems`:** Add workspace errors and warnings ('Problems' panel) for HAI to fix

**`@file`:** Adds a file's contents so you don't have to waste API requests approving read file (+ type to search files)

**`@folder`:** Adds folder's files all at once to speed up your workflow even more

---

### Checkpoints: Compare and Restore

As HAI works through a task, the extension takes a snapshot of your workspace at each step. You can use the 'Compare' button to see a diff between the snapshot and your current workspace, and the 'Restore' button to roll back to that point.

---

## Contributing

To contribute to the project, start with our [Contributing Guide](CONTRIBUTING.md) to learn the basics. If you're looking to report issues or request features, visit our [GitHub repository](https://github.com/presidio-oss/hai-build-codegen).

## License

[Apache 2.0 © 2026 Presidio](./LICENSE)
