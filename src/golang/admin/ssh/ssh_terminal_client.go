package ssh

import (
	"bytes"
	"log"

	"github.com/gorilla/websocket"
)

type TerminalClient struct {
	id string
	consumer *Consumer
	socket *websocket.Conn
}

func NewTerminalClient(id string, socket *websocket.Conn) (terminalClient *TerminalClient, err error) {
	terminalClient = &TerminalClient{id, nil,socket}
	terminalClient.consumer = NewConsumer(id, socket)
	go terminalClient.setupReadFromClient()
	go terminalClient.setupWritesToClient()

	return
}

func (terminalClient *TerminalClient) setupReadFromClient() {
	defer func() {
		log.Println("closing from read channel...")
		terminalClient.socket.Close()
	}()

	for {
		// Read from websocket and write to server
		_, message, err := terminalClient.socket.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				Log.Printf("error: %v", err)
			}
			break
		}
		terminalClient.consumer.Stdin <- bytes.NewBuffer(message)
	}
}

func (terminalClient *TerminalClient) setupWritesToClient() {
	defer func() {
		Log.Println("closing from write channel...")
		terminalClient.socket.Close()
	}()
	for {
		select {
		// Read from server channel and write to client
		case message, ok := <-terminalClient.consumer.Stdout:
			if !ok {
				terminalClient.socket.WriteMessage(websocket.CloseMessage, []byte{})
				Log.Printf("Reading from server stdout threw 'Not Ok!'")
				return
			}

			w, err := terminalClient.socket.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			// TODO: Should I need buf??? Really!?
			var buf *bytes.Buffer
			buf = message
			_, _ = w.Write(buf.Bytes())

			if err := w.Close(); err != nil {
				Log.Printf("Error cloising socket next writer in Stdout")
				return
			}
		case message, ok := <-terminalClient.consumer.Stderr:
			if !ok {
				terminalClient.socket.WriteMessage(websocket.CloseMessage, []byte{})
				Log.Printf("Reading from server stdout threw 'Not Ok!'")
				return
			}

			w, err := terminalClient.socket.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			// TODO:
			var buf *bytes.Buffer
			buf = message
			_, _ = w.Write(buf.Bytes())

			if err := w.Close(); err != nil {
				Log.Printf("Error closing socket next writer in Stderr")
				return
			}
		}
	}
}