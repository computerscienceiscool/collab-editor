package client

// Constants for message roles
const (
    RoleUser    = "user"
    RoleSystem  = "system"
    RoleAI      = "assistant"
)

// ChatMsg represents a single message in a conversation
type ChatMsg struct {
    Role    string
    Content string
}

// Results represents the result of a completion
type Results struct {
    Body      string
    Citations []string
}
