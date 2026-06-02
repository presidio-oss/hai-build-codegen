/**
 * GitHub service for interacting with GitHub repositories
 */

interface GitHubRepoInfo {
	owner: string
	repo: string
}

interface GitHubRepoData {
	stargazers_count: number
	[key: string]: any
}

interface GitHubReadmeData {
	content: string
	encoding: string
	[key: string]: any
}

function parseGitHubUrl(githubUrl: string): GitHubRepoInfo {
	try {
		const url = new URL(githubUrl)

		if (!url.hostname.includes("github.com")) {
			throw new Error("Not a GitHub URL")
		}

		const pathSegments = url.pathname.split("/").filter((segment) => segment.length > 0)

		if (pathSegments.length < 2) {
			throw new Error("Invalid GitHub repository URL")
		}

		return {
			owner: pathSegments[0],
			repo: pathSegments[1],
		}
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to parse GitHub URL: ${error.message}`)
		}
		throw new Error("Failed to parse GitHub URL")
	}
}

export async function getStarCount(githubUrl: string): Promise<number> {
	try {
		const { owner, repo } = parseGitHubUrl(githubUrl)
		const apiUrl = `https://api.github.com/repos/${owner}/${repo}`

		const response = await fetch(apiUrl, {
			headers: {
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "HAI-Opensource-Client",
			},
		})

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(`Repository ${owner}/${repo} not found`)
			} else if (response.status === 403) {
				throw new Error("GitHub API rate limit exceeded")
			} else {
				throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
			}
		}

		const data = (await response.json()) as GitHubRepoData
		return data.stargazers_count
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}
		throw new Error("Failed to get repository star count")
	}
}

export async function getReadmeContent(githubUrl: string): Promise<string> {
	try {
		const { owner, repo } = parseGitHubUrl(githubUrl)
		const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`

		const response = await fetch(apiUrl, {
			headers: {
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "HAI-Opensource-Client",
			},
		})

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(`README not found for repository ${owner}/${repo}`)
			} else if (response.status === 403) {
				throw new Error("GitHub API rate limit exceeded")
			} else {
				throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
			}
		}

		const data = (await response.json()) as GitHubReadmeData

		if (data.encoding === "base64") {
			return Buffer.from(data.content, "base64").toString("utf-8")
		}

		return data.content
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}
		throw new Error("Failed to get repository README content")
	}
}
