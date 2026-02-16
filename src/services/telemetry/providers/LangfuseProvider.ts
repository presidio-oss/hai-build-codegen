import { Langfuse, LangfuseTraceClient } from "langfuse"
import { ClineAccountUserInfo } from "@/services/auth/AuthService"
import { anthropicModels, bedrockModels, geminiModels, type ModelInfo, vertexModels } from "@/shared/api"
import { Logger } from "@/shared/services/Logger"
import { getGitUserInfo } from "@/utils/git"
import type { ITelemetryProvider, TelemetryProperties, TelemetrySettings } from "./ITelemetryProvider"

export class LangfuseProvider implements ITelemetryProvider {
	private langfuse?: Langfuse
	private traceClient?: LangfuseTraceClient
	private enabled: boolean = false
	private userId?: string
	private distinctId?: string

	constructor(
		private apiKey: string,
		private publicKey: string,
		private baseUrl?: string,
		distinctId?: string,
	) {
		this.distinctId = distinctId || `${Date.now()}-${Math.random().toString(36).substring(2)}`
		this.enabled = true
	}

	private getClient(): LangfuseTraceClient | undefined {
		if (!this.enabled) return undefined
		if (!this.langfuse) {
			this.langfuse = new Langfuse({
				secretKey: this.apiKey,
				publicKey: this.publicKey,
				baseUrl: this.baseUrl,
				enabled: true,
			})
		}
		if (!this.traceClient) {
			this.traceClient = this.langfuse.trace({
				id: `root-${Date.now()}`,
				name: "hai-build-code-generator",
				userId: this.gitUserInfo.username,
				sessionId: this.distinctId,
				metadata: {
					user: this.gitUserInfo.username,
					email: this.gitUserInfo.email,
				},
			} as any)
		}
		return this.traceClient
	}

	public log(event: string, properties?: TelemetryProperties): void {
		if (!this.enabled || !properties || event !== "task.conversation_turn") return

		try {
			const { cacheWriteTokens, cacheReadTokens, totalCost, model, provider } = properties
			if (cacheWriteTokens !== undefined || cacheReadTokens !== undefined) {
				// Get model configuration based on the provider and model name
				const modelId = (model as string) || "unknown"
				const modelProvider = (provider as string) || "unknown"

				let modelConfig: ModelInfo | undefined

				switch (modelProvider) {
					case "bedrock":
						modelConfig = Object.entries(bedrockModels).find(([key]) => modelId.includes(key))?.[1]
						break
					case "anthropic":
						modelConfig = Object.entries(anthropicModels).find(([key]) => modelId.includes(key))?.[1]
						break
					case "vertex":
						modelConfig = Object.entries(vertexModels).find(([key]) => modelId.includes(key))?.[1]
						break
					case "gemini":
						modelConfig = Object.entries(geminiModels).find(([key]) => modelId.includes(key))?.[1]
						break
					default:
						modelConfig = undefined
				}

				this.getClient()?.generation({
					name: event,
					model: modelId,
					userId: this.gitUserInfo.username,
					sessionId: this.distinctId,
					modelParameters: {
						provider: (provider as string) || "unknown",
					},
					usage: {
						input: (cacheWriteTokens as number) || 0,
						output: (cacheReadTokens as number) || 0,
						total: ((cacheWriteTokens as number) || 0) + ((cacheReadTokens as number) || 0),
						totalCost: (totalCost as number) || 0,
					},
					metadata: {
						user: this.gitUserInfo.username,
						email: this.gitUserInfo.email,
						promptVersion: "default",
						cacheWriteTokens: cacheWriteTokens || 0,
						cacheReadTokens: cacheReadTokens || 0,
						totalCost: totalCost || 0,
						apiProvider: provider || "bedrock",
						embeddingProvider: "none",
						maxTokens: modelConfig?.maxTokens || 8192,
						contextWindow: modelConfig?.contextWindow || 200000,
						supportsImages: modelConfig?.supportsImages || false,
						supportsPromptCache: modelConfig?.supportsPromptCache || true,
						inputPrice: modelConfig?.inputPrice || 0.8,
						outputPrice: modelConfig?.outputPrice || 4.0,
						cacheWritesPrice: modelConfig?.cacheWritesPrice || 1.0,
						cacheReadsPrice: modelConfig?.cacheReadsPrice || 0.08,
					},
				} as any)
			}
		} catch (error) {
			Logger.error("[LangfuseProvider] Failed to log event:", error)
		}
	}

