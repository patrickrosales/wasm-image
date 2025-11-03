/**
 * Performance benchmarks comparing WASM vs JavaScript implementations
 */

// Pure JavaScript implementations for comparison
class JSImageProcessor {
  constructor(data, width, height) {
    this.data = new Uint8Array(data);
    this.width = width;
    this.height = height;
  }

  grayscale() {
    for (let i = 0; i < this.data.length; i += 4) {
      const r = this.data[i];
      const g = this.data[i + 1];
      const b = this.data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      this.data[i] = gray;
      this.data[i + 1] = gray;
      this.data[i + 2] = gray;
    }
  }

  blur(radius) {
    const kernel = this._gaussianKernel(radius);
    const kernelRadius = Math.floor(kernel.length / 2);
    const temp = new Uint8Array(this.data);

    // Horizontal pass
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let weightSum = 0;

          for (let k = 0; k < kernel.length; k++) {
            const kx = x + k - kernelRadius;
            if (kx >= 0 && kx < this.width) {
              const idx = (y * this.width + kx) * 4 + c;
              sum += this.data[idx] * kernel[k];
              weightSum += kernel[k];
            }
          }

          const idx = (y * this.width + x) * 4 + c;
          temp[idx] = Math.round(sum / Math.max(weightSum, 1));
        }
      }
    }

    // Vertical pass
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let weightSum = 0;

          for (let k = 0; k < kernel.length; k++) {
            const ky = y + k - kernelRadius;
            if (ky >= 0 && ky < this.height) {
              const idx = (ky * this.width + x) * 4 + c;
              sum += temp[idx] * kernel[k];
              weightSum += kernel[k];
            }
          }

          const idx = (y * this.width + x) * 4 + c;
          this.data[idx] = Math.round(sum / Math.max(weightSum, 1));
        }
      }
    }
  }

  sepia() {
    for (let i = 0; i < this.data.length; i += 4) {
      const r = this.data[i];
      const g = this.data[i + 1];
      const b = this.data[i + 2];

      this.data[i] = Math.round(r * 0.393 + g * 0.769 + b * 0.189);
      this.data[i + 1] = Math.round(r * 0.349 + g * 0.686 + b * 0.168);
      this.data[i + 2] = Math.round(r * 0.272 + g * 0.534 + b * 0.131);
    }
  }

  contrast(amount) {
    const factor = amount / 100 + 1;
    const intercept = 128 * (1 - factor);

    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = Math.max(0, Math.min(255, this.data[i] * factor + intercept));
      this.data[i + 1] = Math.max(0, Math.min(255, this.data[i + 1] * factor + intercept));
      this.data[i + 2] = Math.max(0, Math.min(255, this.data[i + 2] * factor + intercept));
    }
  }

  _gaussianKernel(radius) {
    const kernelSize = Math.ceil(radius * 2) | 1;
    const kernel = new Array(kernelSize);
    const sigma = radius / 3;
    const sigmaSq = sigma * sigma;
    const center = (kernelSize - 1) / 2;
    let sum = 0;

    for (let i = 0; i < kernelSize; i++) {
      const x = i - center;
      const gauss = Math.exp(-(x * x) / (2 * sigmaSq)) / Math.sqrt(2 * Math.PI * sigmaSq);
      kernel[i] = gauss;
      sum += gauss;
    }

    // Normalize
    for (let i = 0; i < kernelSize; i++) {
      kernel[i] /= sum;
    }

    return kernel;
  }
}

/**
 * Run a benchmark test
 */
function benchmark(name, fn, iterations = 5) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return { name, avg, min, max, times };
}

/**
 * Compare WASM vs JavaScript performance
 */
function comparePerformance(wasmFn, jsFn, name, iterations = 5) {
  const wasmResult = benchmark(`${name} (WASM)`, wasmFn, iterations);
  const jsResult = benchmark(`${name} (JavaScript)`, jsFn, iterations);

  const speedup = jsResult.avg / wasmResult.avg;

  return {
    name,
    wasm: wasmResult,
    js: jsResult,
    speedup: speedup.toFixed(2),
  };
}

/**
 * Create synthetic image data for testing
 */
