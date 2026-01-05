import { EmptyRequest } from "@shared/proto/cline/common"
import ClineLogoVariable from "@/assets/ClineLogoVariable"
import HAILogo from "@/assets/HAILogo"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { UiServiceClient } from "@/services/grpc-client"

interface HomeHeaderProps {
	shouldShowQuickWins?: boolean
}

const HomeHeader = ({ shouldShowQuickWins = false }: HomeHeaderProps) => {
	const { environment } = useExtensionState()

	const handleTakeATour = async () => {
		try {
			await UiServiceClient.openWalkthrough(EmptyRequest.create())
		} catch (error) {
			console.error("Error opening walkthrough:", error)
		}
	}

	// Check if it's December for festive logo
	const isHAILogo = true
	const LogoComponent = isHAILogo ? HAILogo : ClineLogoVariable

	return (
		<div className="flex flex-col items-center mb-5">
			<style>
				{`
					@keyframes logo-pop-in {
						0% {
							opacity: 0;
							transform: scale(0.95);
						}
						60% {
							opacity: 1;
							transform: scale(1.02);
						}
						100% {
							opacity: 1;
							transform: scale(1);
						}
					}
					.logo-animate {
						animation: logo-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
					}
				`}
			</style>
			<div className="my-7 logo-animate">
				<LogoComponent className="pl-10 pr-10" environment={environment} />
			</div>
			<div className="text-center items-center justify-center">
				<h1 className="m-0 font-bold">How can I help you today?</h1>
				<p className="p-10 text-start">
					I can handle complex software development tasks step-by-step. With tools that let me create & edit files,
					explore complex projects, use the browser, and execute terminal commands (after you grant permission), I can
					assist you in ways that go beyond code completion or tech support. I can even use MCP to create new tools and
					extend my own capabilities.
				</p>
			</div>
			{shouldShowQuickWins && (
				<div className="mt-4">
					<button
						className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-panel bg-white/2 hover:bg-list-background-hover transition-colors duration-150 ease-in-out text-code-foreground text-sm font-medium cursor-pointer"
						onClick={handleTakeATour}
						type="button">
						Take a Tour
						<span className="codicon codicon-play scale-90"></span>
					</button>
				</div>
			)}
		</div>
	)
}

export default HomeHeader
