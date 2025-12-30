module github.com/computerscienceiscool/collab-editor/nvim/go-helper

go 1.21

require github.com/computerscienceiscool/collab-editor/websocket-client v0.0.0

require github.com/gorilla/websocket v1.5.3 // indirect

replace github.com/computerscienceiscool/collab-editor/websocket-client => ../../websocket-client
