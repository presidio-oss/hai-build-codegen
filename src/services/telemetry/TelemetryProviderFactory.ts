import { PostHog } from "posthog-node"
import { ClineEndpoint } from "@/config"
import { HaiConfig } from "@/shared/hai-config"
import {
	getValidOpenTelemetryConfig,
	getValidRuntimeOpenTelemetryConfig,
	OpenTelemetryClientValidConfig,
} from "@/shared/services/config/otel-config"
import { Logger } from "@/shared/services/Logger"
import type { ITelemetryProvider, TelemetryProperties, TelemetrySettings } from "./providers/ITelemetryProvider"
import { LangfuseProvider } from "./providers/LangfuseProvider"
import { OpenTelemetryClientProvider } from "./providers/opentelemetry/OpenTelemetryClientProvider"
import { OpenTelemetryTelemetryProvider } from "./providers/opentelemetry/OpenTelemetryTelemetryProvider"
import { PostHogTelemetryProvider } from "./providers/posthog/PostHogTelemetryProvider"

/**
 * Supported telemetry provider types
 */
export type TelemetryProviderType = "posthog" | "no-op" | "opentelemetry" | "langfuse"

/**
 * Configuration for telemetry providers
 */
export type TelemetryProviderConfig =
	| { type: "posthog"; apiKey?: string; host?: string }
	| { type: "opentelemetry"; config: OpenTelemetryClientValidConfig; bypassUserSettings: boolean }
	| { type: "langfuse"; apiKey?: string; publicKey?: string; apiUrl?: string }
	| { type: "no-op" }

/**
 * Factory class for creating telemetry providers
 * Allows easy switching between different analytics providers
 */
export class TelemetryProviderFactory {
	/**
	 * Creates multiple telemetry providers based on configuration
	 * Supports dual tracking during transition period
	 */
	public static async createProviders(): Promise<ITelemetryProvider[]> {
		const configs = await TelemetryProviderFactory.getDefaultConfigs()
		const providers: ITelemetryProvider[] = []

		for (const config of configs) {
			try {
				const provider = await TelemetryProviderFactory.createProvider(config)
				providers.push(provider)
			} catch (error) {
				Logger.error(`Failed to create telemetry provider: ${config.type}`, error)
			}
		}

		// Always have at least a no-op provider
		if (providers.length === 0) {
			providers.push(new NoOpTelemetryProvider())
		}

		Logger.info("TelemetryProviderFactory: Created providers - " + providers.map((p) => p.name).join(", "))
		return providers
	}

	/**
	 * Creates a single telemetry provider based on the provided configuration
	 * @param config Configuration for the telemetry provider
	 * @returns ITelemetryProvider instance
	 */
	private static async createProvider(config: TelemetryProviderConfig): Promise<ITelemetryProvider> {
		switch (config.type) {
			case "langfuse": {
				if (config.apiKey && config.publicKey) {
					return new LangfuseProvider(config.apiKey, config.publicKey, config.apiUrl)
				}
				Logger.info("TelemetryProviderFactory: Langfuse credentials not available")
				return new NoOpTelemetryProvider()
			}
			case "posthog": {
				// Create a custom PostHog client with config from .hai.config
				if (config.apiKey && config.host) {
					const customClient = new PostHog(config.apiKey, {
						host: config.host,
						enableExceptionAutocapture: false,
					})
					return await new PostHogTelemetryProvider(customClient).initialize()
				}
				Logger.info("TelemetryProviderFactory: PostHog credentials not available")
				return new NoOpTelemetryProvider()
			}
			case "opentelemetry": {
				const otelConfig = config.config
				if (!otelConfig) {
					return new NoOpTelemetryProvider()
				}
				const client = new OpenTelemetryClientProvider(otelConfig)
				if (client.meterProvider || client.loggerProvider) {
					return await new OpenTelemetryTelemetryProvider(client.meterProvider, client.loggerProvider, {
						bypassUserSettings: config.bypassUserSettings,
					}).initialize()
				}
				Logger.info("TelemetryProviderFactory: OpenTelemetry providers not available")
				return new NoOpTelemetryProvider()
			}
			case "no-op":
				return new NoOpTelemetryProvider()
			default:
				Logger.error(`Unsupported telemetry provider type: ${(config as { type?: string }).type ?? "unknown"}`)
				return new NoOpTelemetryProvider()
		}
	}

