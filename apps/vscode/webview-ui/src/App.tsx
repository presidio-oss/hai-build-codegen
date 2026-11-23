import { IHaiClineTask, IHaiStory, IHaiTask } from "@shared/hai-task"
import type { Boolean, EmptyRequest } from "@shared/proto/cline/common"
import type { HaiTasksLoadRequest } from "@shared/proto/cline/ui"
import { useCallback, useEffect, useState } from "react"
import AccountView from "./components/account/AccountView"
import ChatView from "./components/chat/ChatView"
import DetailedView from "./components/hai/DetailedView"
import { HaiTasksList } from "./components/hai/hai-tasks-list"
import HistoryView from "./components/history/HistoryView"
import MarketplaceView from "./components/marketplace/MarketplaceView"
import McpView from "./components/mcp/configuration/McpConfigurationView"
import { openClinePassSubscriptionIfPending } from "./components/onboarding/clinePassSubscribe"
import OnboardingView from "./components/onboarding/OnboardingView"
import SettingsView from "./components/settings/SettingsView"
import WorktreesView from "./components/worktrees/WorktreesView"
import { useClineAuth } from "./context/ClineAuthContext"
import { useExtensionState } from "./context/ExtensionStateContext"
import { Providers } from "./Providers"
import { UiServiceClient } from "./services/grpc-client"

