import { BOARD_LOGICAL_HEIGHT, BOARD_LOGICAL_WIDTH } from './boardGeometry'
import { sanitizePlainText } from './messageCards'
import type {
  BoardObject,
  ImageFit,
  ImageMimeType,
  ImageObjectConfig,
  SafeLocalImage,
} from './types'

/**
 * DB-4E — safe local image insert + wallpaper upload helpers.
 *
 * Local-first, classroom-safe, student-display safe. Teachers may add a local
 * raster image (PNG/JPEG/WebP) as a board object or as the board wallpaper. We
 * accept only browser-safe raster formats, enforce a byte-size and dimension
 * cap, reject SVG/HTML/script/remote payloads, and re-encode through a canvas
 * so EXIF/private metadata is never stored.
 *
 * Pure validation/sanitization is separate from the browser FileReader/canvas
 * work so the pure helpers stay unit-testable without a DOM.
 */

export const IMAGE_ALLOWED_MIME_TYPES: readonly ImageMimeType[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
]

/** Maximum accepted source file size (bytes). */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024

/** Maximum accepted image dimension (px) on either axis. */
export const IMAGE_MAX_DIMENSION = 4096

/** Maximum sanitized alt-text length (characters). */
export const IMAGE_MAX_ALT_LENGTH = 160

/** Default object-fit for teacher-added image objects. */
export const DEFAULT_IMAGE_FIT: ImageFit = 'contain'

export type ImageRejectReason =
  | 'unsupported-type'
  | 'oversized'
  | 'empty'
  | 'undecodable'
  | 'too-large-dimensions'
  | 'unsafe-payload'
  | 'read-error'

const REJECT_MESSAGES: Record<ImageRejectReason, string> = {
  'unsupported-type': 'Unsupported file type. Use PNG, JPEG, or WebP.',
  oversized: 'Image is too large (5 MB max).',
  empty: 'Image file is empty or unreadable.',
  undecodable: 'Image could not be decoded.',
  'too-large-dimensions': 'Image dimensions are too large (4096×4096 max).',
  'unsafe-payload': 'Image payload failed safety validation.',
  'read-error': 'Could not read the selected file.',
}

/** Human-readable, student-safe status message for a rejected file. */
export function imageRejectMessage(reason: ImageRejectReason): string {
  return REJECT_MESSAGES[reason]
}

// ── pure validation ──

export function isAllowedImageMimeType(v: unknown): v is ImageMimeType {
  return typeof v === 'string' && (IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(v)
}

export function isImageFit(v: unknown): v is ImageFit {
  return v === 'contain' || v === 'cover' || v === 'fill'
}

/**
 * Sniff the real image type from magic bytes so a lying `File.type` (or an
 * empty one) cannot smuggle SVG/HTML/PDF/script bytes through as a raster.
 * Returns null for anything that is not PNG/JPEG/WebP (including GIF, SVG,
 * HTML, PDF, and unknown/empty payloads).
 */
export function detectImageMimeType(bytes: Uint8Array): ImageMimeType | null {
  if (!bytes || bytes.length < 4) return null
  // PNG — 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png'
  }
  // JPEG — FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  // WebP — "RIFF" .... "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return 'image/webp'
  }
  return null
}

/** Extract the MIME from a safe `data:image/...;base64,...` URL, or null. */
export function dataUrlMimeType(url: string): ImageMimeType | null {
  const m = /^data:(image\/png|image\/jpeg|image\/webp);base64,/.exec(url)
  return m ? (m[1] as ImageMimeType) : null
}

const SAFE_IMAGE_DATA_URL_RE = /^data:(image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/]+={0,2})$/

/**
 * True only for a self-contained, base64 raster data URL. Rejects remote URLs,
 * file/asset paths, `data:text/html`, `data:image/svg+xml`, and any non-base64
 * payload (which would be required to smuggle script-looking content).
 */
export function isSafeImageDataUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false
  const trimmed = url.trim()
  if (trimmed.length === 0) return false
  return SAFE_IMAGE_DATA_URL_RE.test(trimmed)
}

