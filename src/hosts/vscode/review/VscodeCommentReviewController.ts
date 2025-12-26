import * as vscode from "vscode"
import { sendAddToInputEvent } from "@/core/controller/ui/subscribeToAddToInput"
import { CommentReviewController, type OnReplyCallback, type ReviewComment } from "@/integrations/editor/CommentReviewController"
import { DIFF_VIEW_URI_SCHEME } from "../VscodeDiffViewProvider"

/**
 * HAI Logo Base 64
 */
const HAI_AVATAR_URL =
	"data:image/png;base64,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"

/**
 * VS Code implementation of CommentReviewController.
 *
 * Uses VS Code's Comment API to create inline comment threads on files.
 * Comments appear in VS Code's Comments Panel and inline in editors.
 */
export class VscodeCommentReviewController extends CommentReviewController implements vscode.Disposable {
	private commentController: vscode.CommentController
	private threads: Map<string, vscode.CommentThread> = new Map()
	/** Maps thread to its absolute file path (needed because virtual URIs don't contain the full path) */
	private threadFilePaths: Map<vscode.CommentThread, string> = new Map()
	private onReplyCallback?: OnReplyCallback
	private disposables: vscode.Disposable[] = []

	/** The currently streaming comment thread */
	private streamingThread: vscode.CommentThread | null = null
	private streamingContent: string = ""

	constructor() {
		super()
		// Create the comment controller
		this.commentController = vscode.comments.createCommentController("hai-ai-review", "HAI AI Review")

		// Configure options for the reply input
		this.commentController.options = {
			placeHolder: "Ask a question about this code...",
			prompt: "Reply to HAI",
		}

		// Configure the commenting range provider (optional - allows commenting on any line)
		this.commentController.commentingRangeProvider = {
			provideCommentingRanges: (document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.Range[] => {
				// Allow commenting on any line in the document
				const lineCount = document.lineCount
				return [new vscode.Range(0, 0, lineCount - 1, 0)]
			},
		}

		// Register reply command - this is called when user clicks the Reply button
		this.disposables.push(
			vscode.commands.registerCommand("hai.reviewComment.reply", async (reply: vscode.CommentReply) => {
				await this.handleReply(reply)
			}),
		)

		// Register add to chat command - sends the conversation to HAI's main chat
		this.disposables.push(
			vscode.commands.registerCommand("hai.reviewComment.addToChat", async (thread: vscode.CommentThread) => {
				await this.handleAddToChat(thread)
			}),
		)
	}

	/**
	 * Set the callback for handling user replies
	 */
	setOnReplyCallback(callback: OnReplyCallback): void {
		this.onReplyCallback = callback
	}

	/**
	 * Ensure the comments.openView setting is set to "never" to prevent
	 * the Comments panel from auto-opening when comments are added.
	 */
	async ensureCommentsViewDisabled(): Promise<void> {
		const config = vscode.workspace.getConfiguration("comments")
		const currentValue = config.get<string>("openView")
		if (currentValue !== "never") {
			await config.update("openView", "never", vscode.ConfigurationTarget.Global)
		}
	}

	/**
	 * Add a review comment to a file
	 */
	addReviewComment(comment: ReviewComment): void {
		// Use virtual diff URI if relativePath and fileContent are provided
		// This allows comments to attach to the diff view's virtual documents
		let uri: vscode.Uri
		if (comment.relativePath && comment.fileContent !== undefined) {
			uri = vscode.Uri.parse(`${DIFF_VIEW_URI_SCHEME}:${comment.relativePath}`).with({
				query: Buffer.from(comment.fileContent).toString("base64"),
			})
		} else {
			uri = vscode.Uri.file(comment.filePath)
		}
		const range = new vscode.Range(
			new vscode.Position(comment.startLine, 0),
			new vscode.Position(comment.endLine, Number.MAX_SAFE_INTEGER),
		)

		// Create the comment object
		const commentObj: vscode.Comment = {
			body: new vscode.MarkdownString(comment.comment),
			mode: vscode.CommentMode.Preview,
			author: {
				name: "HAI",
				iconPath: vscode.Uri.parse(HAI_AVATAR_URL),
			},
		}

		// Create the thread
		const thread = this.commentController.createCommentThread(uri, range, [commentObj])

		// Configure thread
		thread.canReply = true
		thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded

		// Store for later management
		const threadKey = this.getThreadKey(comment.filePath, comment.startLine, comment.endLine)
		this.threads.set(threadKey, thread)
		// Store absolute file path for reply handling (virtual URIs don't contain the full path)
		this.threadFilePaths.set(thread, comment.filePath)
	}

	/**
	 * Start a streaming review comment - creates the thread immediately with placeholder text
	 * @param revealComment - If true, opens the document and scrolls to show the comment (default: false)
	 */
	startStreamingComment(
		filePath: string,
		startLine: number,
		endLine: number,
		relativePath?: string,
		fileContent?: string,
		revealComment: boolean = false,
	): void {
		// Use virtual diff URI if relativePath and fileContent are provided
		let uri: vscode.Uri
		if (relativePath && fileContent !== undefined) {
			uri = vscode.Uri.parse(`${DIFF_VIEW_URI_SCHEME}:${relativePath}`).with({
				query: Buffer.from(fileContent).toString("base64"),
			})
		} else {
			uri = vscode.Uri.file(filePath)
		}
		const range = new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(endLine, Number.MAX_SAFE_INTEGER))

		// Create with placeholder
		const commentObj: vscode.Comment = {
			body: new vscode.MarkdownString("_Thinking..._"),
			mode: vscode.CommentMode.Preview,
			author: {
				name: "HAI",
				iconPath: vscode.Uri.parse(HAI_AVATAR_URL),
			},
		}

		// Create the thread
		const thread = this.commentController.createCommentThread(uri, range, [commentObj])
		thread.canReply = true
		thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded

		// Store for streaming updates
		this.streamingThread = thread
		this.streamingContent = ""

		// Store for later management
		const threadKey = this.getThreadKey(filePath, startLine, endLine)
		this.threads.set(threadKey, thread)
		this.threadFilePaths.set(thread, filePath)

		// Open the virtual document and scroll to show the comment in center (only if requested)
		if (revealComment) {
			this.revealCommentInDocument(thread)
		}
	}

