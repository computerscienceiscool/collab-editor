module github.com/stevegt/collab-editor/v3/wasm

go 1.21

require (
	github.com/stevegt/collab-editor/v3/client v0.0.0
	github.com/stevegt/collab-editor/v3/openai v0.0.0
)

replace github.com/stevegt/collab-editor/v3/client => ../client
replace github.com/stevegt/collab-editor/v3/openai => ../openai
