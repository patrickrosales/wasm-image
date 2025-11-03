/// Geometric transformation operations

/// Resize image using nearest neighbor algorithm
pub fn resize(data: &[u8], width: u32, height: u32, new_width: u32, new_height: u32) -> Vec<u8> {
    let mut output = vec![0u8; (new_width * new_height * 4) as usize];

    let x_scale = width as f32 / new_width as f32;
    let y_scale = height as f32 / new_height as f32;

    for y in 0..new_height {
        for x in 0..new_width {
            let src_x = (x as f32 * x_scale) as u32;
            let src_y = (y as f32 * y_scale) as u32;

            let src_idx = ((src_y * width + src_x) * 4) as usize;
            let dst_idx = ((y * new_width + x) * 4) as usize;

            output[dst_idx] = data[src_idx];
            output[dst_idx + 1] = data[src_idx + 1];
            output[dst_idx + 2] = data[src_idx + 2];
            output[dst_idx + 3] = data[src_idx + 3];
        }
    }

    output
}

/// Rotate image 90 degrees clockwise
pub fn rotate(data: &[u8], width: u32, height: u32) -> Vec<u8> {
    let mut output = vec![0u8; data.len()];
    let new_width = height;
    let new_height = width;

    for y in 0..height {
        for x in 0..width {
            let src_idx = ((y * width + x) * 4) as usize;
            let dst_x = height - 1 - y;
            let dst_y = x;
            let dst_idx = ((dst_y * new_width + dst_x) * 4) as usize;

            output[dst_idx] = data[src_idx];
            output[dst_idx + 1] = data[src_idx + 1];
            output[dst_idx + 2] = data[src_idx + 2];
            output[dst_idx + 3] = data[src_idx + 3];
        }
    }

    output
}

/// Flip image horizontally
pub fn flip_horizontal(data: &mut [u8], width: u32, height: u32) {
    let width = width as usize;
    let height = height as usize;

    for y in 0..height {
        for x in 0..(width / 2) {
            let left_idx = (y * width + x) * 4;
            let right_idx = (y * width + (width - 1 - x)) * 4;

            for c in 0..4 {
                data.swap(left_idx + c, right_idx + c);
            }
        }
    }
}

/// Flip image vertically
pub fn flip_vertical(data: &mut [u8], width: u32, height: u32) {
    let width = width as usize;
    let height = height as usize;

    for y in 0..(height / 2) {
        for x in 0..width {
            let top_idx = (y * width + x) * 4;
            let bottom_idx = ((height - 1 - y) * width + x) * 4;

            for c in 0..4 {
                data.swap(top_idx + c, bottom_idx + c);
            }
        }
    }
}
