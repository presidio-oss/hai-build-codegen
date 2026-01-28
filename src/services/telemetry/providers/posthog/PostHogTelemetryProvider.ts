import { PostHog } from "posthog-node"
import { HostProvider } from "@/hosts/host-provider"
import { getErrorLevelFromString } from "@/services/error"
import { getDistinctId, setDistinctId } from "@/services/logging/distinctId"
import { Setting } from "@/shared/proto/index.host"
import { Logger } from "@/shared/services/Logger"
import { getGitUserInfo } from "@/utils/git"
import { posthogConfig } from "../../../../shared/services/config/posthog-config"
import type { ClineAccountUserInfo } from "../../../auth/AuthService"
import type { ITelemetryProvider, TelemetryProperties, TelemetrySettings } from "../ITelemetryProvider"
/**
 * PostHog implementation of the telemetry provider interface
 * Handles PostHog-specific analytics tracking
 */
export class PostHogTelemetryProvider implements ITelemetryProvider {
	private client: PostHog
	private telemetrySettings: TelemetrySettings
	private isSharedClient: boolean

	readonly name = "PostHogTelemetryProvider"

	constructor(sharedClient?: PostHog) {
		this.isSharedClient = !!sharedClient

		// Use shared PostHog client if provided, otherwise create a new one
		if (sharedClient) {
			this.client = sharedClient
		} else {
			// Only create a new client if we have an API key
			if (!posthogConfig.apiKey) {
				throw new Error("PostHog API key is required to create a new client")
			}
			this.client = new PostHog(posthogConfig.apiKey, {
				host: posthogConfig.host,
			})
		}

		// Initialize telemetry settings
		this.telemetrySettings = {
			extensionEnabled: true,
			hostEnabled: true,
			level: "all",
		}
	}
	public async initialize(): Promise<PostHogTelemetryProvider> {
		// Listen for host telemetry changes
		HostProvider.env.subscribeToTelemetrySettings(
			{},
			{
				onResponse: (event: { isEnabled: Setting }) => {
					const hostEnabled = event.isEnabled === Setting.ENABLED || event.isEnabled === Setting.UNSUPPORTED
					this.telemetrySettings.hostEnabled = hostEnabled
				},
			},
		)

		// Check host-specific telemetry setting (e.g. VS Code setting)
		const hostSettings = await HostProvider.env.getTelemetrySettings({})
		if (hostSettings.isEnabled === Setting.DISABLED) {
			this.telemetrySettings.hostEnabled = false
		}

		this.telemetrySettings.level = await this.getTelemetryLevel()
		return this
	}

	public log(event: string, properties?: TelemetryProperties): void {
		if (!this.isEnabled() || this.telemetrySettings.level === "off") {
			return
		}

		// Filter events based on telemetry level
		if (this.telemetrySettings.level === "error") {
			if (!event.includes("error")) {
				return
			}
		}

		this.client.capture({
			distinctId: getDistinctId(),
			event,
			properties: {
				...properties,
				user: this.gitUserInfo.username,
				email: this.gitUserInfo.email,
			},
		})
	}

	public logRequired(event: string, properties?: TelemetryProperties): void {
		this.client.capture({
			distinctId: getDistinctId(),
			event,
			properties: {
				...properties,
				_required: true, // Mark as required event
				user: this.gitUserInfo.username,
				email: this.gitUserInfo.email,
			},
		})
	}

	public identifyUser(userInfo: ClineAccountUserInfo, properties: TelemetryProperties = {}): void {
		const distinctId = getDistinctId()
		// Only identify user if telemetry is enabled and user ID is different than the currently set distinct ID
		if (this.isEnabled() && userInfo && userInfo?.id !== distinctId) {
			this.client.identify({
				distinctId: userInfo.id,
				properties: {
					uuid: userInfo.id,
					user: this.gitUserInfo.username,
					email: this.gitUserInfo.email,
					...properties,
					alias: distinctId,
				},
			})
			// Ensure distinct ID is updated so that we will not identify the user again
			setDistinctId(userInfo.id)
		}
	}

	// Set extension-specific telemetry setting - opt-in/opt-out via UI
	public setOptIn(optIn: boolean): void {
		if (optIn && !this.telemetrySettings.extensionEnabled) {
			this.client.optIn()
		}
		if (!optIn && this.telemetrySettings.extensionEnabled) {
			this.client.optOut()
		}
		this.telemetrySettings.extensionEnabled = optIn
	}

	public isEnabled(): boolean {
		return this.telemetrySettings.extensionEnabled && this.telemetrySettings.hostEnabled
	}

	public getSettings(): TelemetrySettings {
		return { ...this.telemetrySettings }
	}

	/**
	 * Record a counter metric by converting to equivalent PostHog event
	 * This maintains backward compatibility with existing dashboards
	 */
	public recordCounter(
		name: string,
		value: number,
		attributes?: TelemetryProperties,
		_description?: string,
		required = false,
	): void {
		if (!this.isEnabled() && !required) return

		// Convert metric to event format for PostHog
		this.client.capture({
			distinctId: getDistinctId(),
			event: `${name}`,
			properties: {
				...attributes,
				value,
				metric_type: "counter",
				user: this.gitUserInfo.username,
				email: this.gitUserInfo.email,
			},
		})
	}

	/**
	 * Record a histogram metric by converting to equivalent PostHog event
	 * Histograms track distributions, but PostHog events capture individual values
	 */
	public recordHistogram(
		name: string,
		value: number,
		attributes?: TelemetryProperties,
		_description?: string,
		required = false,
	): void {
		if (!this.isEnabled() && !required) return

		// Convert histogram to event format for PostHog
		this.client.capture({
			distinctId: getDistinctId(),
			event: `${name}`,
			properties: {
				...attributes,
				value,
				metric_type: "histogram",
				user: this.gitUserInfo.username,
				email: this.gitUserInfo.email,
			},
		})
	}

	/**
	 * Record a gauge metric by converting to equivalent PostHog event
	 * Gauges track current state, which we can log as state change events
	 */
	public recordGauge(
		name: string,
		value: number | null,
		attributes?: TelemetryProperties,
		_description?: string,
		required = false,
	): void {
		if ((!this.isEnabled() && !required) || value === null) return

		// Convert gauge to event format for PostHog
		this.client.capture({
			distinctId: getDistinctId(),
			event: `${name}`,
			properties: {
				...attributes,
				value,
				metric_type: "gauge",
				user: this.gitUserInfo.username,
				email: this.gitUserInfo.email,
			},
		})
	}

	public async dispose(): Promise<void> {
		// Only shut down the client if it's not shared (we own it)
		if (!this.isSharedClient) {
			try {
				await this.client.shutdown()
			} catch (error) {
				Logger.error("Error shutting down PostHog client:", error)
			}
		}
	}

	/**
	 * Get the current telemetry level from VS Code settings
	 */
	private async getTelemetryLevel(): Promise<TelemetrySettings["level"]> {
		const hostSettings = await HostProvider.env.getTelemetrySettings({})
		if (hostSettings.isEnabled === Setting.DISABLED) {
			return "off"
		}
		return getErrorLevelFromString(hostSettings.errorLevel)
	}

	// TAG:HAI
	/** Git user information (username and email) for tracking user identity */
	// This is used to identify the user in PostHog and Langfuse
	private readonly gitUserInfo: {
		username: string
		email: string
	} = getGitUserInfo()
}
