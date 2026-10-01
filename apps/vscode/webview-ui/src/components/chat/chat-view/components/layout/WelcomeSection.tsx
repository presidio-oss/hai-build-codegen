import { BannerAction, BannerActionType } from "@shared/cline/banner"
import React, { useCallback, useEffect, useState } from "react"
import HAILogo from "@/assets/HAILogo"
import WhatsNewModal from "@/components/common/WhatsNewModal"
import { useApiConfigurationHandlers } from "@/components/settings/utils/useApiConfigurationHandlers"
import QuickActions from "@/components/welcome/QuickActions"
import { SuggestedTasks } from "@/components/welcome/SuggestedTasks"
import CreateWorktreeModal from "@/components/worktrees/CreateWorktreeModal"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { AccountServiceClient, StateServiceClient, UiServiceClient } from "@/services/grpc-client"
import { WelcomeSectionProps } from "../../types/chatTypes"

/**
 * Welcome section shown when there's no active task
 * Shows the HAI welcome message and quick-action cards
 */
export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
	showAnnouncement,
	hideAnnouncement,
	showHistoryView,
	version,
	taskHistory: _taskHistory,
	shouldShowQuickWins,
	onTaskSelect,
	showHaiTaskListView,
}) => {
	const { openRouterModels, navigateToSettings, navigateToSettingsModelPicker, welcomeBanners } = useExtensionState()

	// Track if we've shown the "What's New" modal this session
	const [hasShownWhatsNewModal, setHasShownWhatsNewModal] = useState(false)
	const [showWhatsNewModal, setShowWhatsNewModal] = useState(false)

	// Quick launch worktree modal
	const [showCreateWorktreeModal, setShowCreateWorktreeModal] = useState(false)

	const { handleFieldsChange } = useApiConfigurationHandlers()

	// Open modal once we have welcome banners
	useEffect(() => {
		if (showAnnouncement && !hasShownWhatsNewModal && welcomeBanners && welcomeBanners.length > 0) {
			setShowWhatsNewModal(true)
			setHasShownWhatsNewModal(true)
		}
	}, [welcomeBanners, showAnnouncement, hasShownWhatsNewModal])

	const handleCloseWhatsNewModal = useCallback(() => {
		setShowWhatsNewModal(false)
		// Call hideAnnouncement to persist dismissal (same as old banner behavior)
		hideAnnouncement()
		if (welcomeBanners && welcomeBanners.length > 0) {
			for (const banner of welcomeBanners) {
				StateServiceClient.dismissBanner({ value: banner.id }).catch(console.error)
			}
		}
	}, [hideAnnouncement, welcomeBanners])

	/**
	 * Action handler - maps action types to actual implementations
	 */
	const handleBannerAction = useCallback(
		(action: BannerAction) => {
			switch (action.action) {
				case BannerActionType.Link:
					if (action.arg) {
						UiServiceClient.openUrl({ value: action.arg }).catch(console.error)
					}
					break

				case BannerActionType.SetModel: {
					const modelId = action.arg || "anthropic/claude-sonnet-4.5"
					const initialModelTab = action.tab || "recommended"
					handleFieldsChange({
						planModeOpenRouterModelId: modelId,
						actModeOpenRouterModelId: modelId,
						planModeOpenRouterModelInfo: openRouterModels[modelId],
						actModeOpenRouterModelInfo: openRouterModels[modelId],
						planModeApiProvider: "cline",
						actModeApiProvider: "cline",
					})
					navigateToSettingsModelPicker({ targetSection: "api-config", initialModelTab })
					break
				}

				case BannerActionType.ShowAccount:
					AccountServiceClient.accountLoginClicked({}).catch((err) => console.error("Failed to get login URL:", err))
					break

				case BannerActionType.ShowApiSettings:
					if (action.arg) {
						// Pre-select the provider before navigating
						handleFieldsChange({
							planModeApiProvider: action.arg as any,
							actModeApiProvider: action.arg as any,
						})
					}
					navigateToSettings("api-config")
					break

				case BannerActionType.ShowFeatureSettings:
					navigateToSettings("features")
					break

				case BannerActionType.InstallCli:
					StateServiceClient.installClineCli({}).catch((error) =>
						console.error("Failed to initiate CLI installation:", error),
					)
					break

				default:
					console.warn("Unknown banner action:", action.action)
			}
		},
		[handleFieldsChange, openRouterModels, navigateToSettings, navigateToSettingsModelPicker],
	)

	return (
		<div className="flex flex-col flex-1 w-full h-full p-0 m-0">
			<WhatsNewModal
				onBannerAction={handleBannerAction}
				onClose={handleCloseWhatsNewModal}
				open={showWhatsNewModal}
				version={version}
				welcomeBanners={welcomeBanners}
			/>
			<div className="overflow-y-auto flex flex-col pb-2.5">
				<SuggestedTasks shouldShowQuickWins={shouldShowQuickWins} />
				<div style={{ height: "auto", maxWidth: "200px", margin: "20px" }}>
					<HAILogo className="hai-logo" />
				</div>
				<div style={{ padding: "0 20px", flexShrink: 0 }}>
					<h2>How can I help you today?</h2>
					<p>
						I can handle complex software development tasks step-by-step. With tools that let me create & edit files,
						explore complex projects, use the browser, and execute terminal commands (after you grant permission), I
						can assist you in ways that go beyond code completion or tech support. I can even use MCP to create new
						tools and extend my own capabilities.
					</p>
				</div>
				<QuickActions
					onTaskSelect={onTaskSelect}
					showHaiTaskListView={showHaiTaskListView}
					showHistoryView={showHistoryView}
				/>
			</div>

			{/* Quick launch worktree modal */}
			<CreateWorktreeModal
				onClose={() => setShowCreateWorktreeModal(false)}
				open={showCreateWorktreeModal}
				openAfterCreate={true}
			/>
		</div>
	)
}
