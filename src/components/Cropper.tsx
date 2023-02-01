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

      drawClipArea()
    }
  }

  /**
   * We need to define left, right, top, and bottom boundaries that exist outside the clipping area
   */
  function drawClipArea() {
    if (!canvas.current) return

    const ctx = canvas.current.getContext("2d")

    if (!ctx) return

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

    // draw boundaries
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)"

    ctx.fillRect(left.x, left.y, left.width, left.height)

    ctx.fillRect(top.x, top.y, top.width, top.height)

    ctx.fillRect(right.x, right.y, right.width, right.height)

    ctx.fillRect(bottom.x, bottom.y, bottom.width, bottom.height)

    // draw corners
  }

  useEffect(() => drawClipArea(), [])

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
        />
      </div>
      <input type="file" onChange={uploadImage} />

      <button onClick={clearCanvas}>Clear</button>
    </>
  )
}
