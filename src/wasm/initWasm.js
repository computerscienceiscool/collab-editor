import init, { 
  export_to_markdown, 
  compress_document, 
  decompress_document, 
  format_text,
  toggle_bold,
  toggle_italic,
  toggle_underline,
  toggle_strikethrough,
  toggle_heading,
  toggle_list,
  calculate_document_stats, 
  convert_url_to_markdown   
} from '../../rust-wasm/pkg/rust_wasm.js';


export async function initWasm() {
  await init();

  // Test the existing function
  const output = export_to_markdown("**Hello world**");
  console.log("WASM Markdown Output:", output);

  // Test WASM compression (NEW - this will prove WASM compression works)
  const testData = "This is a long document that should compress well. ".repeat(100);
  console.log("RUST WASM COMPRESSION TEST:");
  console.log(" Original size:", testData.length, "bytes");
  
  const compressed = compress_document(testData);
  console.log(" WASM compressed size:", compressed.length, "bytes");
  console.log(" WASM compression ratio:", ((testData.length - compressed.length) / testData.length * 100).toFixed(1) + "%");
  
  const decompressed = decompress_document(compressed);
  console.log(" WASM decompression successful:", decompressed === testData);
 
  


// Export the format function for use in other modules

// TEMP: expose for console testing
window.toggle_heading = toggle_heading;
window.toggle_list = toggle_list;
window.toggle_bold = toggle_bold;
window.toggle_italic = toggle_italic;
window.toggle_underline = toggle_underline;
window.toggle_strikethrough = toggle_strikethrough;
window.convert_url_to_markdown = convert_url_to_markdown;
}

export {
  format_text,
  toggle_bold,
  toggle_italic,
  toggle_underline,
  toggle_strikethrough,
  toggle_heading,
  toggle_list,
  calculate_document_stats,
  convert_url_to_markdown



};
