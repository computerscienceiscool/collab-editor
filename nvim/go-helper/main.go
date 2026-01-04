// go-helper bridges stdin/stdout JSON-RPC messages to your Automerge collab-editor server
// This replaces the Yjs-based version with a simpler protocol
package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/gorilla/websocket"
)

// Message types for communication with Neovim (JSON-RPC style)
type Request struct {
	ID     int             `json:"id,omitempty"`
	Method string          `json:"method"`
	Params json.RawMessage `json:"params,omitempty"`
}

type Response struct {
	ID     int             `json:"id,omitempty"`
	Result json.RawMessage `json:"result,omitempty"`
	Error  *RPCError       `json:"error,omitempty"`
}

type Notification struct {
	Method string          `json:"method"`
	Params json.RawMessage `json:"params"`
}

type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Protocol message types (matching Teamtype-style protocol)
type OpenParams struct {
	URI     string `json:"uri"`
	Content string `json:"content"`
}

type CloseParams struct {
	URI string `json:"uri"`
}

type EditParams struct {
	URI      string `json:"uri"`
	Revision int    `json:"revision"`
	Delta    []Edit `json:"delta"`
}

type CursorParams struct {
	URI    string  `json:"uri"`
	Ranges []Range `json:"ranges"`
}

type Edit struct {
	Range       Range  `json:"range"`
	Replacement string `json:"replacement"`
}

type Range struct {
	Start Position `json:"start"`
	End   Position `json:"end"`
}

type Position struct {
	Line      int `json:"line"`
	Character int `json:"character"`
}

// Server notification types (from server to editor)
type ServerEditParams struct {
	URI      string `json:"uri"`
	Revision int    `json:"revision"`
	Delta    []Edit `json:"delta"`
}

type ServerCursorParams struct {
	UserID string  `json:"userid"`
	Name   string  `json:"name,omitempty"`
	URI    string  `json:"uri"`
	Ranges []Range `json:"ranges"`
}

// Client manages the WebSocket connection
type Client struct {
	conn   *websocket.Conn
	mu     sync.Mutex
	closed bool
}

func main() {
	// Command-line flags
	serverURL := flag.String("server", "", "WebSocket server URL (e.g., ws://localhost:8080/ws)")
	room := flag.String("room", "", "Room/document ID to join")
	flag.Parse()

	if *serverURL == "" {
		log.Fatal("--server is required")
	}
	if *room == "" {
		log.Fatal("--room is required")
	}

	// Build connection URL with room parameter
	u, err := url.Parse(*serverURL)
	if err != nil {
		log.Fatalf("Invalid server URL: %v", err)
	}
	q := u.Query()
	q.Set("room", *room)
	u.RawQuery = q.Encode()

	// Connect to WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		sendError(0, -1, fmt.Sprintf("Failed to connect: %v", err))
		os.Exit(1)
	}

	client := &Client{conn: conn}
	defer client.Close()

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	done := make(chan struct{})

	// Send connection success notification
	sendNotification("connected", map[string]string{"room": *room})

	// WebSocket -> Neovim (stdout)
	go func() {
		defer close(done)
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				if !client.closed {
					sendNotification("disconnected", map[string]string{"reason": err.Error()})
				}
				return
			}

			// Parse server message and forward to Neovim
			var serverMsg map[string]interface{}
			if err := json.Unmarshal(message, &serverMsg); err != nil {
				log.Printf("Failed to parse server message: %v", err)
				continue
			}

			// Forward as notification to Neovim
			if method, ok := serverMsg["method"].(string); ok {
				params, _ := json.Marshal(serverMsg["params"])
				sendNotification(method, json.RawMessage(params))
			} else {
				// Forward raw message as "server_message"
				sendNotification("server_message", json.RawMessage(message))
			}
		}
	}()

	// Neovim (stdin) -> WebSocket
	go func() {
		scanner := bufio.NewScanner(os.Stdin)
		// Increase buffer size for large messages
		scanner.Buffer(make([]byte, 1024*1024), 1024*1024)

		for scanner.Scan() {
			line := scanner.Bytes()
			if len(line) == 0 {
				continue
			}

			var req Request
			if err := json.Unmarshal(line, &req); err != nil {
				log.Printf("Invalid JSON from Neovim: %v", err)
				continue
			}

			// Handle the request
			client.handleRequest(req)
		}

		if err := scanner.Err(); err != nil {
			log.Printf("Scanner error: %v", err)
		}

		// Stdin closed, shutdown
		client.Close()
	}()

	// Wait for shutdown
	select {
	case <-done:
	case <-sigChan:
		client.Close()
	}
}

func (c *Client) handleRequest(req Request) {
	switch req.Method {
	case "open":
		var params OpenParams
		if err := json.Unmarshal(req.Params, &params); err != nil {
			sendError(req.ID, -32602, fmt.Sprintf("Invalid params: %v", err))
			return
		}
		c.sendToServer(req.Method, params)
		sendResult(req.ID, map[string]bool{"success": true})

	case "close":
		var params CloseParams
		if err := json.Unmarshal(req.Params, &params); err != nil {
			sendError(req.ID, -32602, fmt.Sprintf("Invalid params: %v", err))
			return
		}
		c.sendToServer(req.Method, params)
		sendResult(req.ID, map[string]bool{"success": true})

	case "edit":
		var params EditParams
		if err := json.Unmarshal(req.Params, &params); err != nil {
			sendError(req.ID, -32602, fmt.Sprintf("Invalid params: %v", err))
			return
		}
		c.sendToServer(req.Method, params)
		// Edits don't need a response (fire and forget)

	case "cursor":
		var params CursorParams
		if err := json.Unmarshal(req.Params, &params); err != nil {
			sendError(req.ID, -32602, fmt.Sprintf("Invalid params: %v", err))
			return
		}
		c.sendToServer(req.Method, params)
		// Cursor updates don't need a response

	case "ping":
		sendResult(req.ID, map[string]string{"pong": "ok"})

	case "disconnect":
		c.Close()

	default:
		sendError(req.ID, -32601, fmt.Sprintf("Unknown method: %s", req.Method))
	}
}

func (c *Client) sendToServer(method string, params interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.closed {
		return
	}

	msg := map[string]interface{}{
		"method": method,
		"params": params,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return
	}

	if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
		log.Printf("Failed to send message: %v", err)
	}
}

func (c *Client) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.closed {
		return
	}
	c.closed = true

	c.conn.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	c.conn.Close()
}

// Helper functions to send messages to Neovim via stdout

func sendNotification(method string, params interface{}) {
	var paramsJSON json.RawMessage
	if params != nil {
		var err error
		paramsJSON, err = json.Marshal(params)
		if err != nil {
			log.Printf("Failed to marshal params: %v", err)
			return
		}
	}

	msg := Notification{
		Method: method,
		Params: paramsJSON,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal notification: %v", err)
		return
	}

	fmt.Println(string(data))
}

func sendResult(id int, result interface{}) {
	if id == 0 {
		return // No response needed for notifications
	}

	resultJSON, err := json.Marshal(result)
	if err != nil {
		log.Printf("Failed to marshal result: %v", err)
		return
	}

	msg := Response{
		ID:     id,
		Result: resultJSON,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		return
	}

	fmt.Println(string(data))
}

func sendError(id int, code int, message string) {
	msg := Response{
		ID: id,
		Error: &RPCError{
			Code:    code,
			Message: message,
		},
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal error: %v", err)
		return
	}

	fmt.Println(string(data))
}
