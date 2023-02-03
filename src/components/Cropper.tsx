import { ChangeEvent, useCallback, useState } from "react"

export interface Coordinates {
  x: number
  y: number
  diameter: number
}

export interface CropCorners {
  topLeft: Coordinates
  topRight: Coordinates
  bottomLeft: Coordinates
  bottomRight: Coordinates
}

export default function Cropper() {
  const [cropSettings, setCropSettings] = useState<{
    canvas: HTMLCanvasElement | null
    background: HTMLImageElement | null
    coordinates: CropCorners
  }>({
    canvas: null,
    background: null,
    coordinates: {
      topLeft: {
        x: 10,
        y: 10,
        diameter: 5,
      },
      topRight: {
        x: 290,
        y: 10,
        diameter: 5,
      },
      bottomLeft: {
        x: 10,
        y: 290,
        diameter: 5,
      },
      bottomRight: {
        x: 290,
        y: 290,
        diameter: 5,
      },
    },
  })

  const handleCanvasInitialLoad = useCallback((canvas: HTMLCanvasElement) => {
    setCropSettings({
      ...cropSettings,
      canvas,
    })

    const coords = {
      ...cropSettings.coordinates,
      bottomLeft: {
        ...cropSettings.coordinates.bottomLeft,
        y: canvas.height - 10,
      },
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

  function drawImageToCanvas(background?: HTMLImageElement) {
    clearCanvas()

    if (cropSettings.background) {
      if (!cropSettings.canvas) return

      const c = cropSettings.canvas

      const coords = {
        ...cropSettings.coordinates,
        bottomLeft: {
          ...cropSettings.coordinates.bottomLeft,
          y: c.height - 10,
        },
        bottomRight: {
          ...cropSettings.coordinates.bottomRight,
          y: c.height - 10,
        },
      }

      setCropSettings({
        ...cropSettings,
        coordinates: {
          ...cropSettings.coordinates,
          bottomLeft: {
            ...cropSettings.coordinates.bottomLeft,
            y: c.height - 10,
          },
          bottomRight: {
            ...cropSettings.coordinates.bottomRight,
            y: c.height - 10,
          },
        },
      })

      const ctx = c.getContext("2d")

      ctx?.drawImage(cropSettings.background, 0, 0, c.width, c.height)

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
          bottomLeft: {
            ...cropSettings.coordinates.bottomLeft,
            y: c.height - 10,
          },
          bottomRight: {
            ...cropSettings.coordinates.bottomRight,
            y: c.height - 10,
          },
        }

        setCropSettings({
          ...cropSettings,
          coordinates: {
            ...cropSettings.coordinates,
            bottomLeft: {
              ...cropSettings.coordinates.bottomLeft,
              y: c.height - 10,
            },
            bottomRight: {
              ...cropSettings.coordinates.bottomRight,
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
      coordinates.bottomLeft.y,
      canvas.width,
      canvas.height - coordinates.bottomLeft.y
    )
    ctx1.fill()

    // left
    ctx1.beginPath()
    ctx1.rect(
      0,
      coordinates.topLeft.y,
      coordinates.topLeft.x,
      coordinates.bottomLeft.y - coordinates.topLeft.y
    )
    ctx1.fill()

    // right
    ctx1.beginPath()
    ctx1.rect(
      coordinates.topRight.x,
      coordinates.topRight.y,
      canvas.width - coordinates.topRight.y,
      coordinates.bottomRight.y - coordinates.topRight.y
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

  function handleHover(e: MouseEvent) {
    const target = e.target as HTMLCanvasElement
    const rect = target.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const coords = cropSettings.coordinates

    if (isGrabbingHandle(coords.bottomRight, { x, y })) {
      setCropSettings({
        ...cropSettings,
        coordinates: {
          ...cropSettings.coordinates,
          bottomRight: {
            ...cropSettings.coordinates.bottomRight,
            diameter: 6.5,
          },
        },
      })
    } else if (isGrabbingHandle(coords.topLeft, { x, y })) {
      setCropSettings({
        ...cropSettings,
        coordinates: {
          ...cropSettings.coordinates,
          topLeft: {
            ...cropSettings.coordinates.topLeft,
            diameter: 6.5,
          },
        },
      })
    } else {
      setCropSettings({
        ...cropSettings,
        coordinates: {
          ...cropSettings.coordinates,
          bottomRight: {
            ...cropSettings.coordinates.bottomRight,
            diameter: 5,
          },
          topLeft: {
            ...cropSettings.coordinates.topLeft,
            diameter: 5,
          },
        },
      })
    }
    clearCanvas()
    drawCropOverlay(target, cropSettings.coordinates)
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

  return (
    <>
      <div className="cropper">
        <canvas
          ref={handleCanvasInitialLoad}
          width={300}
          height={300}
          onMouseMove={(e) => handleHover(e as any)}
        />
        <canvas ref={null} />
      </div>

      <input type="file" onChange={uploadImage} />
      <button>crop</button>
    </>
  )
}
