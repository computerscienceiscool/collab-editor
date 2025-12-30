// Package websocketclient provides a generic WebSocket client for Yjs protocol
package websocketclient

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message represents a message to/from the WebSocket
type Message struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data,omitempty"`
}

// Client handles WebSocket connection and message routing
type Client struct {
	conn      *websocket.Conn
	url       string
	room      string
	mu        sync.Mutex
	connected bool
	
	// Channels for communication
	outgoing chan []byte
	incoming chan []byte
	done     chan struct{}
}

// NewClient creates a new WebSocket client
func NewClient(wsURL, room string) (*Client, error) {
	u, err := url.Parse(wsURL)
	if err != nil {
		return nil, fmt.Errorf("invalid WebSocket URL: %w", err)
	}
	
	// Add room to URL path
	u.Path = "/" + room
	
	return &Client{
		url:      u.String(),
		room:     room,
		outgoing: make(chan []byte, 100),
		incoming: make(chan []byte, 100),
		done:     make(chan struct{}),
	}, nil
}

// Connect establishes WebSocket connection
func (c *Client) Connect() error {
	dialer := websocket.DefaultDialer
	dialer.HandshakeTimeout = 10 * time.Second
	
	conn, _, err := dialer.Dial(c.url, nil)
	if err != nil {
		return fmt.Errorf("failed to connect to %s: %w", c.url, err)
	}
	
	c.mu.Lock()
	c.conn = conn
	c.connected = true
	c.mu.Unlock()
	
	log.Printf("Connected to %s (room: %s)", c.url, c.room)
	
	// Start reader and writer goroutines
	go c.readLoop()
	go c.writeLoop()
	
	return nil
}

// readLoop continuously reads from WebSocket
func (c *Client) readLoop() {
	defer func() {
		c.mu.Lock()
		c.connected = false
		c.mu.Unlock()
		close(c.done)
	}()
	
	for {
		messageType, message, err := c.conn.ReadMessage()
		if err != nil {
			log.Printf("Read error: %v", err)
			return
		}
		
		if messageType == websocket.BinaryMessage {
			// Yjs protocol uses binary messages
			select {
			case c.incoming <- message:
			case <-c.done:
				return
			}
		} else if messageType == websocket.TextMessage {
			// Also handle text messages for debugging
			log.Printf("Received text message: %s", string(message))
			select {
			case c.incoming <- message:
			case <-c.done:
				return
			}
		}
	}
}

// writeLoop continuously writes to WebSocket
func (c *Client) writeLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case message := <-c.outgoing:
			c.mu.Lock()
			if !c.connected {
				c.mu.Unlock()
				return
			}
			
			err := c.conn.WriteMessage(websocket.BinaryMessage, message)
			c.mu.Unlock()
			
			if err != nil {
				log.Printf("Write error: %v", err)
				return
			}
			
		case <-ticker.C:
			// Send ping to keep connection alive
			c.mu.Lock()
			if !c.connected {
				c.mu.Unlock()
				return
			}
			err := c.conn.WriteMessage(websocket.PingMessage, nil)
			c.mu.Unlock()
			
			if err != nil {
				log.Printf("Ping error: %v", err)
				return
			}
			
		case <-c.done:
			return
		}
	}
}

// Send sends a message to the WebSocket
func (c *Client) Send(data []byte) error {
	select {
	case c.outgoing <- data:
		return nil
	case <-c.done:
		return fmt.Errorf("client disconnected")
	default:
		return fmt.Errorf("send buffer full")
	}
}

// Receive receives a message from the WebSocket (blocking)
func (c *Client) Receive() ([]byte, error) {
	select {
	case msg := <-c.incoming:
		return msg, nil
	case <-c.done:
		return nil, fmt.Errorf("client disconnected")
	}
}

// Close closes the WebSocket connection
func (c *Client) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

// IsConnected returns whether the client is connected
func (c *Client) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.connected
}