/** Approximate binary byte size of a base64 data URL payload. */
export function dataUrlByteSize(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return 0
  const b64 = dataUrl.slice(comma + 1)
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding)
}

function sanitizeDimension(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined
  const n = Math.round(v)
  if (n <= 0 || n > IMAGE_MAX_DIMENSION) return undefined
  return n
}

/** Sanitize image alt text to plain, URL-free, capped prose. */
export function sanitizeImageAltText(input: string): string {
  return sanitizePlainText(input, IMAGE_MAX_ALT_LENGTH)
}

/** Structural check: is this a valid, safe local image payload? */
export function isSafeLocalImage(v: unknown): v is SafeLocalImage {
  return sanitizeLocalImage(v) !== null
}

/**
 * Whitelist-validate a safe local image. Rebuilds only the allowed fields and
 * drops unknown/private keys (tokens, names, paths, URLs). Returns null for any
 * invalid or unsafe payload so a single bad record can be dropped/recovered.
 */
export function sanitizeLocalImage(raw: unknown): SafeLocalImage | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (r.kind !== 'localData') return null
  if (typeof r.dataUrl !== 'string') return null
  const mimeType = dataUrlMimeType(r.dataUrl)
  if (!mimeType || !isSafeImageDataUrl(r.dataUrl)) return null
  const byteSize =
    typeof r.byteSize === 'number' && Number.isFinite(r.byteSize)
      ? Math.floor(r.byteSize)
      : dataUrlByteSize(r.dataUrl)
  if (byteSize <= 0 || byteSize > IMAGE_MAX_BYTES) return null
  const width = sanitizeDimension(r.width)
  const height = sanitizeDimension(r.height)
  return {
    kind: 'localData',
    mimeType,
    dataUrl: r.dataUrl,
    altText: sanitizeImageAltText(typeof r.altText === 'string' ? r.altText : ''),
    byteSize,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  }
}

/**
 * Whitelist-validate an image object config. Returns null when the payload is
 * unsafe so serialization can drop the object entirely.
 */
export function sanitizeImageObjectConfig(raw: unknown): ImageObjectConfig | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (r.kind !== 'image') return null
  const image = sanitizeLocalImage(r.image)
  if (!image) return null
  const fit = isImageFit(r.fit) ? r.fit : DEFAULT_IMAGE_FIT
  let opacity = 1
  if (typeof r.opacity === 'number' && Number.isFinite(r.opacity)) {
    opacity = Math.min(1, Math.max(0, r.opacity))
  }
  return { kind: 'image', image, fit, opacity }
}

/**
 * Validate file metadata (MIME + size) before reading bytes. A non-empty MIME
 * must be in the allowlist; an empty MIME is deferred to magic-byte sniffing in
 * the full read path.
 */
export function validateImageFileMetadata(file: {
  type?: string
  size?: number
}): { ok: true } | { ok: false; reason: ImageRejectReason } {
  const size = file.size
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) {
    return { ok: false, reason: 'empty' }
  }
  if (size > IMAGE_MAX_BYTES) return { ok: false, reason: 'oversized' }
  if (typeof file.type === 'string' && file.type.length > 0 && !isAllowedImageMimeType(file.type)) {
    return { ok: false, reason: 'unsupported-type' }
  }
  return { ok: true }
}

// ── browser helpers (FileReader/canvas — not exercised by node tests) ──

export type ImageReadResult =
  | { ok: true; image: SafeLocalImage }
  | { ok: false; reason: ImageRejectReason }

interface DecodedImage {
  dataUrl: string
  width: number
  height: number
}

/**
 * Decode the file and re-encode through a canvas. This confirms the bytes are a
 * real raster image, reads natural dimensions, and strips EXIF/private metadata
 * (the canvas re-encode drops any non-pixel data). Returns null on any failure.
 */
