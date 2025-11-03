/// Utility functions for image processing

/// Clamp a value between min and max
pub fn clamp(value: f32, min: f32, max: f32) -> f32 {
    value.max(min).min(max)
}

/// Generate Gaussian kernel
fn gaussian_kernel(radius: f32) -> Vec<f32> {
    let kernel_size = ((radius * 2.0).ceil() as usize) | 1; // Ensure odd size
    let mut kernel = vec![0.0; kernel_size];
    let sigma = radius / 3.0;
    let sigma_sq = sigma * sigma;
    let pi = std::f32::consts::PI;
    let center = (kernel_size as f32 - 1.0) / 2.0;
    let mut sum = 0.0;

    for i in 0..kernel_size {
        let x = i as f32 - center;
        let gauss = 1.0 / (2.0 * pi * sigma_sq) * (-x * x / (2.0 * sigma_sq)).exp();
        kernel[i] = gauss;
        sum += gauss;
    }

    // Normalize
    for k in &mut kernel {
        *k /= sum;
    }

    kernel
}

/// Apply Gaussian blur using separable convolution for efficiency
pub fn blur_gaussian(data: &mut [u8], width: u32, height: u32, radius: f32) {
    let width = width as usize;
    let height = height as usize;
    let kernel = gaussian_kernel(radius);
    let kernel_radius = (kernel.len() as i32 - 1) / 2;

    // Horizontal pass
    let mut temp = vec![0u8; data.len()];
    for y in 0..height {
        for x in 0..width {
            for c in 0..3 {
                // Skip alpha channel
                let mut sum = 0.0;
                let mut weight_sum = 0.0;

                for k in 0..kernel.len() {
                    let kx = x as i32 + k as i32 - kernel_radius;
                    if kx >= 0 && kx < width as i32 {
                        let idx = (y * width + kx as usize) * 4 + c;
                        sum += data[idx] as f32 * kernel[k];
                        weight_sum += kernel[k];
                    }
                }

                let idx = (y * width + x) * 4 + c;
                temp[idx] = (sum / weight_sum.max(1.0)) as u8;
            }
            // Copy alpha
            let idx = (y * width + x) * 4 + 3;
            temp[idx] = data[idx];
        }
    }

    // Vertical pass
    for y in 0..height {
        for x in 0..width {
            for c in 0..3 {
                let mut sum = 0.0;
                let mut weight_sum = 0.0;

                for k in 0..kernel.len() {
                    let ky = y as i32 + k as i32 - kernel_radius;
                    if ky >= 0 && ky < height as i32 {
                        let idx = (ky as usize * width + x) * 4 + c;
                        sum += temp[idx] as f32 * kernel[k];
                        weight_sum += kernel[k];
                    }
                }

                let idx = (y * width + x) * 4 + c;
                data[idx] = (sum / weight_sum.max(1.0)) as u8;
            }
            // Copy alpha
            let idx = (y * width + x) * 4 + 3;
            data[idx] = temp[idx + 3];
        }
    }
}
