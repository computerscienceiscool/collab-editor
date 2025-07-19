
use wasm_bindgen::prelude::*;
use flate2::Compression;
use flate2::write::{GzEncoder, GzDecoder};
use std::io::prelude::*;


#[wasm_bindgen]
pub fn export_to_markdown(raw: &str) -> String {
    raw.to_string()
}

// Compress the document
#[wasm_bindgen]
pub fn compress_document(data: &str) -> Vec<u8> {
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(data.as_bytes()).unwrap();
    encoder.finish().unwrap()
}

// Decompress the document
#[wasm_bindgen]
pub fn decompress_document(compressed_data: &[u8]) -> String {
    let mut decoder = GzDecoder::new(Vec::new());
    decoder.write_all(compressed_data).unwrap();
    let decompressed = decoder.finish().unwrap();
    String::from_utf8(decompressed).unwrap_or_else(|_| String::new())
}
