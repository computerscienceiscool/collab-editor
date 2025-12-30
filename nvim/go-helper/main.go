// go-helper bridges stdin/stdout JSON messages to WebSocket
package main

import (
	"bufio"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	websocketclient "github.com/computerscienceiscool/collab-editor/websocket-client"
)

// JSONMessage represents messages exchanged via stdin/stdout
type JSONMessage struct {
	Type string `json:"type"`
	Data string `json:"data,omitempty"` // Base64 encoded binary data
}

// Config holds connection parameters
type Config struct {
	WSUrl string `json:"ws_url"`
	Room  string `json:"room"`
}

func main() {
	// Command-line flags
	wsURL := flag.String("ws-url", "ws://localhost:1234", "WebSocket server URL")
	room := flag.String("room", "", "Room ID to join")
	flag.Parse()

	if *room == "" {
		log.Fatal("--room is required")
	}

	// Create WebSocket client
	client, err := websocketclient.NewClient(*wsURL, *room)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	// Connect to WebSocket
	if err := client.Connect(); err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer client.Close()

	// Send connection success to Neovim
	sendToNeovim(JSONMessage{
		Type: "connected",
		Data: base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`{"room":"%s"}`, *room))),
	})

	// Send a test message to prove we're connected
	time.Sleep(500 * time.Millisecond) // Wait briefly to ensure Neovim is ready
	testMsg := []byte("NEOVIM_CONNECTED")
	if err := client.Send(testMsg); err != nil {
		log.Printf("Failed to send test message: %v", err)
	}

	// Start goroutines for bidirectional communication
	done := make(chan struct{})

	// WebSocket -> Neovim (stdout)
	go func() {
		for {
			msg, err := client.Receive()
			if err != nil {
				log.Printf("Receive error: %v", err)
				close(done)
				return
			}

			// Forward WebSocket message to Neovim via stdout
			// Encode binary data as base64
			sendToNeovim(JSONMessage{
				Type: "ws_message",
				Data: base64.StdEncoding.EncodeToString(msg),
			})
		}
	}()

	// Neovim (stdin) -> WebSocket
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		select {
		case <-done:
			return
		default:
		}

		line := scanner.Bytes()
		var msg JSONMessage
		if err := json.Unmarshal(line, &msg); err != nil {
			log.Printf("Invalid JSON from Neovim: %v", err)
			continue
		}

		switch msg.Type {
		case "send":
			// Decode base64 data and send to WebSocket
			data, err := base64.StdEncoding.DecodeString(msg.Data)
			if err != nil {
				log.Printf("Failed to decode base64 data: %v", err)
				continue
			}

			if err := client.Send(data); err != nil {
				log.Printf("Send error: %v", err)
			}

		case "ping":
			// Respond to ping
			sendToNeovim(JSONMessage{Type: "pong"})

		case "close":
			// Close connection
			return

		default:
			log.Printf("Unknown message type from Neovim: %s", msg.Type)
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("Scanner error: %v", err)
	}
}

// sendToNeovim sends a JSON message to Neovim via stdout
func sendToNeovim(msg JSONMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return
	}

	fmt.Println(string(data))
}