function createTestImage(width = 1024, height = 1024) {
  const data = new Uint8ClampedArray(width * height * 4);

  // Create a colorful gradient pattern
  for (let i = 0; i < width * height; i++) {
    const x = i % width;
    const y = Math.floor(i / width);

    data[i * 4] = (x / width) * 255; // Red gradient
    data[i * 4 + 1] = (y / height) * 255; // Green gradient
    data[i * 4 + 2] = Math.sin(i / 1000) * 127 + 128; // Blue wave
    data[i * 4 + 3] = 255; // Alpha
  }

  return data;
}

/**
 * Format benchmark results for display
 */
function formatResults(result) {
  const { name, wasm, js, speedup } = result;

  console.log(`\n${name}`);
  console.log(`${'='.repeat(50)}`);
  console.log(`WASM:       ${wasm.avg.toFixed(2)}ms (min: ${wasm.min.toFixed(2)}ms, max: ${wasm.max.toFixed(2)}ms)`);
  console.log(`JavaScript: ${js.avg.toFixed(2)}ms (min: ${js.min.toFixed(2)}ms, max: ${js.max.toFixed(2)}ms)`);
  console.log(`Speedup:    ${speedup}x faster`);
}

/**
 * Main benchmark suite
 */
async function runBenchmarks() {
  console.log('wasm-image Performance Benchmarks');
  console.log('==================================\n');

  // Create test image (1024x1024)
  const testImage = createTestImage(1024, 1024);

  // Import WASM module (for Node.js testing)
  let ImageProcessor;
  try {
    // Try loading from built WASM module
    const wasmModule = await import('../pkg/wasm_image.js');
    ImageProcessor = wasmModule.ImageProcessor;
  } catch (e) {
    console.error('Note: WASM module not found. Make sure to run: npm run build');
    console.error('Running JavaScript-only benchmarks...\n');
    ImageProcessor = null;
  }

  const results = [];

  // Test 1: Grayscale
  const grayscaleResult = comparePerformance(
    () => {
      if (ImageProcessor) {
        const proc = new ImageProcessor(new Uint8Array(testImage), 1024, 1024);
        proc.grayscale();
      }
    },
    () => {
      const proc = new JSImageProcessor(new Uint8Array(testImage), 1024, 1024);
      proc.grayscale();
    },
    'Grayscale Filter (1024x1024)',
    3
  );
  results.push(grayscaleResult);
  formatResults(grayscaleResult);

  // Test 2: Blur
  if (ImageProcessor) {
    const blurResult = comparePerformance(
      () => {
        const proc = new ImageProcessor(new Uint8Array(testImage), 1024, 1024);
        proc.blur(5);
      },
      () => {
        const proc = new JSImageProcessor(new Uint8Array(testImage), 1024, 1024);
        proc.blur(5);
      },
      'Gaussian Blur (radius=5, 1024x1024)',
      2
    );
    results.push(blurResult);
    formatResults(blurResult);
  }

  // Test 3: Sepia
  const sepiaResult = comparePerformance(
    () => {
      if (ImageProcessor) {
        const proc = new ImageProcessor(new Uint8Array(testImage), 1024, 1024);
        proc.sepia();
      }
    },
    () => {
      const proc = new JSImageProcessor(new Uint8Array(testImage), 1024, 1024);
      proc.sepia();
    },
    'Sepia Tone (1024x1024)',
    3
  );
  results.push(sepiaResult);
  formatResults(sepiaResult);

  // Test 4: Contrast
  const contrastResult = comparePerformance(
    () => {
      if (ImageProcessor) {
        const proc = new ImageProcessor(new Uint8Array(testImage), 1024, 1024);
        proc.contrast(30);
      }
    },
    () => {
      const proc = new JSImageProcessor(new Uint8Array(testImage), 1024, 1024);
      proc.contrast(30);
    },
    'Contrast Adjustment (1024x1024)',
    3
  );
  results.push(contrastResult);
  formatResults(contrastResult);

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log('Summary');
  console.log('='.repeat(50));

  if (results.length > 0) {
    const avgSpeedup =
      results.reduce((sum, r) => sum + parseFloat(r.speedup), 0) / results.length;
    console.log(`Average speedup: ${avgSpeedup.toFixed(2)}x`);
  }

  console.log('\nNote: Blur test requires full WASM build');
  console.log('Run: npm run build && npm run benchmark');
}

// Run benchmarks if this is the main module
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

module.exports = { benchmark, comparePerformance, createTestImage, JSImageProcessor };
