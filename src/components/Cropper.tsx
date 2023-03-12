import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react"
import style from "../styles/Components/Cropper.module.scss"
export interface Coordinates {
  x: number
  y: number
  diameter: number
  init?: Coordinates
}

export interface CropCorners {
  topLeft: Coordinates
  center: Coordinates
  bottomRight: Coordinates
}

export interface CropSettings {
  canvas: HTMLCanvasElement | null
  background: HTMLImageElement | null
  opened: boolean
  coordinates: CropCorners
  selected: "topLeft" | "bottomRight" | null
  moving: boolean
}

export default function Cropper() {
  const [cropSettings, setCropSettings] = useState<CropSettings>({
    canvas: null,
    background: null,
    opened: false,
    coordinates: {
      topLeft: {
        x: 10,
        y: 10,
        diameter: 6.5,
      },
      center: {
        x: 0,
        y: 0,
        diameter: 6.5,
      },
      bottomRight: {
        x: 290,
        y: 290,
        diameter: 6.5,
      },
    },
    selected: null,
    moving: false,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            center: {
              ...cropSettings.coordinates.center,
              x: c.width / 2,
              y: c.height / 2,
            },
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
    ctx1.fillStyle = "rgba(0, 0, 0, 0.5)"

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
    ctx1.closePath()

    ctx1.fillStyle = "gray"

    // center
    ctx1.beginPath()
    ctx1.arc(
      (coordinates.bottomRight.x + coordinates.topLeft.x) / 2,
      (coordinates.bottomRight.y + coordinates.topLeft.y) / 2,
      coordinates.center.diameter,
      0,
      365
    )
    ctx1.fill()
    ctx1.closePath()

    // reset fill style
    ctx1.fillStyle = "white"

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
    ctx1.closePath()
  }

  function handleMouse(
    e: MouseEvent | TouchEvent,
    action: string | null = null,
    type: "touch" | "mouse" = "mouse"
  ) {
    if (!cropSettings.background) return
    const target = cropSettings.canvas
    if (!target) return
    const rect = target.getBoundingClientRect()

    let x = 0
    let y = 0

    if (type === "mouse") {
      const ev = e as MouseEvent
      x = ev.clientX - rect.left
      y = ev.clientY - rect.top
    } else {
      const ev = e as TouchEvent
      x = ev.targetTouches?.[0]?.clientX - rect.left
      y = ev.targetTouches?.[0]?.clientY - rect.top
    }

    let settings = cropSettings

    const coords = cropSettings.coordinates

    if (isGrabbingHandle(coords.bottomRight, { x, y })) {
      settings = {
        ...settings,
        coordinates: {
          ...settings.coordinates,
          bottomRight: {
            ...settings.coordinates.bottomRight,
            diameter: 8.5,
          },
        },
      }

      if (action === "down") {
        settings.selected = "bottomRight"
      }
    } else if (
      isGrabbingHandle(
        coords.center,
        { x, y },
        (settings.coordinates.bottomRight.x - settings.coordinates.topLeft.x) /
          2 -
          5,
        (settings.coordinates.bottomRight.y - settings.coordinates.topLeft.y) /
          2 -
          5
      )
    ) {
      settings = {
        ...settings,
        coordinates: {
          ...settings.coordinates,
          center: {
            ...settings.coordinates.center,
            diameter: 8.5,
          },
        },
      }

      if (action === "down") {
        settings.selected = null
        settings.moving = true
        const { init: centerInit, ...rest } = settings.coordinates.center
        const { init: topLeftInit, ...topLeftRest } =
          settings.coordinates.topLeft
        const { init: bottomRightInit, ...bottomRightRest } =
          settings.coordinates.bottomRight
        settings.coordinates.center.init = rest
        settings.coordinates.topLeft.init = topLeftRest
        settings.coordinates.bottomRight.init = bottomRightRest
      }
    } else if (isGrabbingHandle(coords.topLeft, { x, y })) {
      settings = {
        ...settings,
        coordinates: {
          ...settings.coordinates,
          topLeft: {
            ...settings.coordinates.topLeft,
            diameter: 8.5,
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
          topLeft: {
            ...settings.coordinates.topLeft,
            diameter: 6.5,
          },
          center: {
            ...settings.coordinates.center,
            diameter: 6.5,
          },
          bottomRight: {
            ...settings.coordinates.bottomRight,
            diameter: 6.5,
          },
        },
        moving: false,
      }
    }

    if (settings.selected !== null) {
      let posX = x,
        posY = y

      if (settings.selected === "topLeft") {
        if (x >= settings.coordinates.bottomRight.x - 20) {
          posX = settings.coordinates.bottomRight.x - 20
        }
        if (y >= settings.coordinates.bottomRight.y - 20) {
          posY = settings.coordinates.bottomRight.y - 20
        }
      } else {
        if (x <= settings.coordinates.topLeft.x + 20) {
          posX = settings.coordinates.topLeft.x + 20
        }
        if (y <= settings.coordinates.topLeft.y + 20) {
          posY = settings.coordinates.topLeft.y + 20
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
          center: {
            ...settings.coordinates.center,
            x:
              (settings.coordinates.bottomRight.x +
                settings.coordinates.topLeft.x) /
              2,
            y:
              (settings.coordinates.bottomRight.y +
                settings.coordinates.topLeft.y) /
              2,
          },
        },
      }
    } else if (settings.moving && settings.coordinates.center.init) {
      const xDiff = x - settings.coordinates.center.init.x
      const yDiff = y - settings.coordinates.center.init.y

      settings.coordinates = {
        ...settings.coordinates,
        topLeft: {
          ...settings.coordinates.topLeft,
          x: settings.coordinates.topLeft.init?.x! + xDiff,
          y: settings.coordinates.topLeft.init?.y! + yDiff,
        },
        center: {
          ...settings.coordinates.center,
          x,
          y,
        },
        bottomRight: {
          ...settings.coordinates.bottomRight,
          x: settings.coordinates.bottomRight.init?.x! + xDiff,
          y: settings.coordinates.bottomRight.init?.y! + yDiff,
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
    mouse: { x: number; y: number },
    xRadius = 3.25,
    yRadius = 3.25
  ) {
    if (
      coords.x - xRadius < mouse.x &&
      coords.x + xRadius > mouse.x &&
      coords.y - yRadius < mouse.y &&
      coords.y + yRadius > mouse.y
    ) {
      return true
    }
  }

  function clearCanvas() {
    if (!cropSettings.canvas) return
    const ctx = cropSettings.canvas.getContext("2d")
    ctx?.clearRect(0, 0, cropSettings.canvas.width, cropSettings.canvas.height)
  }

  //   const [message, setMessage] = useState<string | null>(null)

  let timer: any
  function startCrop() {
    if (!cropSettings.background) return

    const settings: Partial<CropSettings> = cropSettings

    settings.coordinates = {
      ...settings.coordinates,
      topLeft: {
        ...settings.coordinates?.topLeft!,
        diameter: 0,
      },
      center: {
        ...settings.coordinates?.center!,
        diameter: 0,
      },
      bottomRight: {
        ...settings.coordinates?.bottomRight!,
        diameter: 0,
      },
    }

    drawImageToCanvas(cropSettings.background, settings as any)

    cropImage()

    settings.coordinates = {
      ...settings.coordinates,
      topLeft: {
        ...settings.coordinates?.topLeft!,
        diameter: 6.5,
      },
      center: {
        ...settings.coordinates?.center!,
        diameter: 6.5,
      },
      bottomRight: {
        ...settings.coordinates?.bottomRight!,
        diameter: 6.5,
      },
    }

    drawCropOverlay(settings.canvas!, settings.coordinates)
  }

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
    // setMessage("Click 'Preview' to view cropped image.")

    setCropSettings({
      ...cropSettings,
      opened: true,
    })

    timer = setTimeout(() => {
      //   setMessage(null)
      clearTimeout(timer)
    }, 3000)
  }

  return (
    <>
      <div className={style.cropper}>
        <canvas
          ref={handleCanvasInitialLoad}
          width={300}
          height={300}
          onMouseMove={(e) => handleMouse(e as any)}
          onTouchMove={(e) => handleMouse(e as any, null, "touch")}
          onMouseDown={(e) => handleMouse(e as any, "down")}
          onTouchStart={(e) => handleMouse(e as any, "down", "touch")}
          onMouseUp={() =>
            setCropSettings({
              ...cropSettings,
              selected: null,
              moving: false,
            })
          }
          onTouchEnd={(e) =>
            setCropSettings({
              ...cropSettings,
              selected: null,
              moving: false,
            })
          }
        />

        <div
          className={`${style.preview} ${
            cropSettings.opened ? style.opened : ""
          }`}
        >
          <>
            <div className={style.actions}>
              <a href={cropped.current?.toDataURL("image/png")} download>
                download
              </a>

              <button
                onClick={() =>
                  setCropSettings({ ...cropSettings, opened: false })
                }
              >
                close
              </button>
            </div>

            <canvas ref={cropped} />
          </>
        </div>

        <div className={style.inputs}>
          <input type="file" onChange={uploadImage} />

          <button onClick={startCrop} disabled={!cropSettings.background}>
            crop
          </button>

          {/* {message ? <span className={style.message}>{message}</span> : null} */}
        </div>
      </div>
    </>
  )
}
