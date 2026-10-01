import type { McpMarketplaceItem } from "@shared/mcp"
import type { EmptyRequest } from "@shared/proto/cline/common"
import { McpMarketplaceCatalog } from "@shared/proto/cline/mcp"
import axios from "axios"
import { ClineEnv } from "@/config"
import { writeMcpMarketplaceCatalogToCache } from "@/core/storage/disk"
import { getAxiosSettings } from "@/shared/net"
import { Logger } from "@/shared/services/Logger"
import { getAllLocalMcps } from "@/utils/local-mcp-registry"
import type { Controller } from "../index"
import { sendMcpMarketplaceCatalogEvent } from "./subscribeToMcpMarketplaceCatalog"

async function fetchMcpMarketplaceFromApi(controller: Controller): Promise<McpMarketplaceCatalog> {
	const response = await axios.get(`${ClineEnv.config().mcpBaseUrl}/marketplace`, {
		headers: {
			"Content-Type": "application/json",
			"User-Agent": "cline-vscode-extension",
		},
		...getAxiosSettings(),
	})

	if (!response.data) {
		throw new Error("Invalid response from MCP marketplace API")
	}

	// Get allowlist from remote config
	const allowedMCPServers = controller.stateManager.getRemoteConfigSettings().allowedMCPServers

	let items: McpMarketplaceItem[] = (response.data || []).map((item: McpMarketplaceItem) => ({
		...item,
		githubStars: item.githubStars ?? 0,
		downloadCount: item.downloadCount ?? 0,
		tags: item.tags ?? [],
	}))

	const localItems: McpMarketplaceItem[] = Object.values(getAllLocalMcps()).map((item) => ({
		...item,
		createdAt: "1970-01-01T00:00:00Z",
		updatedAt: "1970-01-01T00:00:00Z",
		lastGithubSync: "1970-01-01T00:00:00Z",
		isLocal: true,
	}))

	// Filter by allowlist if configured
	if (allowedMCPServers) {
		const allowedIds = new Set(allowedMCPServers.map((server) => server.id))
		items = items.filter((item: McpMarketplaceItem) => allowedIds.has(item.mcpId))
	}

	const mergedItems = [...localItems, ...items]
	items = mergedItems.filter((item, index, allItems) => index === allItems.findIndex((other) => other.mcpId === item.mcpId))

	const catalog: McpMarketplaceCatalog = { items }

	// Store in cache file
	await writeMcpMarketplaceCatalogToCache(catalog)
	return catalog
}

/**
 * RPC handler that refreshes the MCP marketplace catalog
 * @param controller Controller instance
 * @param _request Empty request
 * @returns MCP marketplace catalog
 */
export async function refreshMcpMarketplace(controller: Controller, _request: EmptyRequest): Promise<McpMarketplaceCatalog> {
	try {
		const catalog = await fetchMcpMarketplaceFromApi(controller)
		await sendMcpMarketplaceCatalogEvent(catalog)
		return catalog
	} catch (error) {
		Logger.error("Failed to refresh MCP marketplace:", error)
	}
	// Return empty catalog if nothing was fetched
	return { items: [] }
}
