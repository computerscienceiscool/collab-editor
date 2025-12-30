" File: nvim/plugin/collab-editor.vim
" Auto-load plugin

if exists('g:loaded_collab_editor')
  finish
endif
let g:loaded_collab_editor = 1

" Plugin is loaded via Lua
lua require('collab-editor').setup()
