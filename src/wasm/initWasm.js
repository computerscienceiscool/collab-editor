import init, { export_to_markdown, compress_document, decompress_document } from '../../rust-wasm/pkg/rust_wasm.js';

export async function initWasm() {
  await init();

  // Test the existing function
  const output = export_to_markdown("**Hello world**");
  console.log("WASM Markdown Output:", output);

  // Test compression (NEW - this will prove WASM compression works)
  const testData = "This is a long document that should compress well. ".repeat(100);
  console.log("RUST WASM COMPRESSION TEST:");
  console.log(" Original size:", testData.length, "bytes");
  
  const compressed = compress_document(testData);
  console.log(" WASM compressed size:", compressed.length, "bytes");
  console.log(" WASM compression ratio:", ((testData.length - compressed.length) / testData.length * 100).toFixed(1) + "%");
  
  const decompressed = decompress_document(compressed);
  console.log(" WASM decompression successful:", decompressed === testData);
  c
}
