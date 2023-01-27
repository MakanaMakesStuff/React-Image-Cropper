import NextImage from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

export interface CropperSettingsI {
	sliderSteps?: number;
	showSliders?: boolean;
	showSizeInputs?: boolean;
}

export default function Cropper({
	sliderSteps = 100,
	showSliders = true,
	showSizeInputs = true,
}: CropperSettingsI) {
	const [displayImage, setDisplayImage] = useState<HTMLImageElement | null>(
		null
	);
	const [opened, setOpened] = useState(false);
	const [imageSize, setImageSize] = useState({
		x: 0,
		y: 0,
	});

	function handleImageResize({
		x,
		y,
		type = "text",
	}: {
		x?: number;
		y?: number;
		type?: "text" | "range";
	}) {
		if (type === "text") {
			setImageSize({
				x: x ?? imageSize.x,
				y: y ?? imageSize.y,
			});

			drawCanvas("redraw");
		} else {
			if (!displayImage) return;
			const xSize = x ? (x / 100) * displayImage?.naturalWidth : imageSize.x;
			const ySize = y ? (y / 100) * displayImage?.naturalHeight : imageSize.y;
			setImageSize({
				x: xSize,
				y: ySize,
			});

			drawCanvas("redraw");
		}
	}

	function handleImageUpload(e: FormEvent<HTMLInputElement>) {
		e.preventDefault();

		const file = e.currentTarget.files?.[0];

		const imgURL = URL.createObjectURL(file as any);

		const img = new Image();

		img.src = imgURL;

		img.onload = () => {
			setDisplayImage(img);
			setOpened(true);
			setImageSize({
				x: img.naturalWidth,
				y: img.naturalHeight,
			});
		};
	}

	function drawCanvas(action: "draw" | "redraw" = "draw") {
		const canvas = document.querySelector(".cropper") as HTMLCanvasElement;

		if (!canvas || !displayImage) return;

		const ctx = canvas.getContext("2d");

		if (action === "redraw") {
			ctx?.clearRect(0, 0, canvas.width, canvas.height);

			ctx?.drawImage(
				displayImage,
				imageSize.x,
				imageSize.y,
				imageSize.x,
				imageSize.y
			);
			return;
		}

		ctx?.drawImage(
			displayImage,
			0,
			0,
			displayImage?.naturalWidth,
			displayImage?.naturalHeight
		);
	}

	useEffect(() => {
		drawCanvas();
	});

	return (
		<>
			<h1>Cropper</h1>

			{displayImage && opened ? (
				<div
					className="modal"
					style={{
						width: `${displayImage.naturalWidth}px`,
						height: `${displayImage.naturalHeight}px`,
					}}
				>
					<canvas
						className="cropper"
						width={displayImage.naturalWidth}
						height={displayImage.naturalHeight}
					/>

					{imageSize ? (
						<>
							{showSliders ? (
								<div className="sliders">
									<label>
										width:
										<input
											type="range"
											step={0}
											name="xAxis"
											min={0}
											max={sliderSteps}
											value={(imageSize.x / displayImage.naturalWidth) * 100}
											onChange={(e) =>
												handleImageResize({
													x: parseInt(e.currentTarget.value),
													type: "range",
												})
											}
										/>
									</label>

									<br />

									<label>
										height:
										<input
											type="range"
											step={0}
											name="yAxis"
											min={0}
											max={sliderSteps}
											value={(imageSize.y / displayImage.naturalHeight) * 100}
											onChange={(e) =>
												handleImageResize({
													y: parseInt(e.currentTarget.value),
													type: "range",
												})
											}
										/>
									</label>
								</div>
							) : null}

							{showSizeInputs ? (
								<div className="sizeInputs">
									<label>
										width:
										<input
											type="text"
											name="xAxisSize"
											value={imageSize.x}
											onChange={(e) =>
												handleImageResize({
													x: parseInt(e.currentTarget.value),
													type: "text",
												})
											}
										/>
									</label>

									<br />

									<label>
										height:
										<input
											type="text"
											name="yAxisSize"
											value={imageSize.y}
											onChange={(e) =>
												handleImageResize({
													y: parseInt(e.currentTarget.value),
													type: "text",
												})
											}
										/>
									</label>
								</div>
							) : null}
						</>
					) : null}
				</div>
			) : null}

			<input
				type="file"
				placeholder="upload image"
				onChange={handleImageUpload}
			/>
		</>
	);
}
