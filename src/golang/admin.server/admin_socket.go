package main

import (
	"log"

	"github.com/gorilla/websocket"
)

var sockets map[string]*AdmSocket = make(map[string]*AdmSocket)

type AdmSocket struct {
	name 		string
	conn 		*websocket.Conn
	read 		chan []byte
	write 		chan []byte
	writeErr 	chan []byte
	ssh 		*SSHConnection
}

func (as *AdmSocket) readInit() {
	defer func() {
		as.conn.Close()
	}()
	for {
		_, message, err := as.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		// fmt.Printf("Received message: %c\n", message)
		as.read <- message
	}
}

func (as *AdmSocket) writeInit() {
	defer func() {
		as.conn.Close()
	}()
	for {
		select {
		case message, ok := <- as.write:
			if !ok {
				// The hub closed the channel.
				as.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := as.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			// fmt.Printf("Received message writeInit: %c\n", message)
			w.Write(message)
			if err := w.Close(); err != nil {
				return
			}
		}
	}
}
