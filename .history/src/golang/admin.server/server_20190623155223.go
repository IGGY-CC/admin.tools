package main

import (
	"flag"
	"log"
	"net/http"
	"fmt"

	"github.com/gorilla/websocket"
)

var addr = flag.String("addr", ":16443", "admin.tools server")
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func defaultHandleFunc(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)
	// Throw not found for every unsupported request
	if r.URL.Path != "/" || r.Method != "GET" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
}

type Ws struct {
	conn *websocket.Conn
}

func (ws *Ws) read() {
	for {
		_, message, err := ws.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		log.Println("Read message: ", message)
	}
}

func (ws *Ws) write() {
	for {
		w, err := ws.conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)
	}
}


func main() {
	
	flag.Parse()
	
	http.HandleFunc("/", defaultHandleFunc)
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}

		ws = &Ws{conn: conn}
		go ws.read()
		go ws.write()
		fmt.Fprintf(w, "hello, world")
		fmt.Println(r.Body)
	})
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}