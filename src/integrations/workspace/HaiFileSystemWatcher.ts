import * as fs from "fs/promises"
import ignore from "ignore"
import * as path from "path"
import Watcher from "watcher"
import { Logger } from "@/shared/services/Logger"
import { Controller } from "../../core/controller"
import { GlobalFileNames } from "../../global-constants"
import { HaiBuildDefaults } from "../../shared/haiDefaults"

class HaiFileSystemWatcher {
	private sourceFolder: string
	private ig: ReturnType<typeof ignore>
	private providerRef: WeakRef<Controller>
	private watcher: Watcher | undefined

	constructor(provider: Controller, sourceFolder: string) {
		this.sourceFolder = sourceFolder
		this.providerRef = new WeakRef(provider)
		this.ig = ignore()
		this.initializeWatcher().then()
	}

	private async loadGitIgnore() {
		try {
			const gitignorePath = path.join(this.sourceFolder, ".gitignore")
			const content = await fs.readFile(gitignorePath, "utf-8")

			this.ig.add(
				content
					.split("\n")
					.filter(
						(line) =>
							line.trim() &&
							!line.startsWith("#") &&
							!line.includes(GlobalFileNames.haiConfig) &&
							!line.includes(GlobalFileNames.experts),
					),
			)
		} catch (error) {
			Logger.log("HaiFileSystemWatcher No .gitignore found, using default exclusions.")
		}

		this.ig.add([...HaiBuildDefaults.defaultDirsToIgnore, HaiBuildDefaults.defaultContextDirectory])
	}

	private async initializeWatcher() {
		await this.loadGitIgnore()

		this.watcher = new Watcher(this.sourceFolder, {
			recursive: true,
			debounce: 1000,
			ignoreInitial: true,
			ignore: (targetPath: string) => {
				if (!targetPath || targetPath.trim() === "") {
					Logger.warn("HaiFileSystemWatcher Ignoring empty or invalid path.")
					return true
				}

				const relativePath = path.relative(this.sourceFolder, targetPath)
				if (relativePath.startsWith("..")) {
					Logger.log(`HaiFileSystemWatcher Path ${targetPath} is outside the workspace folder.`)
					return true
				}

				if (relativePath === "") {
					return false
				}
				const isIgnored = this.ig.ignores(relativePath)
				return isIgnored
			},
		})

		this.watcher.on("unlink", (filePath: any) => {
			Logger.log("HaiFileSystemWatcher File deleted", filePath)

			// Check for .hai.config
			if (this.isHaiConfigPath(filePath)) {
				this.providerRef.deref()?.updateTelemetryConfig()
			}

			// Check for the experts
			// if (filePath.includes(GlobalFileNames.experts)) {
			// 	this.providerRef.deref()?.loadExperts()
			// }

			// this.providerRef.deref()?.invokeReindex([filePath], FileOperations.Delete)
		})

		this.watcher.on("add", (filePath) => {
			Logger.log("HaiFileSystemWatcher File added", filePath)

			// Check for .hai.config
			if (this.isHaiConfigPath(filePath)) {
				this.providerRef.deref()?.updateTelemetryConfig()
			}

			// Check for the experts
			// if (filePath.includes(GlobalFileNames.experts)) {
			// 	this.providerRef.deref()?.loadExperts()
			// }

			// this.providerRef.deref()?.invokeReindex([filePath], FileOperations.Create)
		})

		this.watcher.on("change", (filePath) => {
			Logger.log("HaiFileSystemWatcher File changes", filePath)

			// Check for .hai.config
			if (this.isHaiConfigPath(filePath)) {
				this.providerRef.deref()?.updateTelemetryConfig()
			}

			// Check for the experts
			// if (filePath.includes(GlobalFileNames.experts)) {
			// 	this.providerRef.deref()?.loadExperts()
			// }
			// this.providerRef.deref()?.invokeReindex([filePath], FileOperations.Change)
		})
	}

	isHaiConfigPath(filePath: string) {
		// Get the relative path from the workspace root
		const relativePath = path.relative(this.sourceFolder, filePath)
		// Check if this is exactly the .hai.config file at the root of the workspace
		// It should match just ".hai.config" without any directory prefix
		return relativePath === GlobalFileNames.haiConfig
	}

	async dispose() {
		this.watcher?.close()
	}
}

export default HaiFileSystemWatcher