	/**
	 * Open the document containing the comment and scroll to show it in center.
	 * This is used during streaming to show each comment as it's added.
	 */
	private async revealCommentInDocument(thread: vscode.CommentThread): Promise<void> {
		try {
			// Open the document (works with virtual URIs)
			const doc = await vscode.workspace.openTextDocument(thread.uri)

			// Show the document and scroll to the comment
			// Use the start of the range so the comment appears in center (not the code block)
			const commentPosition = new vscode.Range(thread.range.start, thread.range.start)
			const editor = await vscode.window.showTextDocument(doc, {
				selection: commentPosition,
				preserveFocus: false,
				preview: true,
			})

			// Reveal with the start position in center so the comment bubble is visible
			editor.revealRange(commentPosition, vscode.TextEditorRevealType.InCenter)
		} catch (error) {
			// Ignore errors - this is not critical
			console.error("[VscodeCommentReviewController] Error revealing comment:", error)
		}
	}

	/**
	 * Append text to the currently streaming comment
	 */
	appendToStreamingComment(chunk: string): void {
		if (!this.streamingThread) {
			return
		}

		this.streamingContent += chunk

		// Update the comment body - reassigning comments triggers VS Code to refresh the UI
		const commentObj: vscode.Comment = {
			body: new vscode.MarkdownString(this.streamingContent || "_Thinking..._"),
			mode: vscode.CommentMode.Preview,
			author: {
				name: "HAI",
				iconPath: vscode.Uri.parse(HAI_AVATAR_URL),
			},
		}
		// Create a new array to ensure VS Code detects the change
		this.streamingThread.comments = [...[commentObj]]
	}

	/**
	 * End the current streaming comment
	 */
	endStreamingComment(): void {
		if (!this.streamingThread) {
			return
		}

		// Finalize with trimmed content
		const finalContent = this.streamingContent.trim() || "_No comment generated_"
		const commentObj: vscode.Comment = {
			body: new vscode.MarkdownString(finalContent),
			mode: vscode.CommentMode.Preview,
			author: {
				name: "HAI",
				iconPath: vscode.Uri.parse(HAI_AVATAR_URL),
			},
		}
		this.streamingThread.comments = [commentObj]

		// Clear streaming state
		this.streamingThread = null
		this.streamingContent = ""
	}

	/**
	 * Add multiple review comments at once
	 */
	addReviewComments(comments: ReviewComment[]): void {
		comments.forEach((comment) => this.addReviewComment(comment))
	}

	/**
	 * Clear all review comments
	 */
	clearAllComments(): void {
		for (const thread of this.threads.values()) {
			this.threadFilePaths.delete(thread)
			thread.dispose()
		}
		this.threads.clear()
	}

	/**
	 * Clear comments for a specific file
	 */
	clearCommentsForFile(filePath: string): void {
		const keysToRemove: string[] = []
		for (const [key, thread] of this.threads.entries()) {
			if (key.startsWith(filePath + ":")) {
				this.threadFilePaths.delete(thread)
				thread.dispose()
				keysToRemove.push(key)
			}
		}
		for (const key of keysToRemove) {
			this.threads.delete(key)
		}
	}

	/**
	 * Get the number of active comment threads
	 */
	getThreadCount(): number {
		return this.threads.size
	}

