import type { IHaiClineTask, IHaiStory, IHaiTask } from "@shared/hai-task"
import { EmptyRequest } from "@shared/proto/cline/common"
import { useCallback, useEffect, useState } from "react"
import AccountView from "./components/account/AccountView"
import ChatView from "./components/chat/ChatView"
import ClineKanbanLaunchModal, { CLINE_KANBAN_MODAL_DISMISS_ID } from "./components/common/ClineKanbanLaunchModal"
import { HaiTasksList } from "./components/hai/hai-tasks-list"
import HistoryView from "./components/history/HistoryView"
import McpView from "./components/mcp/configuration/McpConfigurationView"
import OnboardingView from "./components/onboarding/OnboardingView"
import SettingsView from "./components/settings/SettingsView"
import WorktreesView from "./components/worktrees/WorktreesView"
import { useClineAuth } from "./context/ClineAuthContext"
import { useExtensionState } from "./context/ExtensionStateContext"
import { Providers } from "./Providers"
import { StateServiceClient, UiServiceClient } from "./services/grpc-client"

const KANBAN_MODAL_ENABLED = false

const AppContent = () => {
	const {
		didHydrateState,
		showWelcome,
		shouldShowAnnouncement,
		dismissedBanners,
		showMcp,
		mcpTab,
		showSettings,
		settingsTargetSection,
		showHistory,
		showAccount,
		showWorktrees,
		showHaiTaskList,
		showAnnouncement,
		setShowAnnouncement,
		setShouldShowAnnouncement,
		closeMcpView,
		navigateToMcp,
		navigateToSettings,
		navigateToChat,
		navigateToHistory,
		navigateToHaiTaskList,
		hideSettings,
		hideHistory,
		hideAccount,
		hideWorktrees,
		hideHaiTaskList,
		hideAnnouncement,
	} = useExtensionState()
	const [showKanbanModal, setShowKanbanModal] = useState(false)
	const [hasShownKanbanModal, setHasShownKanbanModal] = useState(false)
	const [selectedHaiTask, setSelectedHaiTask] = useState<IHaiClineTask | null>(null)
	const [haiTaskList, setHaiTaskList] = useState<IHaiStory[]>([])
	const [haiTaskLastUpdatedTs, setHaiTaskLastUpdatedTs] = useState<string | undefined>(undefined)
	const [haiConfigFolder, setHaiConfigFolder] = useState("")

	const { clineUser, organizations, activeOrganization } = useClineAuth()

	useEffect(() => {
		const unsubscribeHaiTaskData = UiServiceClient.subscribeToHaiTaskData(EmptyRequest.create({}), {
			onResponse: (response) => {
				setHaiTaskList(response.stories || [])
				setHaiTaskLastUpdatedTs(response.timestamp || undefined)
				setHaiConfigFolder(response.folderPath || "")
			},
			onError: (error) => {
				console.error("Error in HAI task data subscription:", error)
			},
			onComplete: () => {},
		})

		return () => {
			unsubscribeHaiTaskData()
		}
	}, [])

	const handleHaiTasksConfigure = useCallback(
		(loadDefault: boolean) => {
			UiServiceClient.loadHaiTasks({
				metadata: {},
				folderPath: loadDefault ? haiConfigFolder : "",
				loadDefault,
			}).catch((error) => {
				console.error("Failed to load HAI tasks:", error)
			})
		},
		[haiConfigFolder],
	)

	const handleHaiTaskReset = useCallback(() => {
		UiServiceClient.resetHaiTasks(EmptyRequest.create({}))
			.then(() => {
				setHaiTaskList([])
				setHaiTaskLastUpdatedTs(undefined)
				setSelectedHaiTask(null)
			})
			.catch((error) => {
				console.error("Failed to reset HAI tasks:", error)
			})
	}, [])

	const handleHaiTaskSelect = useCallback(
		(task: IHaiClineTask) => {
			setSelectedHaiTask(task)
			hideHaiTaskList()
		},
		[hideHaiTaskList],
	)

	const handleHaiTaskClick = useCallback((_task: IHaiTask) => {
		// Reserved for detailed HAI task view.
	}, [])

	const handleHaiStoryClick = useCallback((_story: IHaiStory) => {
		// Reserved for detailed HAI story view.
	}, [])

	useEffect(() => {
		const emptyRequest = EmptyRequest.create({})

		const unsubscribeChat = UiServiceClient.subscribeToChatButtonClicked(emptyRequest, {
			onResponse: () => {
				setSelectedHaiTask(null)
				navigateToChat()
			},
			onError: (error) => {
				console.error("Error in chat button subscription:", error)
			},
			onComplete: () => {},
		})

		const unsubscribeMcp = UiServiceClient.subscribeToMcpButtonClicked(emptyRequest, {
			onResponse: () => {
				navigateToMcp()
			},
			onError: (error) => {
				console.error("Error in MCP button subscription:", error)
			},
			onComplete: () => {},
		})

		const unsubscribeHistory = UiServiceClient.subscribeToHistoryButtonClicked(emptyRequest, {
			onResponse: () => {
				navigateToHistory()
			},
			onError: (error) => {
				console.error("Error in history button subscription:", error)
			},
			onComplete: () => {},
		})

		const unsubscribeTaskList = UiServiceClient.subscribeToHaiBuildTaskListClicked(emptyRequest, {
			onResponse: () => {
				setSelectedHaiTask(null)
				navigateToHaiTaskList()
			},
			onError: (error) => {
				console.error("Error in HAI task list button subscription:", error)
			},
			onComplete: () => {},
		})

		const unsubscribeSettings = UiServiceClient.subscribeToSettingsButtonClicked(emptyRequest, {
			onResponse: () => {
				navigateToSettings()
			},
			onError: (error) => {
				console.error("Error in settings button subscription:", error)
			},
			onComplete: () => {},
		})

		return () => {
			unsubscribeChat()
			unsubscribeMcp()
			unsubscribeHistory()
			unsubscribeTaskList()
			unsubscribeSettings()
		}
	}, [navigateToChat, navigateToHistory, navigateToHaiTaskList, navigateToMcp, navigateToSettings])

	const showUpdateAnnouncementModal = useCallback(() => {
		setShowAnnouncement(true)
		UiServiceClient.onDidShowAnnouncement({} as EmptyRequest)
			.then((response) => {
				setShouldShowAnnouncement(response.value)
			})
			.catch((error) => {
				console.error("Failed to acknowledge announcement:", error)
			})
	}, [setShouldShowAnnouncement, setShowAnnouncement])

	useEffect(() => {
		if (!KANBAN_MODAL_ENABLED) {
			setHasShownKanbanModal(true)
			setShowKanbanModal(false)
			return
		}

		if (!didHydrateState || showWelcome || hasShownKanbanModal) {
			return
		}
		const hasDismissedKanbanModal = dismissedBanners?.some((banner) => banner.bannerId === CLINE_KANBAN_MODAL_DISMISS_ID)
		if (!hasDismissedKanbanModal) {
			setShowKanbanModal(true)
		}
		setHasShownKanbanModal(true)
	}, [didHydrateState, dismissedBanners, hasShownKanbanModal, showWelcome])

	// Keep update announcements queued until the Kanban modal has either shown and closed or been skipped.
	useEffect(() => {
		if (!KANBAN_MODAL_ENABLED) {
			if (!didHydrateState || showWelcome || !shouldShowAnnouncement || showAnnouncement) {
				return
			}
			showUpdateAnnouncementModal()
			return
		}

		if (!didHydrateState || showWelcome || !shouldShowAnnouncement || showAnnouncement) {
			return
		}
		const isKanbanModalBlocking = showKanbanModal || !hasShownKanbanModal
		if (isKanbanModalBlocking) {
			return
		}
		showUpdateAnnouncementModal()
	}, [
		didHydrateState,
		showWelcome,
		shouldShowAnnouncement,
		showAnnouncement,
		showKanbanModal,
		hasShownKanbanModal,
		showUpdateAnnouncementModal,
	])

	const handleCloseKanbanModal = useCallback((doNotShowAgain: boolean) => {
		setShowKanbanModal(false)
		if (doNotShowAgain) {
			StateServiceClient.dismissBanner({ value: CLINE_KANBAN_MODAL_DISMISS_ID }).catch((error) =>
				console.error("Failed to persist Cline Kanban modal dismissal:", error),
			)
		}
	}, [])

	if (!didHydrateState) {
		return null
	}

	if (showWelcome) {
		return <OnboardingView />
	}

	return (
		<div className="flex h-screen w-full flex-col">
			{KANBAN_MODAL_ENABLED && <ClineKanbanLaunchModal onClose={handleCloseKanbanModal} open={showKanbanModal} />}
			{showHaiTaskList && (
				<HaiTasksList
					haiTaskLastUpdatedTs={haiTaskLastUpdatedTs}
					haiTaskList={haiTaskList}
					onCancel={hideHaiTaskList}
					onConfigure={handleHaiTasksConfigure}
					onHaiTaskReset={handleHaiTaskReset}
					onStoryClick={handleHaiStoryClick}
					onTaskClick={handleHaiTaskClick}
					selectedHaiTask={handleHaiTaskSelect}
				/>
			)}
			{showSettings && <SettingsView onDone={hideSettings} targetSection={settingsTargetSection} />}
			{showHistory && <HistoryView onDone={hideHistory} />}
			{showMcp && <McpView initialTab={mcpTab} onDone={closeMcpView} />}
			{showAccount && (
				<AccountView
					activeOrganization={activeOrganization}
					clineUser={clineUser}
					onDone={hideAccount}
					organizations={organizations}
				/>
			)}
			{showWorktrees && <WorktreesView onDone={hideWorktrees} />}
			{/* Do not conditionally load ChatView, it's expensive and there's state we don't want to lose (user input, disableInput, askResponse promise, etc.) */}
			<ChatView
				haiConfigFolder={haiConfigFolder}
				hideAnnouncement={hideAnnouncement}
				isHidden={showSettings || showHistory || showMcp || showAccount || showWorktrees}
				onTaskSelect={setSelectedHaiTask}
				selectedHaiTask={selectedHaiTask}
				showAnnouncement={showAnnouncement}
				showHaiTaskListView={navigateToHaiTaskList}
				showHistoryView={navigateToHistory}
			/>
		</div>
	)
}

const App = () => {
	return (
		<Providers>
			<AppContent />
		</Providers>
	)
}

export default App
