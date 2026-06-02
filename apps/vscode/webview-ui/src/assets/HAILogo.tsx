import React from "react"

interface HAILogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	className?: string
}

const HAILogo = ({ className, ...props }: HAILogoProps) => {
	const handleImageError = () => {
		console.error("Image failed to load")
	}

	const base64Logo =
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAbgAAABnCAMAAABFC6fPAAAC8VBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+uQeGaAAAA+nRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xd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"

	return (
		<div className="flex items-center justify-center w-full">
			<img
				alt="HAI Logo"
				className={`mx-auto mb-4 object-contain ${className}`}
				onError={handleImageError}
				src={base64Logo}
				style={{
					maxWidth: "100%",
					maxHeight: "200px",
					display: "block",
				}}
				{...props}
			/>
		</div>
	)
}

export default HAILogo
