package ssh

import (
	"github.com/gorilla/websocket"
	"os"
)


type SocketWriter struct {
	socket *websocket.Conn
}

func NewSocketWriter(socket *websocket.Conn) *SocketWriter {
	return &SocketWriter{socket}
}

func (socketWriter *SocketWriter) Write(p []byte) (int, error) {
	socketWriter.socket.WriteMessage(websocket.TextMessage, p)
	_, _ = os.Stdout.Write(p)
	return len(p), nil
}

func (socketWriter *SocketWriter) Close() error {
	socketWriter.socket.Close()
	return nil
}