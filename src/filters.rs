/// Color space filter operations
use crate::utils::{clamp, blur_gaussian};

/// Convert image to grayscale using luminosity method
pub fn grayscale(data: &mut [u8]) {
    for i in (0..data.len()).step_by(4) {
        let r = data[i] as f32;
        let g = data[i + 1] as f32;
        let b = data[i + 2] as f32;

        // Standard luminosity formula
        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }
}

/// Apply Gaussian blur
pub fn blur(data: &mut [u8], width: u32, height: u32, radius: f32) {
    blur_gaussian(data, width, height, radius);
}

/// Sharpen filter using unsharp masking
pub fn sharpen(data: &mut [u8], width: u32, height: u32, amount: f32) {
    let width = width as usize;
    let height = height as usize;
    let mut blurred = vec![0u8; data.len()];
    blurred.copy_from_slice(data);

    // Create a slightly blurred version
    blur_gaussian(&mut blurred, width as u32, height as u32, 1.0);

    // Unsharp mask: original + (original - blurred) * amount
    for i in (0..data.len()).step_by(4) {
        for c in 0..3 {
            let original = data[i + c] as f32;
            let blurred_val = blurred[i + c] as f32;
            let sharpened = original + (original - blurred_val) * amount;
            data[i + c] = clamp(sharpened, 0.0, 255.0) as u8;
        }
    }
}

/// Sobel edge detection
pub fn edge_detect(data: &mut [u8], width: u32, height: u32) {
    let width = width as usize;
    let height = height as usize;
    let mut output = vec![0u8; data.len()];

    // Sobel kernels
    let sobel_x = [[-1.0, 0.0, 1.0], [-2.0, 0.0, 2.0], [-1.0, 0.0, 1.0]];
    let sobel_y = [[-1.0, -2.0, -1.0], [0.0, 0.0, 0.0], [1.0, 2.0, 1.0]];

    for y in 1..(height - 1) {
        for x in 1..(width - 1) {
            let mut gx = 0.0;
            let mut gy = 0.0;

            for ky in 0..3 {
                for kx in 0..3 {
                    let pixel_x = x - 1 + kx;
                    let pixel_y = y - 1 + ky;
                    let idx = (pixel_y * width + pixel_x) * 4;

                    // Use grayscale value
                    let gray = (0.299 * data[idx] as f32
                        + 0.587 * data[idx + 1] as f32
                        + 0.114 * data[idx + 2] as f32);

                    gx += gray * sobel_x[ky][kx];
                    gy += gray * sobel_y[ky][kx];
                }
            }

            let magnitude = (gx * gx + gy * gy).sqrt();
            let edge = clamp(magnitude / 8.0, 0.0, 255.0) as u8;

            let idx = (y * width + x) * 4;
            output[idx] = edge;
            output[idx + 1] = edge;
            output[idx + 2] = edge;
            output[idx + 3] = data[idx + 3];
        }
    }

    data.copy_from_slice(&output);
}