function decodeAndReencode(file: File, mime: ImageMimeType): Promise<DecodedImage | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof URL === 'undefined') {
      resolve(null)
      return
    }
    let objectUrl: string
    try {
      objectUrl = URL.createObjectURL(file)
    } catch {
      resolve(null)
      return
    }
    const img = new Image()
    const fail = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(null)
    }
    img.onload = () => {
      try {
        const width = img.naturalWidth
        const height = img.naturalHeight
        if (width <= 0 || height <= 0 || width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
          fail()
          return
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          fail()
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL(mime, mime === 'image/png' ? undefined : 0.92)
        URL.revokeObjectURL(objectUrl)
        if (typeof dataUrl !== 'string' || dataUrl.length === 0) {
          resolve(null)
          return
        }
        resolve({ dataUrl, width, height })
      } catch {
        fail()
      }
    }
    img.onerror = fail
    img.src = objectUrl
  })
}

/**
 * Read a local file into a sanitized safe image, or a reject reason. Runs
 * metadata validation, magic-byte sniffing, dimension checks, and canvas
 * re-encoding so the returned payload is a clean, safe raster data URL.
 */
export async function readImageFileToSafeDataUrl(file: File): Promise<ImageReadResult> {
  const meta = validateImageFileMetadata({ type: file.type, size: file.size })
  if (!meta.ok) return meta

  let buffer: ArrayBuffer
  try {
    buffer = await file.arrayBuffer()
  } catch {
    return { ok: false, reason: 'read-error' }
  }
  if (buffer.byteLength === 0) return { ok: false, reason: 'empty' }
  if (buffer.byteLength > IMAGE_MAX_BYTES) return { ok: false, reason: 'oversized' }

  const mime = detectImageMimeType(new Uint8Array(buffer))
  if (!mime) return { ok: false, reason: 'unsupported-type' }

  const decoded = await decodeAndReencode(file, mime)
  if (!decoded) return { ok: false, reason: 'undecodable' }
  if (decoded.width > IMAGE_MAX_DIMENSION || decoded.height > IMAGE_MAX_DIMENSION) {
    return { ok: false, reason: 'too-large-dimensions' }
  }
  if (!isSafeImageDataUrl(decoded.dataUrl)) return { ok: false, reason: 'unsafe-payload' }
  if (dataUrlByteSize(decoded.dataUrl) > IMAGE_MAX_BYTES) return { ok: false, reason: 'oversized' }

  const finalMime = dataUrlMimeType(decoded.dataUrl)
  if (!finalMime) return { ok: false, reason: 'unsafe-payload' }

  const image: SafeLocalImage = {
    kind: 'localData',
    mimeType: finalMime,
    dataUrl: decoded.dataUrl,
    altText: '',
    byteSize: dataUrlByteSize(decoded.dataUrl),
    width: decoded.width,
    height: decoded.height,
  }
  return { ok: true, image }
}

/**
 * Build a full board object from a sanitized image, sized to its aspect ratio
 * and centered on the logical canvas. Pure — no DOM.
 */
export function createImageObjectFromSafeImage(image: SafeLocalImage, id: string): BoardObject {
  const maxW = 800
  const maxH = 600
  let w = 640
  let h = 480
  if (image.width && image.height && image.width > 0 && image.height > 0) {
    const scale = Math.min(maxW / image.width, maxH / image.height, 1)
    w = Math.round(image.width * scale)
    h = Math.round(image.height * scale)
    // Never so small it is invisible on the canvas.
    const min = 80
    if (w < min && h < min) {
      const up = min / Math.min(w, h)
      w = Math.round(w * up)
      h = Math.round(h * up)
    }
  }
  return {
    id,
    kind: 'image',
    x: Math.round((BOARD_LOGICAL_WIDTH - w) / 2),
    y: Math.round((BOARD_LOGICAL_HEIGHT - h) / 2),
    w,
    h,
    rotation: 0,
    locked: false,
    visible: true,
    layer: 100,
    config: { kind: 'image', image, fit: DEFAULT_IMAGE_FIT, opacity: 1 },
  }
}