	/**
	 * Gets the default telemetry provider configuration
	 * Priority order:
	 * 1. Langfuse: Custom from .hai.config OR pipeline defaults (env vars)
	 * 2. PostHog: Only from .hai.config (no pipeline defaults)
	 * 3. OpenTelemetry: Optional, from env vars
	 * @returns Default configuration using available providers
	 */
	public static async getDefaultConfigs(): Promise<TelemetryProviderConfig[]> {
		const configs: TelemetryProviderConfig[] = []

		// 1. Langfuse configuration
		// First check for custom config from .hai.config
		const customLangfuseConfig = await HaiConfig.getLangfuseConfig()
		if (customLangfuseConfig?.apiKey && customLangfuseConfig?.publicKey) {
			// Use custom Langfuse config from .hai.config
			Logger.info("TelemetryProviderFactory: Using custom Langfuse config from .hai.config")
			configs.push({
				type: "langfuse",
				apiKey: customLangfuseConfig.apiKey,
				publicKey: customLangfuseConfig.publicKey,
				apiUrl: customLangfuseConfig.apiUrl,
			})
		} else if (process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY) {
			// Fall back to pipeline defaults (build-time env vars)
			Logger.info("TelemetryProviderFactory: Using default Langfuse config from pipeline")
			configs.push({
				type: "langfuse",
				apiKey: process.env.LANGFUSE_SECRET_KEY,
				publicKey: process.env.LANGFUSE_PUBLIC_KEY,
				apiUrl: process.env.LANGFUSE_BASE_URL,
			})
		}

		// 2. PostHog configuration - ONLY from .hai.config (no pipeline defaults)
		const customPostHogConfig = await HaiConfig.getPostHogConfig()
		if (customPostHogConfig?.apiKey && customPostHogConfig?.url) {
			Logger.info("TelemetryProviderFactory: Using custom PostHog config from .hai.config")
			configs.push({
				type: "posthog",
				apiKey: customPostHogConfig.apiKey,
				host: customPostHogConfig.url,
			})
		}

		// 3. OpenTelemetry provider (optional, from env vars)
		const otelConfig = getValidOpenTelemetryConfig()
		if (!ClineEndpoint.isSelfHosted() && otelConfig) {
			configs.push({
				type: "opentelemetry",
				config: otelConfig,
				bypassUserSettings: false,
			})
		}

		const runtimeOtelConfig = getValidRuntimeOpenTelemetryConfig()
		if (runtimeOtelConfig) {
			configs.push({
				type: "opentelemetry",
				config: runtimeOtelConfig,
				// If the user has `CLINE_OTEL_TELEMETRY_ENABLED` in his environment, enable
				// OTEL regardless of his Cline telemetry settings
				bypassUserSettings: true,
			})
		}

		return configs.length > 0 ? configs : [{ type: "no-op" }]
	}
}

/**
 * No-operation telemetry provider for when telemetry is disabled
 * or for testing purposes
 */
export class NoOpTelemetryProvider implements ITelemetryProvider {
	readonly name = "NoOpTelemetryProvider"
	private isOptIn = true

	log(_event: string, _properties?: TelemetryProperties): void {
		Logger.log(`[NoOpTelemetryProvider] ${_event}: ${JSON.stringify(_properties)}`)
	}
	logRequired(_event: string, _properties?: TelemetryProperties): void {
		Logger.log(`[NoOpTelemetryProvider] REQUIRED ${_event}: ${JSON.stringify(_properties)}`)
	}
	identifyUser(_userInfo: any, _properties?: TelemetryProperties): void {
		Logger.info(`[NoOpTelemetryProvider] identifyUser - ${JSON.stringify(_userInfo)} - ${JSON.stringify(_properties)}`)
	}
	isEnabled(): boolean {
		return false
	}
	getSettings(): TelemetrySettings {
		return {
			hostEnabled: false,
			level: "off",
		}
	}
	recordCounter(
		_name: string,
		_value: number,
		_attributes?: TelemetryProperties,
		_description?: string,
		_required = false,
	): void {
		// no-op
	}
	recordHistogram(
		_name: string,
		_value: number,
		_attributes?: TelemetryProperties,
		_description?: string,
		_required = false,
	): void {
		// no-op
	}
	recordGauge(
		_name: string,
		_value: number | null,
		_attributes?: TelemetryProperties,
		_description?: string,
		_required = false,
	): void {
		// no-op
	}
	async dispose(): Promise<void> {
		Logger.info(`[NoOpTelemetryProvider] Disposing (optIn=${this.isOptIn})`)
	}
}
