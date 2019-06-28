package main

import (
	"flag"
	"log"
	"net/http"
	"strings"
	"strconv"
	// "fmt"

	"github.com/gorilla/websocket"
)

var addr = flag.String("addr", ":16443", "admin.tools server")
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1,
	WriteBufferSize: 1                         ,
}

func main() { 
	
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
	 * /ws 						path components
	 * /ws/name 				name for the component
	 * /ws/name/action 			action to be taken
	 * /ws/name/action/x/y/z 	where x, y, z... etc are the arguments for the action
	 * /ws/name/action/security TODO: Add some security so that others cannot hijack this connection
	**/
	log.Println("received websocket connection")
	params := strings.Split(r.URL.Path, "/");
	if len(params) < 3 {
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
 	}

	switch(action) {
	case "ssh":
		if len(params) < 9 {
			log.Println("Required values are missing for ssh")
			return
		}
		port, err := strconv.Atoi(params[5])
		cols, err := strconv.Atoi(params[8])
		rows, err := strconv.Atoi(params[9])
		
		if err != nil {
			log.Println(err)
			return
		}
		connObject := SSHConnObject {
			Host: params[4],
			Port: port,
			user: params[6],
			pass: params[7],
			rows: rows - 1,
			cols: cols - 1,
			commPty: true,
			admPty: true,
		}

		ssh := new(SSHConnection)
		ssh.createSSHObject(&connObject)

		sock := sockets[name]
		go ssh.connect(sock)
		// go sshInit(ws)
		go sock.readInit()
		go sock.writeInit()
		break
	case "sshrun":
		sockets[name].ssh.run()
	}
}
