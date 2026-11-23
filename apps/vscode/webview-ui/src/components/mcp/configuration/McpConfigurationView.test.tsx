import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import McpConfigurationView from "./McpConfigurationView"

const mocks = vi.hoisted(() => ({
	getLatestMcpServers: vi.fn(),
	refreshMcpMarketplace: vi.fn(),
	setMcpServers: vi.fn(),
	setMcpMarketplaceCatalog: vi.fn(),
	remoteConfigSettings: {} as Record<string, unknown>,
}))

vi.mock("@/context/ExtensionStateContext", () => ({
	useExtensionState: () => ({
		remoteConfigSettings: mocks.remoteConfigSettings,
		setMcpServers: mocks.setMcpServers,
		setMcpMarketplaceCatalog: mocks.setMcpMarketplaceCatalog,
		environment: "production",
	}),
}))

vi.mock("@/services/grpc-client", () => ({
	McpServiceClient: {
		getLatestMcpServers: mocks.getLatestMcpServers,
		refreshMcpMarketplace: mocks.refreshMcpMarketplace,
	},
}))

vi.mock("@shared/proto-conversions/mcp/mcp-server-conversion", () => ({
	convertProtoMcpServersToMcpServers: () => [],
}))

vi.mock("./tabs/add-server/AddRemoteServerForm", () => ({
	default: () => <div>Add Remote Server Form</div>,
}))

vi.mock("./tabs/installed/ConfigureServersView", () => ({
	default: () => <div>Configure Servers View</div>,
}))

vi.mock("./tabs/marketplace/McpMarketplaceView", () => ({
	default: () => <div>Marketplace View</div>,
}))

describe("McpConfigurationView", () => {
	beforeEach(() => {
		mocks.getLatestMcpServers.mockResolvedValue({ mcpServers: [] })
		mocks.refreshMcpMarketplace.mockResolvedValue({ items: [] })
		mocks.setMcpServers.mockReset()
		mocks.setMcpMarketplaceCatalog.mockReset()
		mocks.getLatestMcpServers.mockClear()
		mocks.refreshMcpMarketplace.mockClear()
		mocks.remoteConfigSettings = {}
	})

	it("renders the marketplace tab by default, alongside remote servers", async () => {
		mocks.remoteConfigSettings = {
			blockPersonalRemoteMCPServers: false,
		}

		render(<McpConfigurationView onDone={vi.fn()} />)

		expect(screen.getByRole("button", { name: "Marketplace" })).toBeInTheDocument()
		expect(screen.getByRole("button", { name: "Remote Servers" })).toBeInTheDocument()
		expect(screen.getByRole("button", { name: "Configure" })).toBeInTheDocument()
		expect(screen.getByText("Marketplace View")).toBeInTheDocument()

		await waitFor(() => expect(mocks.getLatestMcpServers).toHaveBeenCalledTimes(1))
		await waitFor(() => expect(mocks.refreshMcpMarketplace).toHaveBeenCalledTimes(1))
	})

	it("hides the marketplace tab when remote config disables it", async () => {
		mocks.remoteConfigSettings = {
			mcpMarketplaceEnabled: false,
		}

		render(<McpConfigurationView onDone={vi.fn()} />)

		expect(screen.queryByRole("button", { name: "Marketplace" })).not.toBeInTheDocument()
		expect(screen.getByRole("button", { name: "Remote Servers" })).toBeInTheDocument()
		expect(screen.getByRole("button", { name: "Configure" })).toBeInTheDocument()
		expect(screen.getByText("Configure Servers View")).toBeInTheDocument()

		await waitFor(() => expect(mocks.getLatestMcpServers).toHaveBeenCalledTimes(1))
		expect(mocks.refreshMcpMarketplace).not.toHaveBeenCalled()
	})

	it("hides remote servers only when personal remote MCP servers are blocked", () => {
		mocks.remoteConfigSettings = {
			blockPersonalRemoteMCPServers: true,
		}

		render(<McpConfigurationView initialTab="addRemote" onDone={vi.fn()} />)

		expect(screen.getByRole("button", { name: "Marketplace" })).toBeInTheDocument()
		expect(screen.queryByRole("button", { name: "Remote Servers" })).not.toBeInTheDocument()
		expect(screen.getByRole("button", { name: "Configure" })).toBeInTheDocument()
		expect(screen.queryByText("Add Remote Server Form")).not.toBeInTheDocument()
		expect(screen.getByText("Configure Servers View")).toBeInTheDocument()
	})
})
