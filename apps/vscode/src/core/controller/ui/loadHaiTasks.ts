import type { IHaiStory } from "@shared/hai-task"
import { Empty } from "@shared/proto/cline/common"
import type { HaiTasksLoadRequest } from "@shared/proto/cline/ui"
import { ShowMessageType } from "@shared/proto/host/window"
import * as fs from "fs"
import * as path from "path"
import { HostProvider } from "@/hosts/host-provider"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"
import { sendHaiTaskDataUpdate } from "./subscribeToHaiTaskData"

/**
 * Get formatted date time string
 */
function getFormattedDateTime(): string {
	const now = new Date()
	return now.toLocaleString()
}

/**
 * Load HAI tasks from a folder path or show folder picker if path is not provided
 * @param controller The controller instance
 * @param request The load request containing optional folder path
 * @returns Empty response
 */
export async function loadHaiTasks(controller: Controller, request: HaiTasksLoadRequest): Promise<Empty> {
	try {
		const { folderPath } = request
		let selectedFolderPath: string | undefined

		if (folderPath) {
			// Load from the provided path (either refresh case or specific path)
			selectedFolderPath = folderPath
		} else {
			// Show folder picker
			const selected = await HostProvider.window.showOpenDialogue({
				canSelectMany: false,
				openLabel: "Open",
				canSelectFiles: false,
				canSelectFolders: true,
			})
			if (selected.paths && selected.paths[0]) {
				selectedFolderPath = selected.paths[0]
			}
		}

		if (selectedFolderPath) {
			const ts = getFormattedDateTime()
			const stories = await fetchTaskFromSelectedFolder(controller, selectedFolderPath, ts)
			controller.stateManager.setWorkspaceStateBatch({
				haiConfig: { folder: selectedFolderPath, ts },
				haiTaskList: stories,
			})
		}

		return Empty.create({})
	} catch (error) {
		Logger.error(`Failed to load HAI tasks: ${error}`)
		throw error
	}
}

/**
 * Fetch tasks from the selected folder and send to webview
 */
async function fetchTaskFromSelectedFolder(_controller: Controller, folderPath: string, ts: string): Promise<IHaiStory[]> {
	const stories = await readHaiTaskList(folderPath)

	if (stories.length === 0) {
		HostProvider.window.showMessage({
			type: ShowMessageType.INFORMATION,
			message: "No tasks found in the selected folder",
		})
	}

	// Send the task data to all subscribed clients
	sendHaiTaskDataUpdate({
		stories,
		folderPath,
		timestamp: ts,
	})

	return stories
}

/**
 * Read HAI task list from PRD folder
 */
async function readHaiTaskList(folderPath: string): Promise<IHaiStory[]> {
	try {
		const prdPath = path.join(folderPath, "PRD")

		if (!fs.existsSync(prdPath)) {
			Logger.error(`PRD folder not found at: ${prdPath}`)
			return []
		}

		const files = fs.readdirSync(prdPath)
		let haiTaskList: IHaiStory[] = []

		files
			.filter((file: string) => file.match(/-feature.json$/))
			.forEach((file: string) => {
				const content = fs.readFileSync(path.join(prdPath, file), "utf-8")
				const prdId = file.split("-")[0].replace("PRD", "")
				const parsedFeaturesList = JSON.parse(content).features
				const featuresListWithPrdId = parsedFeaturesList.map((feature: any) => ({
					...feature,
					prdId: prdId,
				}))
				haiTaskList = [...haiTaskList, ...featuresListWithPrdId]
			})

		return haiTaskList
	} catch (error) {
		Logger.error("Error reading HAI task list:", error)
		return []
	}
}
