
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn export_to_markdown(raw: &str) -> String {
    raw.to_string()
}
