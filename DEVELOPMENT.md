# Development Guide

This guide explains how to build, test, and extend the wasm-image library.

## Prerequisites

- **Rust**: Install from [rustup.rs](https://rustup.rs/)
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  source $HOME/.cargo/env
  ```

- **Node.js**: 12+ (download from [nodejs.org](https://nodejs.org/))

- **wasm-pack**: WebAssembly build tool
  ```bash
  curl https://rustwasm.org/wasm-pack/installer/init.sh -sSf | sh
  ```

## Project Structure

```
wasm-image/
├── src/
│   ├── lib.rs              # Main WASM module and public API
│   ├── filters.rs          # Color space filters (grayscale, blur, sharpen, edge)
│   ├── transforms.rs       # Geometric operations (resize, rotate, flip)
│   ├── effects.rs          # Color effects (sepia, invert, brightness, contrast)
│   └── utils.rs            # Helper functions and algorithms
├── js/
│   └── ImageProcessor.js   # JavaScript wrapper with fluent API
├── types/
│   └── ImageProcessor.d.ts # TypeScript type definitions
├── benchmark/
│   └── benchmark.js        # Performance test suite
├── examples/
│   └── demo.html           # Interactive demo application
├── Cargo.toml              # Rust dependencies
├── package.json            # NPM configuration
└── README.md               # User documentation
```

## Building

### Development Build

```bash
npm install
npm run build:dev
```

Creates an unoptimized WASM binary with debug symbols (~2MB). Faster to compile, slower to run.

### Release Build (Optimized)

```bash
npm install
npm run build
```

Creates a highly optimized WASM binary (~150KB). Smaller size, much better performance. Use for production.

### Node.js Build

For Node.js compatibility (different WASM target):

```bash
npm run build:nodejs
```

## Running Benchmarks

Compare WASM vs JavaScript performance:

```bash
npm run benchmark
```

Shows execution times and speedup factors for:
- Grayscale conversion
- Gaussian blur
- Sepia tone
- Contrast adjustment
- Edge detection

## Testing

### Running Tests

```bash
npm test
```

Tests are located in Rust source files using `#[cfg(test)]` modules.

### Manual Testing

1. Open `examples/demo.html` in a web browser
2. Upload an image or use the sample image
3. Apply filters and observe performance
4. Adjust sliders and verify output

## Architecture Overview

### Data Flow

```
Canvas/Image
    ↓
ImageProcessor (JS wrapper)
    ↓
WASM Module (Rust)
    ├── lib.rs: Exposes public API
    ├── filters.rs: Color operations
    ├── transforms.rs: Geometric operations
    ├── effects.rs: Color effects
    └── utils.rs: Helper algorithms
    ↓
Output (Canvas/Blob/ImageData)
```

### Memory Management

- **WASM Memory**: Linear memory buffer allocated by wasm-pack
- **Rust Vec<u8>**: Image data stored in WASM linear memory
- **JavaScript**: Data passed by reference to minimize copies

### Performance Optimizations

1. **Separable Convolution**: Gaussian blur uses 1D horizontal + vertical passes instead of 2D kernel
2. **In-place Modifications**: Operations modify data directly without copying
3. **SIMD-friendly Loops**: Hot loops are written for LLVM auto-vectorization
4. **Minimal Allocations**: Reuse buffers where possible

## Extending the Library

### Adding a New Filter

#### Step 1: Implement in Rust (`src/filters.rs`)

```rust
/// Apply custom filter
pub fn custom_filter(data: &mut [u8], parameter: f32) {
    for i in (0..data.len()).step_by(4) {
        // R, G, B channels (index i, i+1, i+2)
        // Alpha channel (index i+3) - usually preserve

        let r = data[i] as f32;
        let g = data[i + 1] as f32;
        let b = data[i + 2] as f32;

        // Your algorithm here
        let output_r = (r * parameter) as u8;
        let output_g = (g * parameter) as u8;
        let output_b = (b * parameter) as u8;

        data[i] = output_r;
        data[i + 1] = output_g;
        data[i + 2] = output_b;
        // Alpha remains unchanged
    }
}
```

#### Step 2: Export from WASM (`src/lib.rs`)

```rust
// Add to ImageProcessor impl block
pub fn custom_filter(&mut self, parameter: f32) -> Result<(), JsValue> {
    if parameter < 0.0 || parameter > 2.0 {
        return Err(JsValue::from_str("Parameter must be between 0 and 2"));
    }
    filters::custom_filter(&mut self.data, parameter);
    Ok(())
}
```

#### Step 3: Wrap in JavaScript (`js/ImageProcessor.js`)

```javascript
/**
 * Apply custom filter
 */
customFilter(parameter = 1.0) {
  this.processor.custom_filter(parameter);
  return this;
}
```

#### Step 4: Add TypeScript Definition (`types/ImageProcessor.d.ts`)

```typescript
/**
 * Apply custom filter
 *
 * @param parameter - Filter parameter (0-2)
 */
customFilter(parameter?: number): this;
```

#### Step 5: Benchmark It

Add to `benchmark/benchmark.js`:

```javascript
const customFilterResult = comparePerformance(
  () => {
    if (ImageProcessor) {
      const proc = new ImageProcessor(new Uint8Array(testImage), 1024, 1024);
      proc.custom_filter(1.5);
    }
  },
  () => {
    const proc = new JSImageProcessor(new Uint8Array(testImage), 1024, 1024);
    proc.customFilter(1.5);
  },
  'Custom Filter (1024x1024)',
  3
);
results.push(customFilterResult);
formatResults(customFilterResult);
```

#### Step 6: Build and Test

```bash
npm run build
npm run benchmark
```

### Best Practices

#### Performance

1. **Avoid Allocations in Loops**
   ```rust
   // Bad
   for i in 0..data.len() {
       let mut temp = Vec::new();
       temp.push(data[i]);
   }

   // Good
   let mut temp = vec![0; 1000];
   for i in 0..data.len() {
       temp[i % 1000] = data[i];
   }
   ```

2. **Use Native Types**
   ```rust
   // Bad - unnecessary allocations
   let values: Vec<f32> = data.iter().map(|&x| x as f32).collect();

   // Good - work directly with data
   for i in (0..data.len()).step_by(4) {
       let r = data[i] as f32;
   }
   ```

3. **Write Cache-Friendly Code**
   ```rust
   // Sequential access is faster than random
   for i in 0..data.len() {
       process(data[i]);  // Cache hits
   }
   ```

#### Safety

1. **Always Validate Parameters**
   ```rust
   pub fn blur(&mut self, radius: f32) -> Result<(), JsValue> {
       if radius <= 0.0 || radius > 50.0 {
           return Err(JsValue::from_str("Radius must be between 0 and 50"));
       }
       // ...
   }
   ```

2. **Preserve Alpha Channel**
   ```rust
   // Always preserve alpha unless specifically intended otherwise
   // data[i+3] = alpha; // Don't modify
   ```

3. **Bounds Check**
   ```rust
   // When accessing neighbor pixels
   if x > 0 && x < width - 1 && y > 0 && y < height - 1 {
       // Safe to access surrounding pixels
   }
   ```

#### Code Style

- Use meaningful variable names
- Add documentation comments for public functions
- Keep functions focused and testable
- Follow Rust naming conventions (snake_case for functions)

## Debugging

### WASM Module

1. **Check Build Errors**
   ```bash
   npm run build 2>&1 | head -50
   ```

2. **Enable Debug Symbols**
   ```bash
   npm run build:dev
   ```

3. **Inspect Generated WASM**
   ```bash
   wasm2wat pkg/wasm_image_bg.wasm | less
   ```

### JavaScript Integration

1. **Browser DevTools**
   - Open DevTools (F12)
   - Check Console for errors
   - Profile performance with Performance tab

2. **Debug Wrapper**
   ```javascript
   // Add logging to ImageProcessor.js
   console.log('Input dimensions:', width, height);
   console.log('Processing time:', endTime - startTime);
   ```

## Performance Profiling

### Benchmark Suite

```bash
npm run benchmark
```

Generates detailed metrics for each operation.

### Browser Profiling

1. Open DevTools → Performance tab
2. Click record
3. Perform image operations
4. Stop recording
5. Analyze flame graph

### Rust Profiling

Use perf on Linux:
```bash
perf record cargo test --release
perf report
```

## Continuous Integration

### Pre-commit Checks

Run before committing:
```bash
npm run build
npm test
npm run benchmark
```

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions-rs/toolchain@v1
      - run: npm install
      - run: npm run build
      - run: npm test
```

## Troubleshooting

### WASM Module Not Loading

**Error**: "Cannot find module 'wasm_image'"

**Solution**:
```bash
npm install
npm run build
```

### Incorrect Imports

**Error**: "TypeError: ImageProcessor is not a constructor"

**Solution**:
```javascript
// Wrong
import ImageProcessor from 'wasm-image';

// Correct
import { ImageProcessor } from 'wasm-image';
// or
const { ImageProcessor } = require('wasm-image');
```

### Performance Issues

**Problem**: WASM is slow

**Solutions**:
1. Use release build: `npm run build`
2. Check browser support (older browsers may have slower WASM)
3. Profile with browser DevTools
4. Check for unnecessary allocations in filter code

### Memory Issues

**Problem**: "Out of memory" errors on large images

**Solutions**:
1. Process smaller image regions
2. Check for memory leaks in repeated operations
3. Use `clone()` for independent copies, not repeated constructor calls

## Resources

- **Rust WASM Book**: https://rustwasm.org/docs/book/
- **wasm-pack Documentation**: https://rustwasm.org/docs/wasm-pack/
- **Rust Image Crate**: https://github.com/image-rs/image
- **WebAssembly Spec**: https://webassembly.org/

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Implement your changes
4. Add benchmarks for new features
5. Test: `npm run build && npm test && npm run benchmark`
6. Submit a pull request

## License

MIT