	/**
	 * Handle a reply from the user
	 */
	private async handleReply(reply: vscode.CommentReply): Promise<void> {
		const thread = reply.thread
		const replyText = reply.text

		// Add user's reply to the thread immediately
		const userComment: vscode.Comment = {
			body: new vscode.MarkdownString(replyText),
			mode: vscode.CommentMode.Preview,
			author: {
				name: "You",
			},
		}
		thread.comments = [...thread.comments, userComment]

		// If we have a callback, get AI response
		if (this.onReplyCallback) {
			// Use stored absolute path (virtual URIs don't contain the full path)
			const filePath = this.threadFilePaths.get(thread) || thread.uri.fsPath
			const startLine = thread.range.start.line
			const endLine = thread.range.end.line

			// Collect existing comments for context (exclude the user's reply we just added)
			const existingComments = thread.comments.slice(0, -1).map((c) => {
				const author = c.author.name
				const body = typeof c.body === "string" ? c.body : c.body.value
				return `${author}: ${body}`
			})

			// Add an empty streaming comment that will be updated as chunks arrive
			let streamingContent = ""
			const updateStreamingComment = (content: string) => {
				const streamingComment: vscode.Comment = {
					body: new vscode.MarkdownString(content || "_Thinking..._"),
					mode: vscode.CommentMode.Preview,
					author: {
						name: "HAI",
						iconPath: vscode.Uri.parse(HAI_AVATAR_URL),
					},
				}
				thread.comments = [...thread.comments.slice(0, -1), streamingComment]
			}

			// Add initial thinking placeholder
			const thinkingComment: vscode.Comment = {
				body: new vscode.MarkdownString("_Thinking..._"),
				mode: vscode.CommentMode.Preview,
				author: {
					name: "HAI",
					iconPath: vscode.Uri.parse(HAI_AVATAR_URL),
				},
			}
			thread.comments = [...thread.comments, thinkingComment]

			// Fire off the AI request with streaming callback
			this.onReplyCallback(filePath, startLine, endLine, replyText, existingComments, (chunk) => {
				// Append chunk and update the comment
				streamingContent += chunk
				updateStreamingComment(streamingContent)
			})
				.then(() => {
					// Ensure final content is displayed
					if (streamingContent) {
						updateStreamingComment(streamingContent)
					}
				})
				.catch((error) => {
					// Show error
					const errorComment: vscode.Comment = {
						body: new vscode.MarkdownString(
							`_Error getting response: ${error instanceof Error ? error.message : "Unknown error"}_`,
						),
						mode: vscode.CommentMode.Preview,
						author: {
							name: "HAI",
							iconPath: vscode.Uri.parse(HAI_AVATAR_URL),
						},
					}
					thread.comments = [...thread.comments.slice(0, -1), errorComment]
				})
		}
	}

	/**
	 * Handle adding the thread conversation to HAI's main chat
	 */
	private async handleAddToChat(thread: vscode.CommentThread): Promise<void> {
		const filePath = this.threadFilePaths.get(thread) || thread.uri.fsPath
		const startLine = thread.range.start.line + 1 // Convert to 1-indexed for display
		const endLine = thread.range.end.line + 1

		// Collect all comments from the thread
		const conversation = thread.comments
			.map((c) => {
				const author = c.author.name === "You" ? "User" : c.author.name
				const body = typeof c.body === "string" ? c.body : c.body.value
				return `**${author}:** ${body}`
			})
			.join("\n\n")

		// Format the context message
		const contextMessage = `The following is a conversation from a code review comment on \`${filePath}\` (lines ${startLine}-${endLine}). The user would like to continue this discussion with you:

---

${conversation}

---

Please continue helping the user with their question about this code.`

		await sendAddToInputEvent(contextMessage)
	}

	private getThreadKey(filePath: string, startLine: number, endLine: number): string {
		return `${filePath}:${startLine}:${endLine}`
	}

	/**
	 * Close all tabs that use the HAI-diff URI scheme (both diff views and regular text documents)
	 */
	async closeDiffViews(): Promise<void> {
		const tabs = vscode.window.tabGroups.all
			.flatMap((tg) => tg.tabs)
			.filter((tab) => {
				// Check for diff view tabs
				if (tab.input instanceof vscode.TabInputTextDiff && tab.input?.original?.scheme === DIFF_VIEW_URI_SCHEME) {
					return true
				}
				// Check for regular text document tabs with HAI-diff scheme (opened during comment reveal)
				if (tab.input instanceof vscode.TabInputText && tab.input?.uri?.scheme === DIFF_VIEW_URI_SCHEME) {
					return true
				}
				return false
			})
		for (const tab of tabs) {
			try {
				await vscode.window.tabGroups.close(tab)
			} catch (error) {
				// Tab might already be closed
				console.warn("Failed to close diff tab:", error)
			}
		}
	}

	dispose(): void {
		this.clearAllComments()
		this.commentController.dispose()
		for (const disposable of this.disposables) {
			disposable.dispose()
		}
	}
}

// Singleton instance for the extension
let instance: VscodeCommentReviewController | undefined

/**
 * Get or create the VscodeCommentReviewController singleton
 */
export function getVscodeCommentReviewController(): VscodeCommentReviewController {
	if (!instance) {
		instance = new VscodeCommentReviewController()
	}
	return instance
}

/**
 * Dispose the VscodeCommentReviewController singleton
 */
export function disposeVscodeCommentReviewController(): void {
	if (instance) {
		instance.dispose()
		instance = undefined
	}
}
