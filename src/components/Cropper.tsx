import { ChangeEvent, useEffect, useRef, useState } from "react";
import style from "../styles/Components/Cropper.module.scss";

export default function Cropper() {
	const canvas = useRef<HTMLCanvasElement | null>(null);
	const [settings, setSettings] = useState<{
		clipping: { x: number; y: number; width: number; height: number };
		corner: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | null;
		background: HTMLImageElement | null;
	}>({
		clipping: {
			x: 10,
			y: 10,
			width: 40,
			height: 40,
		},
		corner: null,
		background: null,
	});

	function uploadImage(e: ChangeEvent<HTMLInputElement>) {
		if (e.currentTarget.type !== "file") return;

		const file = e.currentTarget.files?.[0];

		if (!file) return;

		const image = new Image(0, 0);

		image.src = URL.createObjectURL(file);

		drawCanvasBackground(image);
	}

	function drawCanvasBackground(
		background: HTMLImageElement,
		isLoaded = false
	) {
		clearCanvas();

		if (isLoaded) {
			if (!canvas.current) return;

			canvas.current.width = background.naturalWidth;
			canvas.current.height = background.naturalHeight;

			const ctx = canvas.current.getContext("2d");

			ctx?.drawImage(background, 0, 0);

			setSettings({
				...settings,
				background,
			});
		} else {
			background.onload = () => {
				if (!canvas.current) return;

				canvas.current.width = background.naturalWidth;
				canvas.current.height = background.naturalHeight;

				const ctx = canvas.current.getContext("2d");

				ctx?.drawImage(background, 0, 0);

				setSettings({
					...settings,
					background,
				});

				drawClipArea({ x: 0, y: 0 });
			};
		}
	}

	/**
	 * We need to define left, right, top, and bottom boundaries that exist outside the clipping area
	 */
	function drawClipArea(
		coordinates: { x: number; y: number },
		selectorSize = 5,
		action: "down" | "hover" = "hover"
	) {
		if (!canvas.current) return;

		const ctx = canvas.current.getContext("2d");

		if (!ctx) return;

		if (!settings.background) clearCanvas();

		if (settings.background) drawCanvasBackground(settings.background, true);

		if (settings.corner !== null) {
			if (settings.corner === "topLeft") {
				const maxX =
					coordinates.x * 2 > canvas.current.width - settings.clipping.width;
				const maxY =
					coordinates.y * 2 > canvas.current.height - settings.clipping.height;
				setSettings({
					...settings,
					clipping: {
						...settings.clipping,
						x: maxX ? settings.clipping.x : coordinates.x * 2,
						y: maxY ? settings.clipping.y : coordinates.y * 2,
					},
				});
			} else if (settings.corner === "bottomRight") {
				setSettings({
					...settings,
					clipping: {
						...settings.clipping,
						width: coordinates.x * 2 - settings.clipping.x,
						height: coordinates.y * 2 - settings.clipping.y,
					},
				});
			}
		}

		// boundaries
		const left = {
			x: 0,
			y: 0,
			height: canvas.current.height,
			width: settings.clipping.x,
		};

		const top = {
			x: settings.clipping.x,
			y: 0,
			width: settings.clipping.width,
			height: settings.clipping.y,
		};

		const right = {
			x: settings.clipping.x + settings.clipping.width,
			y: 0,
			height: canvas.current.height,
			width:
				canvas.current.width - (settings.clipping.x + settings.clipping.width),
		};

		const bottom = {
			x: settings.clipping.x,
			y: settings.clipping.y + settings.clipping.height,
			height: canvas.current.height - settings.clipping.y,
			width: settings.clipping.width,
		};

		// corners
		const topLeft = {
			x: left.width,
			y: top.height,
		};

		const bottomRight = {
			x: right.x,
			y: bottom.y,
		};

		// draw boundaries
		ctx.fillStyle = "rgba(0, 0, 0, 0.4)";

		ctx.fillRect(left.x, left.y, left.width, left.height);

		ctx.fillRect(top.x, top.y, top.width, top.height);

		ctx.fillRect(right.x, right.y, right.width, right.height);

		ctx.fillRect(bottom.x, bottom.y, bottom.width, bottom.height);

		// draw corners
		const ctx2 = canvas.current.getContext("2d");

		if (!ctx2) return;

		ctx2.fillStyle = "white";

		ctx2.beginPath();
		ctx2.arc(
			topLeft.x,
			topLeft.y,
			detectHover(
				topLeft,
				{ x: coordinates?.x, y: coordinates?.y },
				selectorSize / 2
			)
				? selectorSize * 1.5
				: selectorSize,
			0,
			360,
			false
		);
		ctx2.closePath();
		ctx2.fill();

		ctx2.beginPath();
		ctx2.arc(
			bottomRight.x,
			bottomRight.y,
			detectHover(
				bottomRight,
				{ x: coordinates?.x, y: coordinates?.y },
				selectorSize / 2
			)
				? selectorSize * 1.5
				: selectorSize,
			0,
			360,
			false
		);
		ctx2.closePath();
		ctx2.fill();

		if (action === "down") {
			if (
				detectHover(
					topLeft,
					{ x: coordinates?.x, y: coordinates?.y },
					selectorSize / 2
				)
			) {
				setSettings({
					...settings,
					corner: "topLeft",
				});
			} else if (
				detectHover(
					bottomRight,
					{ x: coordinates?.x, y: coordinates?.y },
					selectorSize / 2
				)
			) {
				setSettings({
					...settings,
					corner: "bottomRight",
				});
			}
		}
	}

	function handleMouseOver(e?: MouseEvent) {
		if (!canvas.current) return;
		const rect = canvas.current.getBoundingClientRect();
		if (!e) return;
		e.preventDefault();
		e.stopPropagation();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		drawClipArea({ x, y }, 5, "hover");
	}

	function handleMouseDown(e?: MouseEvent) {
		if (!canvas.current) return;
		const rect = canvas.current.getBoundingClientRect();
		if (!e) return;
		e.preventDefault();
		e.stopPropagation();
		const x = e?.clientX - rect.left;
		const y = e?.clientY - rect.top;

		drawClipArea({ x, y }, 5, "down");
	}

	function detectHover(
		target: {
			x: number;
			y: number;
		},
		coordinates: { x: number; y: number },
		radius: number
	) {
		const targetX = target.x / 2;
		const targetY = target.y / 2;

		if (
			coordinates.x < targetX + radius &&
			coordinates.x > targetX - radius &&
			coordinates.y < targetY + radius &&
			coordinates.y > targetY - radius
		) {
			return true;
		}
	}

	useEffect(() => drawClipArea({ x: 0, y: 0 }), []);

	function clearCanvas() {
		if (!canvas.current) return;

		const ctx = canvas.current.getContext("2d");

		ctx?.clearRect(0, 0, canvas.current.width, canvas.current.height);
	}
	return (
		<>
			<div className={style.cropper}>
				<canvas
					ref={canvas}
					width={500}
					height={500}
					className={style.canvas}
					onMouseMove={(e) => handleMouseOver(e as any)}
					onMouseDown={(e) => handleMouseDown(e as any)}
					onMouseUp={() => setSettings({ ...settings, corner: null })}
				/>
			</div>
			<input type="file" onChange={uploadImage} />

			<button onClick={clearCanvas}>Clear</button>
		</>
	);
}
