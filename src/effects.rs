/// Color effect operations

use crate::utils::clamp;

/// Apply sepia tone effect
pub fn sepia(data: &mut [u8]) {
    for i in (0..data.len()).step_by(4) {
        let r = data[i] as f32;
        let g = data[i + 1] as f32;
        let b = data[i + 2] as f32;

        // Standard sepia transformation
        let output_r = (r * 0.393 + g * 0.769 + b * 0.189) as u8;
        let output_g = (r * 0.349 + g * 0.686 + b * 0.168) as u8;
        let output_b = (r * 0.272 + g * 0.534 + b * 0.131) as u8;

        data[i] = output_r;
        data[i + 1] = output_g;
        data[i + 2] = output_b;
    }
}

/// Invert colors
pub fn invert(data: &mut [u8]) {
    for i in (0..data.len()).step_by(4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
    }
}

/// Adjust brightness
pub fn brightness(data: &mut [u8], amount: i32) {
    let factor = amount as f32 / 100.0;

    for i in (0..data.len()).step_by(4) {
        let r = data[i] as f32 + (255.0 * factor);
        let g = data[i + 1] as f32 + (255.0 * factor);
        let b = data[i + 2] as f32 + (255.0 * factor);

        data[i] = clamp(r, 0.0, 255.0) as u8;
        data[i + 1] = clamp(g, 0.0, 255.0) as u8;
        data[i + 2] = clamp(b, 0.0, 255.0) as u8;
    }
}

/// Adjust contrast
pub fn contrast(data: &mut [u8], amount: i32) {
    let factor = (amount as f32 / 100.0 + 1.0).max(0.0);
    let intercept = 128.0 * (1.0 - factor);

    for i in (0..data.len()).step_by(4) {
        let r = data[i] as f32 * factor + intercept;
        let g = data[i + 1] as f32 * factor + intercept;
        let b = data[i + 2] as f32 * factor + intercept;

        data[i] = clamp(r, 0.0, 255.0) as u8;
        data[i + 1] = clamp(g, 0.0, 255.0) as u8;
        data[i + 2] = clamp(b, 0.0, 255.0) as u8;
    }
}
