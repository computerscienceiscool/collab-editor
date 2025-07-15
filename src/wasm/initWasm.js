
// File: src/wasm/initWasm.js
import init, { export_to_markdown } from '../../rust-wasm/pkg/rust_wasm.js';

export async function initWasm() {
  await init();

  // Example use (replace later with real integration)
  const output = export_to_markdown("Hello **world**");
  console.log("WASM Markdown Output:", output);
}
