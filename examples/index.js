/**
 * wasm-image Examples
 * Practical usage patterns and advanced techniques
 */

import { ImageProcessor } from '../js/ImageProcessor.js';

// ============================================================
// BASIC USAGE
// ============================================================

/**
 * Example 1: Load and apply single filter
 */
export async function example1_basicFilter() {
  const processor = await ImageProcessor.fromURL('photo.jpg');

  // Apply a single filter
  processor.grayscale();

  // Get result
  const canvas = processor.toCanvas();
  document.getElementById('result').appendChild(canvas);
}

/**
 * Example 2: Method chaining
 */
export async function example2_methodChaining() {
  const processor = await ImageProcessor.fromURL('photo.jpg');

  // Chain multiple operations
  processor
    .brightness(15)
    .contrast(25)
    .sharpen(1.5)
    .sepia();

  const blob = await processor.toBlob('image/jpeg');
  downloadBlob(blob, 'processed.jpg');
}

/**
 * Example 3: Canvas integration
 */
export function example3_canvasIntegration() {
  const canvas = document.getElementById('input-canvas');
  const outputCanvas = document.getElementById('output-canvas');

  // Load from canvas
  const processor = ImageProcessor.fromCanvas(canvas);

  // Process
  processor.blur(5).sharpen(1);

  // Draw to another canvas
  processor.toCanvas(outputCanvas);
}

// ============================================================
// ADVANCED USAGE
// ============================================================

/**
 * Example 4: Creating filter presets
 */
export class FilterPresets {
  static vintage(processor) {
    return processor
      .sepia()
      .contrast(15)
      .brightness(10);
  }

  static dramatic(processor) {
    return processor
      .contrast(40)
      .brightness(-10)
      .sharpen(2);
  }

  static softFocus(processor) {
    return processor
      .blur(3)
      .brightness(5)
      .contrast(-10);
  }

  static highContrast(processor) {
    return processor
      .contrast(50)
      .sharpen(2)
      .brightness(10);
  }

  static coolTone(processor) {
    // Reduce red, increase blue
    const data = processor.getData();
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, data[i] - 30);     // Reduce red
      data[i + 2] = Math.min(255, data[i + 2] + 20); // Increase blue
    }
    return processor;
  }
}

/**
 * Example 5: Batch processing
 */
export async function example5_batchProcessing() {
  const imageUrls = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];
  const processedBlobs = [];

  for (const url of imageUrls) {
    const processor = await ImageProcessor.fromURL(url);
    processor.grayscale().contrast(20);
    const blob = await processor.toBlob('image/jpeg');
    processedBlobs.push(blob);
  }

  return processedBlobs;
}

/**
 * Example 6: Comparison sliders
 */
export class ComparisonSlider {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.processor = null;
    this.originalCanvas = null;
    this.processedCanvas = null;
    this.slider = null;
  }

  async init(imageUrl) {
    this.processor = await ImageProcessor.fromURL(imageUrl);

    // Create canvases
    this.originalCanvas = this.processor.clone().toCanvas();
    this.processor.grayscale().blur(5);
    this.processedCanvas = this.processor.toCanvas();

    // Setup slider UI
    this.container.innerHTML = `
      <div style="position: relative; width: 100%; max-width: 500px;">
        <canvas id="original"></canvas>
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden;">
          <canvas id="processed"></canvas>
          <input type="range" min="0" max="100" value="50"
                 style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        width: 200px; cursor: pointer;">
        </div>
      </div>
    `;

    const originalCanvas = this.container.querySelector('#original');
    const processedCanvas = this.container.querySelector('#processed');
    const slider = this.container.querySelector('input[type="range"]');

    originalCanvas.parentElement.appendChild(this.originalCanvas);
    originalCanvas.parentElement.appendChild(this.processedCanvas);

    slider.addEventListener('input', (e) => {
      const width = (e.target.value / 100) * this.processedCanvas.width;
      processedCanvas.style.width = width + 'px';
    });
  }
}

/**
 * Example 7: Real-time video processing
 */
export class VideoProcessor {
  constructor(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.isProcessing = false;
    this.filter = 'grayscale';
  }

  start() {
    this.isProcessing = true;
    this.processFrame();
  }

  stop() {
    this.isProcessing = false;
  }

  setFilter(filterName) {
    this.filter = filterName;
  }

  processFrame() {
    if (!this.isProcessing) return;

    // Draw video frame
    this.ctx.drawImage(
      this.video,
      0, 0,
      this.canvas.width,
      this.canvas.height
    );

    // Process with wasm-image
    const processor = ImageProcessor.fromCanvas(this.canvas);

    switch (this.filter) {
      case 'grayscale':
        processor.grayscale();
        break;
      case 'sepia':
        processor.sepia();
        break;
      case 'edge':
        processor.edgeDetect();
        break;
      case 'blur':
        processor.blur(3);
        break;
      default:
        break;
    }

    // Draw result
    processor.toCanvas(this.canvas);

    requestAnimationFrame(() => this.processFrame());
  }
}

/**
 * Example 8: Progressive image loading
 */
