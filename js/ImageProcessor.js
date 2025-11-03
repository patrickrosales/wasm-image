/**
 * High-performance image processing library using WebAssembly
 * Provides a fluent API for chaining image operations
 */

import * as wasm from '../pkg/wasm_image_bg.wasm';
import { ImageProcessor as WasmImageProcessor } from '../pkg/wasm_image.js';

export class ImageProcessor {
  constructor(imageData, width, height) {
    // Support multiple input formats
    if (typeof imageData === 'object' && imageData.data) {
      // CanvasImageData format
      this.width = imageData.width;
      this.height = imageData.height;
      this.data = new Uint8Array(imageData.data);
    } else if (ArrayBuffer.isView(imageData)) {
      // Raw typed array
      this.data = new Uint8Array(imageData);
      this.width = width;
      this.height = height;
    } else {
      throw new Error('Invalid image data format');
    }

    this.processor = null;
    this._initWasm();
  }

  /**
   * Initialize the WASM module
   */
  _initWasm() {
    try {
      this.processor = new WasmImageProcessor(
        this.data,
        this.width,
        this.height
      );
    } catch (e) {
      throw new Error(`Failed to initialize WASM processor: ${e.message}`);
    }
  }

  /**
   * Create an ImageProcessor from a canvas context
   */
  static fromCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return new ImageProcessor(imageData);
  }

  /**
   * Create an ImageProcessor from an Image element
   */
  static fromImage(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    return ImageProcessor.fromCanvas(canvas);
  }

  /**
   * Load image from URL
   */
  static async fromURL(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        resolve(ImageProcessor.fromImage(image));
      };
      image.onerror = () => {
        reject(new Error(`Failed to load image from ${url}`));
      };
      image.src = url;
    });
  }

  /**
   * Get the processed image data
   */
  getData() {
    if (!this.processor) {
      throw new Error('WASM processor not initialized');
    }
    return this.processor.get_data();
  }

  /**
   * Get image as ImageData for canvas
   */
  toImageData() {
    const data = this.getData();
    return new ImageData(new Uint8ClampedArray(data), this.width, this.height);
  }

  /**
   * Draw image to canvas
   */
  toCanvas(canvas = null) {
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
    }
    const ctx = canvas.getContext('2d');
    ctx.putImageData(this.toImageData(), 0, 0);
    return canvas;
  }

  /**
   * Get image as blob
   */
  async toBlob(type = 'image/png') {
    return new Promise(resolve => {
      this.toCanvas().toBlob(resolve, type);
    });
  }

  // ===== Filter Operations =====

  /**
   * Apply grayscale filter
   */
  grayscale() {
    this.processor.grayscale();
    return this;
  }

  /**
   * Apply Gaussian blur
   */
  blur(radius = 3) {
    this.processor.blur(radius);
    return this;
  }

  /**
   * Apply sharpen filter
   */
  sharpen(amount = 1.0) {
    this.processor.sharpen(amount);
    return this;
  }

  /**
   * Apply edge detection (Sobel)
   */
  edgeDetect() {
    this.processor.edge_detect();
    return this;
  }

  /**
   * Apply sepia tone
   */
  sepia() {
    this.processor.sepia();
    return this;
  }

  /**
   * Invert colors
   */
  invert() {
    this.processor.invert();
    return this;
  }

  /**
   * Adjust brightness
   */
  brightness(amount = 0) {
    this.processor.brightness(amount);
    return this;
  }

  /**
   * Adjust contrast
   */
  contrast(amount = 0) {
    this.processor.contrast(amount);
    return this;
  }

  // ===== Transform Operations =====

  /**
   * Flip image horizontally
   */
  flipHorizontal() {
    this.processor.flip_horizontal();
    return this;
  }

  /**
   * Flip image vertically
   */
  flipVertical() {
    this.processor.flip_vertical();
    return this;
  }

  /**
   * Rotate image 90 degrees clockwise
   */
  rotate90() {
    this.processor.rotate_90();
    // Swap dimensions
    [this.width, this.height] = [this.height, this.width];
    return this;
  }

  /**
   * Resize image
   */
  resize(newWidth, newHeight) {
    this.processor.resize(newWidth, newHeight);
    this.width = newWidth;
    this.height = newHeight;
    return this;
  }

  // ===== Convenience Methods =====

  /**
   * Apply Instagram-style Nashville filter
   */
  filterNashville() {
    return this.brightness(10).contrast(5).sepia();
  }

  /**
   * Apply Instagram-style Clarendon filter
   */
  filterClarendon() {
    return this.contrast(20).brightness(5);
  }

  /**
   * Apply Instagram-style Lomo filter
   */
  filterLomo() {
    return this.contrast(15).brightness(-10);
  }

  /**
   * Get dimensions
   */
  getDimensions() {
    return {
      width: this.width,
      height: this.height,
      pixels: this.width * this.height,
    };
  }

  /**
   * Clone the processor
   */
  clone() {
    return new ImageProcessor(new Uint8Array(this.data), this.width, this.height);
  }
}

export default ImageProcessor;
