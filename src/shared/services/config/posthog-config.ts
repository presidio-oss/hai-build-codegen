import { BUILD_CONSTANTS } from "../../constants"

export interface PostHogClientConfig {
	/**
	 * The main API key for PostHog telemetry service.
	 */
	apiKey?: string | undefined
	/**
	 * The API key for PostHog used only for error tracking service.
	 */
	errorTrackingApiKey?: string | undefined
	host: string
	uiHost: string
}

/**
 * Helper type for a valid PostHog client configuration.
 * Must contains api keys for both telemetry and error tracking.
 */
export interface PostHogClientValidConfig extends PostHogClientConfig {
	apiKey: string
	errorTrackingApiKey: string
}

/**
 * NOTE: PostHog default configuration is disabled.
 * PostHog is now only used when custom config is provided in .hai.config file.
 * Langfuse is the primary telemetry provider with pipeline defaults.
 *
 * The exports below are kept for backwards compatibility with other services
 * (error tracking, feature flags) but will return invalid/empty config.
 */

/**
 * Empty PostHog config - PostHog is only configured via .hai.config file
 * This export is kept for backwards compatibility but will fail isPostHogConfigValid check
 */
export const posthogConfig: PostHogClientConfig = {
	apiKey: undefined,
	errorTrackingApiKey: undefined,
	host: "",
	uiHost: "",
}

/**
 * Validates PostHog config - always returns false since no default config is provided
 * PostHog can only be enabled via custom .hai.config file
 */
export function isPostHogConfigValid(_config: PostHogClientConfig): _config is PostHogClientValidConfig {
	// PostHog default config is disabled - always return false
	// PostHog can only be enabled via .hai.config file
	return false
}
