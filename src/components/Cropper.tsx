import { ChangeEvent, useCallback, useRef, useState } from "react"
import style from "../styles/Components/Cropper.module.scss"
export interface Coordinates {
  x: number
  y: number
  diameter: number
}

export interface CropCorners {
  topLeft: Coordinates
  bottomRight: Coordinates
}

export interface CropSettings {
  canvas: HTMLCanvasElement | null
  background: HTMLImageElement | null
  coordinates: CropCorners
  selected: "topLeft" | "bottomRight" | null
}

export default function Cropper() {
  const [cropSettings, setCropSettings] = useState<{
    canvas: HTMLCanvasElement | null
    background: HTMLImageElement | null
    coordinates: CropCorners
    selected: "topLeft" | "bottomRight" | null
  }>({
    canvas: null,
    background: null,
    coordinates: {
      topLeft: {
        x: 10,
        y: 10,
        diameter: 5,
      },
      bottomRight: {
        x: 290,
        y: 290,
        diameter: 5,
      },
    },
    selected: null,
  })

  const cropped = useRef<HTMLCanvasElement | null>(null)

  const handleCanvasInitialLoad = useCallback((canvas: HTMLCanvasElement) => {
    setCropSettings({
      ...cropSettings,
      canvas,
    })

    const coords = {
      ...cropSettings.coordinates,
      bottomRight: {
        ...cropSettings.coordinates.bottomRight,
        y: canvas.height - 10,
      },
    }

    drawCropOverlay(canvas, coords)
  }, [])

  function uploadImage(e: ChangeEvent) {
    if (!cropSettings.canvas) return

    const c = cropSettings.canvas

    const input = e.currentTarget as HTMLInputElement

    const file = input.files?.[0]

    if (!file) return

    const url = URL.createObjectURL(file)

    const image = new Image(c.width, c.height)

    image.src = url

    drawImageToCanvas(image)
  }

  function drawImageToCanvas(
    background?: HTMLImageElement,
    settings?: CropSettings
  ) {
    if (cropSettings.background && settings) {
      if (!cropSettings.canvas) return

      const c = cropSettings.canvas

      const ctx = c.getContext("2d")

      if (settings.background)
        ctx?.drawImage(settings.background, 0, 0, c.width, c.height)

      ctx?.fill()
    } else {
      if (!background) return
      background.onload = () => {
        if (!cropSettings.canvas) return

        const c = cropSettings.canvas

        c.height =
          (background.naturalHeight / background.naturalWidth) * c.height

        const coords = {
          ...cropSettings.coordinates,
          bottomRight: {
            ...cropSettings.coordinates.bottomRight,
            x: c.width - 10,
            y: c.height - 10,
          },
        }

        setCropSettings({
          ...cropSettings,
          coordinates: {
            ...cropSettings.coordinates,
            bottomRight: {
              ...cropSettings.coordinates.bottomRight,
              x: c.width - 10,
              y: c.height - 10,
            },
          },
          background,
        })

        const ctx = c.getContext("2d")

        ctx?.drawImage(background, 0, 0, c.width, c.height)

        ctx?.fill()

        drawCropOverlay(c, coords)
      }
    }
  }

  function drawCropOverlay(
    canvas: HTMLCanvasElement,
    coordinates?: CropCorners
  ) {
    if (!coordinates) return
    const ctx1 = canvas.getContext("2d")

    if (!ctx1) return

    // overlay style
    ctx1.fillStyle = "rgba(0, 0, 0, 0.25)"

    // top
    ctx1.beginPath()
    ctx1.rect(0, 0, canvas.width, coordinates.topLeft.y)
    ctx1.fill()

    // bottom
    ctx1.beginPath()
    ctx1.rect(
      0,
      coordinates.bottomRight.y,
      canvas.width,
      canvas.height - coordinates.bottomRight.y
    )
    ctx1.fill()

    // left
    ctx1.beginPath()
    ctx1.rect(
      0,
      coordinates.topLeft.y,
      coordinates.topLeft.x,
      coordinates.bottomRight.y - coordinates.topLeft.y
    )
    ctx1.fill()

    // right
    ctx1.beginPath()
    ctx1.rect(
      coordinates.bottomRight.x,
      coordinates.topLeft.y,
      canvas.width - coordinates.topLeft.x,
      coordinates.bottomRight.y - coordinates.topLeft.y
    )
    ctx1.fill()

    // handles style
    ctx1.fillStyle = "white"

    // topLeft
    ctx1.beginPath()
    ctx1.arc(
      coordinates.topLeft.x,
      coordinates.topLeft.y,
      coordinates.topLeft.diameter,
      0,
      365
    )
    ctx1.fill()

    // bottomRight
    ctx1.beginPath()
    ctx1.arc(
      coordinates.bottomRight.x,
      coordinates.bottomRight.y,
      coordinates.bottomRight.diameter,
      0,
      365
    )
    ctx1.fill()
  }

  function handleMouse(e: MouseEvent, action: string | null = null) {
    const target = e.target as HTMLCanvasElement
    const rect = target.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let settings = cropSettings

    const coords = cropSettings.coordinates

    if (isGrabbingHandle(coords.bottomRight, { x, y })) {
      settings = {
        ...settings,
        coordinates: {
          ...settings.coordinates,
          bottomRight: {
            ...settings.coordinates.bottomRight,
            diameter: 6.5,
          },
        },
      }

      if (action === "down") {
        settings.selected = "bottomRight"
      }
    } else if (isGrabbingHandle(coords.topLeft, { x, y })) {
      settings = {
        ...settings,
        coordinates: {
          ...settings.coordinates,
          topLeft: {
            ...settings.coordinates.topLeft,
            diameter: 6.5,
          },
        },
      }

      if (action === "down") {
        settings.selected = "topLeft"
      }
    } else {
      settings = {
        ...settings,
        coordinates: {
          ...settings.coordinates,
          bottomRight: {
            ...settings.coordinates.bottomRight,
            diameter: 5,
          },
          topLeft: {
            ...settings.coordinates.topLeft,
            diameter: 5,
          },
        },
      }
    }

    if (settings.selected !== null) {
      let posX = x,
        posY = y

      if (settings.selected === "topLeft") {
        if (x >= settings.coordinates.bottomRight.x - 10) {
          posX = settings.coordinates.bottomRight.x - 10
        }
        if (y >= settings.coordinates.bottomRight.y - 10) {
          posY = settings.coordinates.bottomRight.y - 10
        }
      } else {
        if (x <= settings.coordinates.topLeft.x + 10) {
          posX = settings.coordinates.topLeft.x + 10
        }
        if (y <= settings.coordinates.topLeft.y + 10) {
          posY = settings.coordinates.topLeft.y + 10
        }
      }

      settings = {
        ...settings,
        coordinates: {
          ...settings.coordinates,
          [settings.selected]: {
            ...settings.coordinates?.[settings.selected],
            x: posX,
            y: posY,
          },
        },
      }
    }

    setCropSettings(settings)

    clearCanvas()
    drawImageToCanvas(settings.background!, settings)
    drawCropOverlay(target, settings.coordinates)
  }

  function isGrabbingHandle(
    coords: Coordinates,
    mouse: { x: number; y: number }
  ) {
    if (
      coords.x - 2.5 < mouse.x &&
      coords.x + 2.5 > mouse.x &&
      coords.y - 2.5 < mouse.y &&
      coords.y + 2.5 > mouse.y
    ) {
      return true
    }
  }

  function clearCanvas() {
    if (!cropSettings.canvas) return
    const ctx = cropSettings.canvas.getContext("2d")
    ctx?.clearRect(0, 0, cropSettings.canvas.width, cropSettings.canvas.height)
  }

  const [message, setMessage] = useState<string | null>(null)

  let timer: any
  function cropImage() {
    if (!cropSettings.canvas || !cropped.current) return
    const ctx1 = cropSettings.canvas.getContext("2d")
    const ctx2 = cropped.current.getContext("2d")

    if (!ctx1 || !ctx2) return

    const w =
      cropSettings.coordinates.bottomRight.x -
      cropSettings.coordinates.topLeft.x
    const h =
      cropSettings.coordinates.bottomRight.y -
      cropSettings.coordinates.topLeft.y

    cropped.current.width = w
    cropped.current.height = h

    ctx2.drawImage(
      cropSettings.canvas,
      cropSettings.coordinates.topLeft.x,
      cropSettings.coordinates.topLeft.y,
      w,
      h,
      0,
      0,
      w,
      h
    )

    ctx2.fill()
    setMessage("Click here to see crop")

    timer = setTimeout(() => {
      setMessage(null)
      clearTimeout(timer)
    }, 1000)
  }

  const [open, setOpen] = useState(false)

  return (
    <>
      <div className={style.cropper}>
        <canvas
          ref={handleCanvasInitialLoad}
          width={300}
          height={300}
          onMouseMove={(e) => handleMouse(e as any)}
          onMouseDown={(e) => handleMouse(e as any, "down")}
          onMouseUp={() => {
            setCropSettings({
              ...cropSettings,
              selected: null,
            })
          }}
        />
        <label>
          <button onClick={() => setOpen(!open)}>Preview</button>
          {message ? <span>{message}</span> : null}
        </label>

        <div className={`${style.preview} ${open ? style.opened : ""}`}>
          <>
            <button onClick={() => setOpen(false)}>close</button>
            <canvas ref={cropped} />
          </>
        </div>
      </div>

      <div className={style.inputs}>
        <input type="file" onChange={uploadImage} />
        <button onClick={cropImage}>crop</button>
      </div>
    </>
  )
}
