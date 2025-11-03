use wasm_bindgen::prelude::*;
use std::cell::RefCell;

pub mod filters;
pub mod transforms;
pub mod effects;
pub mod utils;

use filters::{grayscale, blur, sharpen, edge_detect};
use transforms::{resize, rotate, flip_horizontal, flip_vertical};
use effects::{sepia, invert, brightness, contrast};

// Thread-local image buffer for efficiency
thread_local! {
    static IMAGE_BUFFER: RefCell<Vec<u8>> = RefCell::new(Vec::new());
}

/// Main image processor for WASM
#[wasm_bindgen]
pub struct ImageProcessor {
    width: u32,
    height: u32,
    data: Vec<u8>,
}

#[wasm_bindgen]
impl ImageProcessor {
    /// Create a new image processor from RGBA data
    #[wasm_bindgen(constructor)]
    pub fn new(data: &[u8], width: u32, height: u32) -> Result<ImageProcessor, JsValue> {
        if data.len() != (width * height * 4) as usize {
            return Err(JsValue::from_str("Invalid data size for image dimensions"));
        }

        Ok(ImageProcessor {
            width,
            height,
            data: data.to_vec(),
        })
    }

    /// Get image data as bytes
    pub fn get_data(&self) -> Vec<u8> {
        self.data.clone()
    }

    /// Get width
    pub fn width(&self) -> u32 {
        self.width
    }

    /// Get height
    pub fn height(&self) -> u32 {
        self.height
    }

    /// Apply grayscale filter
    pub fn grayscale(&mut self) -> Result<(), JsValue> {
        grayscale(&mut self.data);
        Ok(())
    }

    /// Apply blur filter with radius
    pub fn blur(&mut self, radius: f32) -> Result<(), JsValue> {
        if radius <= 0.0 || radius > 50.0 {
            return Err(JsValue::from_str("Radius must be between 0 and 50"));
        }
        blur(&mut self.data, self.width, self.height, radius);
        Ok(())
    }

    /// Apply sharpen filter
    pub fn sharpen(&mut self, amount: f32) -> Result<(), JsValue> {
        if amount < 0.0 || amount > 5.0 {
            return Err(JsValue::from_str("Amount must be between 0 and 5"));
        }
        sharpen(&mut self.data, self.width, self.height, amount);
        Ok(())
    }

    /// Apply edge detection
    pub fn edge_detect(&mut self) -> Result<(), JsValue> {
        edge_detect(&mut self.data, self.width, self.height);
        Ok(())
    }

    /// Apply sepia tone
    pub fn sepia(&mut self) -> Result<(), JsValue> {
        sepia(&mut self.data);
        Ok(())
    }

    /// Invert colors
    pub fn invert(&mut self) -> Result<(), JsValue> {
        invert(&mut self.data);
        Ok(())
    }

    /// Adjust brightness (-100 to 100)
    pub fn brightness(&mut self, amount: i32) -> Result<(), JsValue> {
        if amount < -100 || amount > 100 {
            return Err(JsValue::from_str("Amount must be between -100 and 100"));
        }
        brightness(&mut self.data, amount);
        Ok(())
    }

    /// Adjust contrast (-100 to 100)
    pub fn contrast(&mut self, amount: i32) -> Result<(), JsValue> {
        if amount < -100 || amount > 100 {
            return Err(JsValue::from_str("Amount must be between -100 and 100"));
        }
        contrast(&mut self.data, amount);
        Ok(())
    }

    /// Flip image horizontally
    pub fn flip_horizontal(&mut self) -> Result<(), JsValue> {
        flip_horizontal(&mut self.data, self.width, self.height);
        Ok(())
    }

    /// Flip image vertically
    pub fn flip_vertical(&mut self) -> Result<(), JsValue> {
        flip_vertical(&mut self.data, self.width, self.height);
        Ok(())
    }

    /// Resize image to new dimensions using nearest neighbor
    pub fn resize(&mut self, new_width: u32, new_height: u32) -> Result<(), JsValue> {
        if new_width == 0 || new_height == 0 {
            return Err(JsValue::from_str("Dimensions must be greater than 0"));
        }

        let new_data = resize(&self.data, self.width, self.height, new_width, new_height);
        self.data = new_data;
        self.width = new_width;
        self.height = new_height;
        Ok(())
    }

    /// Rotate image 90 degrees clockwise
    pub fn rotate_90(&mut self) -> Result<(), JsValue> {
        let new_data = rotate(&self.data, self.width, self.height);
        self.data = new_data;
        let temp = self.width;
        self.width = self.height;
        self.height = temp;
        Ok(())
    }
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
