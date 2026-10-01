import React, { useState } from "react"

interface LoginPageProps {
	onLoginSuccess: (role: "user" | "admin") => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [failedAttempts, setFailedAttempts] = useState(0)

	const isValid = email.trim() !== "" && password.trim() !== ""
	const isLocked = failedAttempts >= 3

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault()

		if (isLocked) {
			setError("Account locked. Please try again later.")
			return
		}

		// Mock validation logic
		if (email === "admin@example.com" && password === "password") {
			onLoginSuccess("admin")
		} else if (email === "user@example.com" && password === "password") {
			onLoginSuccess("user")
		} else {
			const newAttempts = failedAttempts + 1
			setFailedAttempts(newAttempts)
			setError(
				newAttempts >= 3 ? "Account locked due to too many failed attempts." : "Invalid credentials, please try again",
			)
		}
	}

	return (
		<div className="flex flex-col items-center justify-center h-full p-4">
			<form className="w-full max-w-sm space-y-4" onSubmit={handleLogin}>
				<h2 className="text-xl font-bold">Login</h2>

				{error && <div className="p-2 text-sm text-red-500 bg-red-100 rounded">{error}</div>}

				<input
					className="w-full p-2 border rounded"
					disabled={isLocked}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="Email"
					type="email"
					value={email}
				/>

				<input
					className="w-full p-2 border rounded"
					disabled={isLocked}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Password"
					type="password"
					value={password}
				/>

				<button
					className="w-full p-2 text-white bg-blue-600 rounded disabled:bg-gray-400"
					disabled={!isValid || isLocked}
					type="submit">
					Login
				</button>
			</form>
		</div>
	)
}
