# Quick Start Guide

Get wasm-image up and running in 5 minutes.

## Installation

```bash
npm install wasm-image
```

## Basic Usage

### 1. From Canvas

```javascript
import { ImageProcessor } from 'wasm-image';

const canvas = document.getElementById('my-canvas');
const processor = ImageProcessor.fromCanvas(canvas);

processor.grayscale().blur(5);

processor.toCanvas(canvas);
```

### 2. From Image URL

```javascript
import { ImageProcessor } from 'wasm-image';

const processor = await ImageProcessor.fromURL('photo.jpg');

processor
  .brightness(15)
  .contrast(20)
  .sharpen(1.5);

const blob = await processor.toBlob('image/jpeg');
```

### 3. From Image Element

```javascript
import { ImageProcessor } from 'wasm-image';

const img = document.getElementById('my-image');
const processor = ImageProcessor.fromImage(img);

processor.sepia();

processor.toCanvas();
```

## Common Filters

```javascript
// Color effects
processor.grayscale();           // Convert to black & white
processor.sepia();               // Warm, vintage look
processor.invert();              // Invert all colors

// Adjustments
processor.brightness(20);        // -100 to 100
processor.contrast(30);          // -100 to 100
processor.blur(5);               // 0-50 pixels
processor.sharpen(1.5);          // 0-5 intensity

// Detection
processor.edgeDetect();          // Find edges (Sobel)

// Transforms
processor.flipHorizontal();      // Mirror left-right
processor.flipVertical();        // Mirror top-bottom
processor.rotate90();            // Rotate 90° clockwise
processor.resize(800, 600);      // Resize to new dimensions
```

## Instagram-Style Filters

```javascript
processor.filterNashville();     // Warm, vintage
processor.filterClarendon();     // High contrast
processor.filterLomo();          // Dark & contrasty
```

## Method Chaining

All filters return `this`, so you can chain:

```javascript
processor
  .brightness(10)
  .contrast(20)
  .sharpen(1)
  .blur(1)
  .sepia();
```

## Get Output

```javascript
// As ImageData (for canvas)
const imageData = processor.toImageData();
ctx.putImageData(imageData, 0, 0);

// As Canvas
const canvas = processor.toCanvas();
document.body.appendChild(canvas);

// As Blob (for download)
const blob = await processor.toBlob('image/png');
const url = URL.createObjectURL(blob);
link.href = url;
```

## Building from Source

### Prerequisites

- Rust: https://rustup.rs/
- wasm-pack: `curl https://rustwasm.org/wasm-pack/installer/init.sh -sSf | sh`

### Build

```bash
git clone https://github.com/yourusername/wasm-image.git
cd wasm-image
npm install
npm run build
```

## Performance

wasm-image is **5-10x faster** than JavaScript:

- Grayscale: 2.5ms (vs 18ms JS) - **7.2x faster**
- Blur: 45ms (vs 320ms JS) - **7.1x faster**
- Sepia: 3ms (vs 22ms JS) - **7.3x faster**

See [README.md](README.md) for detailed benchmarks.

## Examples

### Real-time Video Processing

```javascript
const canvas = document.getElementById('canvas');
const video = document.getElementById('video');
const ctx = canvas.getContext('2d');

function processFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const processor = ImageProcessor.fromCanvas(canvas);
  processor.grayscale().blur(2);

  processor.toCanvas(canvas);
  requestAnimationFrame(processFrame);
}

video.play();
processFrame();
```

### Batch Processing

```javascript
async function processImages(urls) {
  for (const url of urls) {
    const processor = await ImageProcessor.fromURL(url);
    processor.sepia().sharpen(1);

    const blob = await processor.toBlob('image/jpeg');
    await uploadBlob(blob);
  }
}
```

### Filter Presets

```javascript
class Filters {
  static vintage(p) {
    return p.sepia().contrast(15).brightness(10);
  }

  static dramatic(p) {
    return p.contrast(40).brightness(-10).sharpen(2);
  }

  static softFocus(p) {
    return p.blur(3).brightness(5).contrast(-10);
  }
}

// Usage
const processor = await ImageProcessor.fromURL('photo.jpg');
Filters.vintage(processor);
```

## Troubleshooting

### Module Not Found

```bash
npm install
npm run build
```

### WASM Not Loading

Check browser console for errors. Ensure you're running a web server (not local file://).

### Slow Performance

1. Use release build: `npm run build` (not dev)
2. Check image size - very large images will be slower
3. Profile in DevTools Performance tab

## Next Steps

- See [README.md](README.md) for complete API reference
- Check [DEVELOPMENT.md](DEVELOPMENT.md) for extending the library
- View [examples/](examples/) for more advanced usage
- Run benchmarks: `npm run benchmark`

## Learn More

- [Rust WASM Book](https://rustwasm.org/docs/book/)
- [WebAssembly Guide](https://webassembly.org/)
- [Image Processing Wikipedia](https://en.wikipedia.org/wiki/Digital_image_processing)
