// File: src/ui/documentStats.js
import { calculate_document_stats } from '../wasm/initWasm.js';

/**
 * Sets up live document statistics that update as user types
 * @param {Y.Text} ytext - The Yjs text field
 * @param {EditorView} view - The CodeMirror editor view
 */
export function setupDocumentStats(ytext, view) {
  const wordCountEl = document.querySelector('#word-count');
  const charCountEl = document.querySelector('#char-count');
  const readingTimeEl = document.querySelector('#reading-time');

  if (!wordCountEl || !charCountEl || !readingTimeEl) {
    console.warn('Document stats elements not found');
    return;
  }

  // Update stats function
  async function updateStats() {
    try {
      const text = ytext.toString();
      const statsJson = await calculate_document_stats(text);
      const stats = JSON.parse(statsJson);
      
      wordCountEl.textContent = `${stats.words} words`;
      charCountEl.textContent = `${stats.chars_without_spaces} chars`;
      readingTimeEl.textContent = `${stats.reading_time} min read`;
      
    } catch (error) {
      console.error('Failed to update document stats:', error);
    }
  }

  // Update stats on document changes
  ytext.observe(updateStats);
  
  // Initial stats calculation
  updateStats();
}
