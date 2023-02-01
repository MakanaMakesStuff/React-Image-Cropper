import NextImage from "next/image"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import style from "../styles/Components/Cropper.module.scss"

export default function Cropper() {
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [settings, setSettings] = useState<{
    clipping: { x: number; y: number; width: number; height: number }
  }>({
    clipping: {
      x: 20,
      y: 20,
      width: 100,
      height: 100,
    },
  })

  function uploadImage(e: ChangeEvent<HTMLInputElement>) {
    if (e.currentTarget.type !== "file") return

    const file = e.currentTarget.files?.[0]

    if (!file) return

    const image = new Image(0, 0)

    image.src = URL.createObjectURL(file)

    drawCanvasBackground(image)
  }

  function drawCanvasBackground(background: HTMLImageElement) {
    background.onload = () => {
      if (!canvas.current) return

      canvas.current.width = background.naturalWidth
      canvas.current.height = background.naturalHeight

      const ctx = canvas.current.getContext("2d")

      ctx?.drawImage(background, 0, 0)

      drawClipArea({ x: 0, y: 0 })
    }
  }

  /**
   * We need to define left, right, top, and bottom boundaries that exist outside the clipping area
   */
  function drawClipArea(
    coordinates: { x: number; y: number },
    selectorSize = 5,
    action: "drag" | "hover" = "hover"
  ) {
    if (!canvas.current) return

    const ctx = canvas.current.getContext("2d")

    if (!ctx) return

    clearCanvas()

    // boundaries
    const left = {
      x: 0,
      y: 0,
      height: canvas.current.height,
      width: settings.clipping.x,
    }

    const top = {
      x: settings.clipping.x,
      y: 0,
      width: settings.clipping.width,
      height: settings.clipping.y,
    }

    const right = {
      x: settings.clipping.x + settings.clipping.width,
      y: 0,
      height: canvas.current.height,
      width:
        canvas.current.width - (settings.clipping.x + settings.clipping.width),
    }

    const bottom = {
      x: settings.clipping.x,
      y: settings.clipping.y + settings.clipping.height,
      height:
        canvas.current.height -
        (settings.clipping.y + settings.clipping.height),
      width: settings.clipping.width,
    }

    // corners
    const topLeft = {
      x: left.width,
      y: top.height,
    }

    const topRight = {
      x: right.x,
      y: top.height,
    }

    const bottomLeft = {
      x: left.width,
      y: bottom.y,
    }

    const bottomRight = {
      x: right.x,
      y: bottom.y,
    }

    // draw boundaries
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)"

    ctx.fillRect(left.x, left.y, left.width, left.height)

    ctx.fillRect(top.x, top.y, top.width, top.height)

    ctx.fillRect(right.x, right.y, right.width, right.height)

    ctx.fillRect(bottom.x, bottom.y, bottom.width, bottom.height)

    // draw corners
    const ctx2 = canvas.current.getContext("2d")

    if (!ctx2) return

    ctx2.fillStyle = "white"

    ctx2.beginPath()
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
    )
    ctx2.closePath()
    ctx2.fill()

    ctx2.beginPath()
    ctx2.arc(
      topRight.x,
      topRight.y,
      detectHover(
        topRight,
        { x: coordinates?.x, y: coordinates?.y },
        selectorSize / 2
      )
        ? selectorSize * 1.5
        : selectorSize,
      0,
      360,
      false
    )
    ctx2.closePath()
    ctx2.fill()

    ctx2.beginPath()
    ctx2.arc(
      bottomLeft.x,
      bottomLeft.y,
      detectHover(
        bottomLeft,
        { x: coordinates?.x, y: coordinates?.y },
        selectorSize / 2
      )
        ? selectorSize * 1.5
        : selectorSize,
      0,
      360,
      false
    )
    ctx2.closePath()
    ctx2.fill()

    ctx2.beginPath()
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
    )
    ctx2.closePath()
    ctx2.fill()

    if (action === "drag") {
      console.log("dragging")
    }
  }

  function handleMouseOver(e?: MouseEvent) {
    if (!canvas.current) return
    const rect = canvas.current.getBoundingClientRect()
    if (!e) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    drawClipArea({ x, y })
  }

  function handleMouseDown(e?: MouseEvent) {
    if (!canvas.current) return
    const rect = canvas.current.getBoundingClientRect()
    if (!e) return
    const x = e?.clientX - rect.left
    const y = e?.clientY - rect.top

    drawClipArea({ x, y }, 5, "drag")
  }

  function detectHover(
    target: {
      x: number
      y: number
    },
    coordinates: { x: number; y: number },
    radius: number
  ) {
    const targetX = target.x / 2
    const targetY = target.y / 2

    if (
      coordinates.x < targetX + radius &&
      coordinates.x > targetX - radius &&
      coordinates.y < targetY + radius &&
      coordinates.y > targetY - radius
    ) {
      return true
    }
  }

  useEffect(() => drawClipArea({ x: 0, y: 0 }), [])

  function clearCanvas() {
    if (!canvas.current) return

    const ctx = canvas.current.getContext("2d")

    ctx?.clearRect(0, 0, canvas.current.width, canvas.current.height)
  }
  return (
    <>
      <div className={style.cropper}>
        <canvas
          ref={canvas}
          width={500}
          height={300}
          className={style.canvas}
          onMouseMove={(e) => handleMouseOver(e as any)}
          onMouseDown={(e) => handleMouseDown(e as any)}
        />
      </div>
      <input type="file" onChange={uploadImage} />

      <button onClick={clearCanvas}>Clear</button>
    </>
  )
}