const AppContent = () => {
	const {
		didHydrateState,
		showWelcome,
		shouldShowAnnouncement,
		showMarketplace,
		showMcp,
		mcpTab,
		showSettings,
		settingsNavigationRequest,
		showHistory,
		showAccount,
		showWorktrees,
		showHaiTaskList,
		showAnnouncement,
		setShowAnnouncement,
		setShouldShowAnnouncement,
		closeMcpView,
		navigateToHistory,
		navigateToHaiTaskList,
		hideSettings,
		hideHistory,
		hideAccount,
		hideWorktrees,
		hideHaiTaskList,
		closeMarketplaceView,
		hideAnnouncement,
	} = useExtensionState()

	const { clineUser, organizations, activeOrganization } = useClineAuth()

	const [selectedTask, setSelectedTask] = useState<IHaiClineTask | null>(null)
	const [taskList, setTaskList] = useState<IHaiStory[]>([])
	const [taskLastUpdatedTs, setTaskLastUpdatedTs] = useState<string>("")
	const [haiConfigFolder, setHaiConfigFolder] = useState<string>("")
	const [detailedTask, setDetailedTask] = useState<IHaiTask | null>(null)
	const [detailedStory, setDetailedStory] = useState<IHaiStory | null>(null)

	const showUpdateAnnouncementModal = useCallback(() => {
		setShowAnnouncement(true)
		UiServiceClient.onDidShowAnnouncement({} as EmptyRequest)
			.then((response: Boolean) => {
				setShouldShowAnnouncement(response.value)
			})
			.catch((error) => {
				console.error("Failed to acknowledge announcement:", error)
			})
	}, [setShouldShowAnnouncement, setShowAnnouncement])

	useEffect(() => {
		if (!didHydrateState || showWelcome || !shouldShowAnnouncement || showAnnouncement) {
			return
		}
		showUpdateAnnouncementModal()
	}, [didHydrateState, showWelcome, shouldShowAnnouncement, showAnnouncement, showUpdateAnnouncementModal])

	// Open the ClinePass subscription page once auth completes. Lives here (not in OnboardingView)
	// because handleAuthCallback unmounts onboarding before the clineUser update arrives.
	useEffect(() => {
		if (clineUser?.uid) {
			openClinePassSubscriptionIfPending(clineUser.appBaseUrl)
		}
	}, [clineUser?.uid, clineUser?.appBaseUrl])

	// Clear the HAI task detail view whenever another top-level view is opened
	useEffect(() => {
		setDetailedTask(null)
		setDetailedStory(null)
	}, [showSettings, showHistory, showMcp, showAccount, showWorktrees, showMarketplace])

	// Subscribe to HAI task data updates
	useEffect(() => {
		const unsubscribe = UiServiceClient.subscribeToHaiTaskData({} as EmptyRequest, {
			onResponse: (data) => {
				// Convert proto stories back to IHaiStory format
				const stories: IHaiStory[] = data.stories.map((story) => ({
					id: story.id,
					prdId: story.prdId,
					name: story.name,
					description: story.description,
					storyTicketId: story.storyTicketId,
					tasks: story.tasks.map((task) => ({
						id: task.id,
						list: task.list,
						acceptance: task.acceptance,
						subTaskTicketId: task.subTaskTicketId,
						status: task.status,
					})),
				}))
				setTaskList(stories)
				setTaskLastUpdatedTs(data.timestamp)
				setHaiConfigFolder(data.folderPath)
			},
			onError: (error) => {
				console.error("Error in HAI task data subscription:", error)
			},
			onComplete: () => {
				console.log("HAI task data subscription completed")
			},
		})

		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
		}
	}, [])

	// Subscribe to HAI Build Task List button clicks and clear detailed state
	useEffect(() => {
		const unsubscribe = UiServiceClient.subscribeToHaiBuildTaskListClicked({} as EmptyRequest, {
			onResponse: () => {
				setDetailedTask(null)
				setDetailedStory(null)
				navigateToHaiTaskList()
			},
			onError: (error) => {
				console.error("Error in HAI Build Task List button clicked subscription:", error)
			},
			onComplete: () => {
				console.log("HAI Build Task List button clicked subscription completed")
			},
		})

		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
		}
	}, [navigateToHaiTaskList])

	// Handler for loading/configuring HAI tasks
	const handleConfigure = useCallback(
		async (loadDefault: boolean) => {
			try {
				const request: HaiTasksLoadRequest = {
					metadata: {},
					folderPath: loadDefault ? haiConfigFolder : "",
					loadDefault: loadDefault,
				}
				await UiServiceClient.loadHaiTasks(request)
			} catch (error) {
				console.error("Failed to load HAI tasks:", error)
			}
		},
		[haiConfigFolder],
	)

	// Handler for resetting HAI tasks
	const handleHaiTaskReset = useCallback(async () => {
		try {
			await UiServiceClient.resetHaiTasks({} as EmptyRequest)
		} catch (error) {
			console.error("Failed to reset HAI tasks:", error)
		}
	}, [])

	// Handler for task click
	const handleTaskClick = useCallback(
		(task: IHaiTask) => {
			setDetailedTask(task)
			const story = taskList.find((story) => story.tasks.some((t) => t.id === task.id && t === task))
			setDetailedStory(story || null)
		},
		[taskList],
	)

	// Handler for story click
	const handleStoryClick = useCallback((story: IHaiStory) => {
		setDetailedStory(story)
		setDetailedTask(null)
	}, [])

	// Handler for breadcrumb navigation
	const handleBreadcrumbClick = useCallback((type: string) => {
		if (type === "USER_STORIES") {
			setDetailedTask(null)
			setDetailedStory(null)
		} else if (type === "USER_STORY") {
			setDetailedTask(null)
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
			{detailedTask || detailedStory ? (
				<DetailedView
					onBreadcrumbClick={handleBreadcrumbClick}
					onTaskClick={handleTaskClick}
					onTaskSelect={(selectedTask) => {
						setSelectedTask(selectedTask)
						setDetailedTask(null)
						setDetailedStory(null)
						hideHaiTaskList()
					}}
					story={detailedStory}
					task={detailedTask}
				/>
			) : (
				<>
					{showSettings && <SettingsView navigationRequest={settingsNavigationRequest} onDone={hideSettings} />}
					{showHistory && <HistoryView onDone={hideHistory} />}
					{showMarketplace && (
						<MarketplaceView initialType={mcpTab ? "mcp" : undefined} onDone={closeMarketplaceView} />
					)}
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
					{showHaiTaskList && (
						<HaiTasksList
							haiTaskLastUpdatedTs={taskLastUpdatedTs}
							haiTaskList={taskList}
							onCancel={hideHaiTaskList}
							onConfigure={handleConfigure}
							onHaiTaskReset={handleHaiTaskReset}
							onStoryClick={handleStoryClick}
							onTaskClick={handleTaskClick}
							selectedHaiTask={(selectedTask: IHaiClineTask) => {
								setSelectedTask(selectedTask)
								hideHaiTaskList()
							}}
						/>
					)}
					{/* Do not conditionally load ChatView, it's expensive and there's state we don't want to lose (user input, disableInput, askResponse promise, etc.) */}
					<ChatView
						haiConfigFolder={haiConfigFolder}
						hideAnnouncement={hideAnnouncement}
						isHidden={
							showSettings ||
							showHistory ||
							showMarketplace ||
							showMcp ||
							showAccount ||
							showWorktrees ||
							showHaiTaskList
						}
						onTaskSelect={(selectedTask: IHaiClineTask | null) => {
							setSelectedTask(selectedTask)
						}}
						selectedHaiTask={selectedTask}
						showAnnouncement={showAnnouncement}
						showHaiTaskListView={navigateToHaiTaskList}
						showHistoryView={navigateToHistory}
					/>
				</>
			)}
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
