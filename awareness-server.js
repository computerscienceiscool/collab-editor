const WebSocket = require('ws');
const port = process.env.AWARENESS_PORT || 1235;

const wss = new WebSocket.Server({ port });

console.log(`Awareness WebSocket server listening on port ${port}`);

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);

  ws.on('message', (message) => {
    // Convert to string if it's a buffer
    const data = message.toString();
  //  console.log(data);
    
    // Broadcast to all other clients
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });
});