	public logRequired(event: string, properties?: TelemetryProperties): void {
		if (!this.enabled || event !== "task.conversation_turn" || !properties) return

		try {
			this.getClient()?.event({
				name: event,
				userId: this.gitUserInfo.username,
				sessionId: this.distinctId,
				metadata: {
					...properties,
					email: this.gitUserInfo.email,
					user: this.gitUserInfo.username,
				},
			} as any)
		} catch (error) {
			Logger.error("[LangfuseProvider] Failed to log required event:", error)
		}
	}

	public identifyUser(userInfo?: ClineAccountUserInfo, properties?: TelemetryProperties): void {
		// Disable all identify calls as we only want task.conversation_turn events
		return
	}

	public setOptIn(optIn: boolean): void {
		this.enabled = optIn
	}

	public isEnabled(): boolean {
		return this.enabled
	}

	public getSettings(): TelemetrySettings {
		return {
			extensionEnabled: this.enabled,
			hostEnabled: true,
			level: this.enabled ? "all" : "off",
		}
	}

	public readonly name: string = "langfuse"

	public recordCounter(
		name: string,
		value: number,
		attributes?: TelemetryProperties,
		description?: string,
		required?: boolean,
	): void {
		if (!this.enabled || name !== "task.conversation_turn") return

		try {
			this.getClient()?.score({
				name,
				value,
				userId: this.gitUserInfo.username,
				sessionId: this.distinctId,
				metadata: {
					...attributes,
					user: this.gitUserInfo.username,
					email: this.gitUserInfo.email,
				},
			} as any) // Temporary type assertion until we fix the types
		} catch (error) {
			Logger.error("[LangfuseProvider] Failed to record counter:", error)
		}
	}

	public recordHistogram(
		name: string,
		value: number,
		attributes?: TelemetryProperties,
		description?: string,
		required?: boolean,
	): void {
		if (!this.enabled || name !== "task.conversation_turn") return

		try {
			this.getClient()?.score({
				name,
				value,
				userId: this.gitUserInfo.username,
				sessionId: this.distinctId,
				metadata: {
					...attributes,
					type: "histogram",
					userId: this.gitUserInfo.username,
					email: this.gitUserInfo.email,
				},
			} as any) // Temporary type assertion until we fix the types
		} catch (error) {
			Logger.error("[LangfuseProvider] Failed to record histogram:", error)
		}
	}

	public recordGauge(
		name: string,
		value: number | null,
		attributes?: TelemetryProperties,
		description?: string,
		required?: boolean,
	): void {
		if (!this.enabled || name !== "task.conversation_turn") return
		if (value === null) return

		try {
			this.getClient()?.score({
				name,
				value,
				userId: this.gitUserInfo.username,
				sessionId: this.distinctId,
				metadata: {
					...attributes,
					type: "gauge",
					userId: this.gitUserInfo.username,
					email: this.gitUserInfo.email,
				},
			} as any) // Temporary type assertion until we fix the types
		} catch (error) {
			Logger.error("[LangfuseProvider] Failed to record gauge:", error)
		}
	}

	public setTraceClient(taskId: string, isNew: boolean = false) {
		// Only set trace client for task.conversation_turn events
		if (!this.enabled || !taskId || !taskId.includes("task.conversation_turn")) return

		try {
			// Start / Re-Create a new trace in Langfuse
			if (!this.langfuse) return
			this.traceClient = this.langfuse.trace({
				id: taskId,
				name: "hai-build-code-generator",
				userId: this.gitUserInfo.username,
				sessionId: this.distinctId,
				metadata: {
					user: this.gitUserInfo.username,
					email: this.gitUserInfo.email,
					type: "task",
				},
				...(isNew ? { timestamp: new Date() } : {}),
			} as any) // Temporary type assertion until we fix the types
			Logger.info(`[LangfuseProvider] Created trace for task ${taskId}`)
		} catch (error) {
			Logger.error("[LangfuseProvider] Failed to create trace:", error)
		}
	}

	public setDistinctId(distinctId: string) {
		this.distinctId = distinctId
	}

	public async forceFlush(): Promise<void> {
		if (!this.enabled || !this.langfuse) return
		try {
			await this.langfuse.flushAsync()
		} catch (error) {
			Logger.error("[LangfuseProvider] Error during forceFlush:", error)
		}
	}

	public async dispose(): Promise<void> {
		if (!this.enabled || !this.langfuse) return

		try {
			await this.langfuse.flushAsync()
			await this.langfuse.shutdownAsync()
			Logger.info("[LangfuseProvider] Disposed and flushed all events")
		} catch (error) {
			Logger.error("[LangfuseProvider] Error during dispose:", error)
		}
	}

	// TAG:HAI
	/** Git user information (username and email) for tracking user identity */
	// This is used to identify the user in PostHog and Langfuse
	private readonly gitUserInfo: {
		username: string
		email: string
	} = getGitUserInfo()
}
