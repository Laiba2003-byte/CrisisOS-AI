const clients = new Set();

export function sseHandler(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const client = {
    id: Date.now(),
    res
  };

  clients.add(client);

  // Send connected handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, timestamp: new Date().toISOString() })}\n\n`);

  req.on("close", () => {
    clients.delete(client);
  });
}

export function broadcastEvent(eventType, payload) {
  if (!clients.size) {
    return;
  }

  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const client of clients) {
    try {
      client.res.write(data);
    } catch {
      clients.delete(client);
    }
  }
}
