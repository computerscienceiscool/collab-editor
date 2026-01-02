// File: src/ui/documentStats.js
import { calculate_document_stats } from '../wasm/initWasm.js';

/**
 * Sets up live document statistics that update as user types
 * @param {DocHandle} handle - The Automerge document handle
 * @param {EditorView} view - The CodeMirror editor view
 */
export function setupDocumentStats(handle, view) {
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
      // Get text from view (most up-to-date)
      const text = view.state.doc.toString();
      const statsJson = await calculate_document_stats(text);
      const stats = JSON.parse(statsJson);
      
      wordCountEl.textContent = `${stats.words} words`;
      charCountEl.textContent = `${stats.chars_without_spaces} chars`;
      readingTimeEl.textContent = `${stats.reading_time} min read`;
      
    } catch (error) {
      console.error('Failed to update document stats:', error);
    }
  }

  // Update stats on Automerge document changes
  handle.on('change', updateStats);
  
  // Also update on local edits (more responsive)
  view.dom.addEventListener('input', () => {
    // Debounce to avoid too many updates
    if (window.statsUpdateTimeout) {
      clearTimeout(window.statsUpdateTimeout);
    }
    window.statsUpdateTimeout = setTimeout(updateStats, 500);
  });
  
  // Initial stats calculation
  updateStats();
}