export class ProgressiveImageLoader {
  static async loadWithPreview(imageUrl) {
    // 1. Create small thumbnail
    const processor = await ImageProcessor.fromURL(imageUrl);
    const thumbnail = processor.clone().resize(100, 100);
    const thumbCanvas = thumbnail.toCanvas();
    document.getElementById('preview').appendChild(thumbCanvas);

    // 2. Apply filters while loading
    processor.blur(10);
    const lowQuality = await processor.toBlob('image/jpeg');
    document.getElementById('lowquality').src = URL.createObjectURL(lowQuality);

    // 3. Full quality
    const fullProcessor = await ImageProcessor.fromURL(imageUrl);
    fullProcessor.grayscale();
    const fullBlob = await fullProcessor.toBlob('image/jpeg');
    document.getElementById('fullquality').src = URL.createObjectURL(fullBlob);
  }
}

/**
 * Example 9: Image comparison - before/after
 */
export class BeforeAfterComparison {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.processor = null;
  }

  async init(imageUrl, filterFunction) {
    this.processor = await ImageProcessor.fromURL(imageUrl);

    const beforeCanvas = this.processor.clone().toCanvas();
    const afterProcessor = this.processor.clone();
    filterFunction(afterProcessor);
    const afterCanvas = afterProcessor.toCanvas();

    this.container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <h3>Before</h3>
        </div>
        <div>
          <h3>After</h3>
        </div>
      </div>
    `;

    this.container.children[0].appendChild(beforeCanvas);
    this.container.children[1].appendChild(afterCanvas);
  }
}

/**
 * Example 10: Export in multiple formats
 */
export async function example10_multiFormatExport() {
  const processor = await ImageProcessor.fromURL('photo.jpg');
  processor.sepia();

  // Export as PNG
  const pngBlob = await processor.toBlob('image/png');
  downloadBlob(pngBlob, 'photo.png');

  // Export as JPEG
  const jpegBlob = await processor.toBlob('image/jpeg');
  downloadBlob(jpegBlob, 'photo.jpg');

  // Export as canvas
  const canvas = processor.toCanvas();
  return canvas;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Download blob as file
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Apply multiple filters in sequence
 */
export function applyFilterSequence(processor, filters) {
  for (const { name, params } of filters) {
    if (typeof processor[name] === 'function') {
      processor[name](...params);
    }
  }
  return processor;
}

/**
 * Example: Applying filter sequence
 */
export async function example11_filterSequence() {
  const processor = await ImageProcessor.fromURL('photo.jpg');

  const filters = [
    { name: 'brightness', params: [10] },
    { name: 'contrast', params: [20] },
    { name: 'sharpen', params: [1.5] },
    { name: 'blur', params: [1] },
  ];

  applyFilterSequence(processor, filters);
  return await processor.toBlob('image/jpeg');
}

/**
 * Performance comparison helper
 */
export async function benchmarkFilter(imageUrl, filterFunction, iterations = 5) {
  const processor = await ImageProcessor.fromURL(imageUrl);
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const clone = processor.clone();
    const start = performance.now();
    filterFunction(clone);
    const end = performance.now();
    times.push(end - start);
  }

  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: times.reduce((a, b) => a + b) / times.length,
    times,
  };
}

/**
 * Example: Benchmark custom filter
 */
export async function example12_benchmark() {
  const result = await benchmarkFilter(
    'photo.jpg',
    (processor) => processor.grayscale().blur(5),
    5
  );

  console.log(`Grayscale + Blur`);
  console.log(`Average: ${result.avg.toFixed(2)}ms`);
  console.log(`Min: ${result.min.toFixed(2)}ms`);
  console.log(`Max: ${result.max.toFixed(2)}ms`);
}

// ============================================================
// ADVANCED EXAMPLES
// ============================================================

/**
 * Example 13: Custom image processing pipeline
 */
export class ImageProcessingPipeline {
  constructor() {
    this.steps = [];
  }

  add(filterName, params = []) {
    this.steps.push({ filterName, params });
    return this;
  }

  async process(imageUrl) {
    let processor = await ImageProcessor.fromURL(imageUrl);

    for (const { filterName, params } of this.steps) {
      if (typeof processor[filterName] === 'function') {
        processor[filterName](...params);
      }
    }

    return processor;
  }
}

/**
 * Usage example
 */
export async function example13_pipeline() {
  const pipeline = new ImageProcessingPipeline()
    .add('brightness', [15])
    .add('contrast', [20])
    .add('sharpen', [1.5])
    .add('blur', [1]);

  const processor = await pipeline.process('photo.jpg');
  const result = processor.toCanvas();
  return result;
}

/**
 * Example 14: Adaptive image processing based on analysis
 */
export async function example14_adaptiveProcessing() {
  const processor = await ImageProcessor.fromURL('photo.jpg');
  const data = processor.getData();

  // Analyze brightness
  let brightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    brightness += gray;
  }
  brightness = brightness / (data.length / 4);

  // Apply filters based on analysis
  if (brightness < 100) {
    processor.brightness(30).contrast(20);
  } else if (brightness > 200) {
    processor.brightness(-20).contrast(20);
  } else {
    processor.contrast(15);
  }

  return processor;
}

export default {
  FilterPresets,
  ComparisonSlider,
  VideoProcessor,
  ProgressiveImageLoader,
  BeforeAfterComparison,
  ImageProcessingPipeline,
};
