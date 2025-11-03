/**
 * Type definitions for wasm-image
 * High-performance image processing library powered by WebAssembly
 */

/**
 * Configuration options for image processing
 */
export interface ImageDimensions {
  width: number;
  height: number;
  pixels: number;
}

/**
 * ImageData-compatible interface for different input formats
 */
export interface ImageDataLike {
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Main ImageProcessor class for high-performance image operations
 */
export class ImageProcessor {
  /**
   * Create a new ImageProcessor from RGBA pixel data
   *
   * @param data - Uint8Array or Uint8ClampedArray of RGBA values (4 bytes per pixel)
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @throws {Error} If data size doesn't match width × height × 4
   */
  constructor(data: Uint8Array | Uint8ClampedArray | ImageDataLike, width?: number, height?: number);

  /**
   * Create processor from canvas element
   */
  static fromCanvas(canvas: HTMLCanvasElement): ImageProcessor;

  /**
   * Create processor from Image element
   */
  static fromImage(image: HTMLImageElement): ImageProcessor;

  /**
   * Load image from URL (async)
   *
   * @param url - Image URL to load
   * @returns Promise that resolves to ImageProcessor
   * @throws {Error} If image fails to load
   */
  static fromURL(url: string): Promise<ImageProcessor>;

  // ===== Data Access =====

  /**
   * Get raw RGBA pixel data
   */
  getData(): Uint8Array;

  /**
   * Convert to Canvas ImageData object
   */
  toImageData(): ImageData;

  /**
   * Draw to canvas element
   *
   * @param canvas - Target canvas (creates new one if not provided)
   * @returns The canvas element
   */
  toCanvas(canvas?: HTMLCanvasElement): HTMLCanvasElement;

  /**
   * Export as image blob (async)
   *
   * @param type - MIME type (default: 'image/png')
   * @returns Promise that resolves to Blob
   */
  toBlob(type?: string): Promise<Blob>;

  /**
   * Get image dimensions
   */
  getDimensions(): ImageDimensions;

  /**
   * Create independent copy
   */
  clone(): ImageProcessor;

  // ===== Filter Operations (Color Space) =====

  /**
   * Convert to grayscale using luminosity method
   * Implements CIE standard formula: 0.299R + 0.587G + 0.114B
   */
  grayscale(): this;

  /**
   * Apply Gaussian blur
   *
   * @param radius - Blur radius in pixels (0-50)
   * @throws {Error} If radius is out of bounds
   */
  blur(radius?: number): this;

  /**
   * Apply unsharp masking sharpening
   *
   * @param amount - Sharpening intensity (0-5)
   * @throws {Error} If amount is out of bounds
   */
  sharpen(amount?: number): this;

  /**
   * Apply Sobel edge detection
   */
  edgeDetect(): this;

  /**
   * Apply sepia tone effect
   */
  sepia(): this;

  /**
   * Invert all colors
   */
  invert(): this;

  /**
   * Adjust brightness
   *
   * @param amount - Brightness adjustment (-100 to 100)
   * @throws {Error} If amount is out of bounds
   */
  brightness(amount?: number): this;

  /**
   * Adjust contrast
   *
   * @param amount - Contrast adjustment (-100 to 100)
   * @throws {Error} If amount is out of bounds
   */
  contrast(amount?: number): this;

  // ===== Transform Operations =====

  /**
   * Mirror image horizontally (flip left-right)
   */
  flipHorizontal(): this;

  /**
   * Mirror image vertically (flip top-bottom)
   */
  flipVertical(): this;

  /**
   * Rotate image 90 degrees clockwise
   * Note: Swaps width and height
   */
  rotate90(): this;

  /**
   * Resize image to new dimensions using nearest-neighbor interpolation
   *
   * @param newWidth - Target width in pixels (must be > 0)
   * @param newHeight - Target height in pixels (must be > 0)
   * @throws {Error} If dimensions are invalid
   */
  resize(newWidth: number, newHeight: number): this;

  // ===== Convenience Methods (Instagram-style Filters) =====

  /**
   * Apply Instagram-style Nashville filter
   * Warm, vintage effect with increased brightness and sepia
   */
  filterNashville(): this;

  /**
   * Apply Instagram-style Clarendon filter
   * High contrast with slightly increased brightness
   */
  filterClarendon(): this;

  /**
   * Apply Instagram-style Lomo filter
   * Dark, contrasty effect
   */
  filterLomo(): this;
}

export default ImageProcessor;
