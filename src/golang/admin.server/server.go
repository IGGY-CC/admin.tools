package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"strconv"
	"strings"
	// "fmt"

	"github.com/gorilla/websocket"
)

var addr = flag.String("addr", ":16443", "admin.tools server")

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1,
	WriteBufferSize: 1,
}

func main() { 
	log.Println("program started...")
	flag.Parse()
	upgrader.CheckOrigin = func(_ *http.Request) bool {
		return true
	}

	http.HandleFunc("/", defaultHandleFunc)
	http.HandleFunc("/ws/", webSocketHandlerFunc)

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	} 
		
	log.Println("listening on port 16443")
}

func defaultHandleFunc(w http.ResponseWriter, r *http.Request) {
	// Throw not found for every unsupported request
	if r.URL.Path != "/" || r.Method != "GET" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
}

func webSocketHandlerFunc(w http.ResponseWriter, r *http.Request) {
	/**
	 * /ws 							path components
	 * /ws/name 					name for the component
	 * /ws/name/action 				action to be taken
	 * /ws/name/action/JSON{x,y,z} 	where x, y, z... etc are the arguments for the action
	 * /ws/name/action/security 	TODO: Add some security so that others cannot hijack this connection
	**/
	log.Println("received websocket connection")
	params := strings.Split(r.URL.Path, "/")
	if len(params) < 5 {
		log.Println("Required values are missing")
		return
	}
	name := params[2]
	action := params[3]

	_, ok := sockets[name]
	if !ok {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}
		sockets[name] = &AdmSocket{name: name, conn: conn, read: make(chan []byte), write: make(chan []byte), writeErr: make(chan []byte)}
		// defer conn.Close();
 	} else {
 		log.Println("Connection already exists, trying to use one: ", sockets[name])
	}

	switch action {

	case "ssh":
		var connObject SSHConnObject
		err := json.Unmarshal([]byte(params[4]), &connObject)
		if err != nil {
			return
		}

		log.Println("Connecting to ", connObject.Host, connObject.Port, connObject.User, connObject.Pass)
		ssh := new(SSHConnection)
		ssh.createSSHObject(&connObject)

		sock := sockets[name]
		go ssh.connect(sock)
		go sock.readInit()
		go sock.writeInit()
		break
	case "resize":
		cols, _ := strconv.Atoi(params[4])
		rows, _ := strconv.Atoi(params[5])
		log.Println("Window resized to: ", cols, rows)
		err := sockets[name].ssh.sessionPty.WindowChange(cols, rows)
		if err != nil {
			log.Println(err)
		}
		break
	case "sshrun":
		sockets[name].ssh.run()
	}
}
