/**
 * useQrCameraScanner
 *
 * Drives a `<video>` element's camera feed through a scan loop, decoding
 * each frame for a QR code and reporting the first one found. Owns the
 * `getUserMedia` stream and an offscreen canvas — the caller only needs to
 * mount a `<video>` element and hand over its ref.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const videoRef = ref<HTMLVideoElement | null>(null)
 * const scanner = useQrCameraScanner(videoRef, (value) => {
 *   console.log('scanned', value)
 * })
 * </script>
 * <template><video ref="videoRef" autoplay muted playsinline /></template>
 * ```
 */

import { onScopeDispose, readonly, ref } from 'vue'

import { decodeQrFromImageData } from '@/shared/utils/qr-decode'

import type { DeepReadonly, Ref } from 'vue'

function decodeCurrentFrame(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
): string | null {
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')
  if (!context) return null

  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const frame = context.getImageData(0, 0, canvas.width, canvas.height)
  return decodeQrFromImageData(frame.data, frame.width, frame.height)
}

function stopStreamTracks(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop()
  })
}

/** Requests the camera and attaches it to the video element, or throws (releasing any acquired stream first) if the element isn't mounted or playback fails to start */
async function acquireCameraStream(
  videoEl: Ref<HTMLVideoElement | null>
): Promise<MediaStream> {
  // `mediaDevices` is undefined on any non-secure origin (plain HTTP on
  // anything other than localhost) — not just unsupported browsers — so
  // this is worth a clear message rather than a raw property-access crash.
  if (!('mediaDevices' in navigator)) {
    throw new Error(
      'Camera access requires a secure connection (HTTPS or localhost)'
    )
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  })
  const video = videoEl.value
  if (!video) {
    stopStreamTracks(stream)
    throw new Error('Scanner video element is not mounted')
  }

  video.srcObject = stream
  try {
    await video.play()
  } catch (err) {
    stopStreamTracks(stream)
    throw err
  }
  return stream
}

interface ScannerState {
  stream: MediaStream | null
  frameHandle: number | null
}

function stopScanning(
  state: ScannerState,
  isScanning: Ref<boolean>,
  videoEl: Ref<HTMLVideoElement | null>
): void {
  isScanning.value = false
  if (state.frameHandle !== null) cancelAnimationFrame(state.frameHandle)
  state.frameHandle = null

  if (state.stream) stopStreamTracks(state.stream)
  state.stream = null

  const video = videoEl.value
  if (video) video.srcObject = null
}

export interface UseQrCameraScanner {
  /** Whether the camera feed and scan loop are currently active */
  isScanning: DeepReadonly<Ref<boolean>>
  /** Message from the last failed `start()` attempt, if any */
  error: DeepReadonly<Ref<string | null>>
  /** Requests camera access and starts the scan loop. Safe to call while already scanning (no-op). */
  start: () => Promise<void>
  /** Stops the scan loop and releases the camera. Safe to call multiple times. */
  stop: () => void
}

export function useQrCameraScanner(
  videoEl: Ref<HTMLVideoElement | null>,
  onDecode: (value: string) => void
): UseQrCameraScanner {
  const isScanning = ref(false)
  const error = ref<string | null>(null)
  const canvas = document.createElement('canvas')
  const state: ScannerState = { frameHandle: null, stream: null }
  let isStarting = false

  function stop(): void {
    stopScanning(state, isScanning, videoEl)
  }

  function scanFrame(): void {
    const video = videoEl.value
    const decoded =
      video && video.readyState >= video.HAVE_ENOUGH_DATA
        ? decodeCurrentFrame(canvas, video)
        : null

    if (decoded) {
      stop()
      onDecode(decoded)
      return
    }
    state.frameHandle = requestAnimationFrame(scanFrame)
  }

  async function start(): Promise<void> {
    if (isScanning.value || isStarting) return
    isStarting = true
    error.value = null

    try {
      state.stream = await acquireCameraStream(videoEl)
      isScanning.value = true
      state.frameHandle = requestAnimationFrame(scanFrame)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Camera access failed'
      stop()
    } finally {
      isStarting = false
    }
  }

  onScopeDispose(stop)

  return {
    error: readonly(error),
    isScanning: readonly(isScanning),
    start,
    stop
  }
}
