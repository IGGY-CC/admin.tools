package server

import (
	"flag"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/websocket"
)

var addr = flag.String("addr", ":16443", "admin.tools server")
var Log *log.Logger
var upgrader = websocket.Upgrader {
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func Init() {
	flag.Parse()
	Log = log.New(os.Stdout, "[SSH] ", log.Ldate|log.Ltime|log.Lshortfile)

	// TODO: SECURITY CHECK AND UPDATE
	upgrader.CheckOrigin = func(_ *http.Request) bool {
		return true
	}

	http.HandleFunc("/", defaultHandleFunc)
	http.HandleFunc("/ws/", webSocketHandlerFunc)

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		Log.Print("ListenAndServe: ", err)
	} 
		
	Log.Println("listening on port 16443")
}

func defaultHandleFunc(w http.ResponseWriter, r *http.Request) {
	// Throw not found for every unsupported request
	if r.URL.Path != "/" || r.Method != "GET" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
}

func setupWebSocket(writer http.ResponseWriter, reader *http.Request) (socket *websocket.Conn, err error) {
	socket, err = upgrader.Upgrade(writer, reader, nil)
	if err != nil {
		Log.Println(err)
		return nil, err
	}
	return socket, err
}

func  webSocketHandlerFunc(writer http.ResponseWriter, reader *http.Request) {
	/**
	 * /ws 							path components
	 * /ws/name 					name for the component
	 * /ws/name/action 				action to be taken
	 * /ws/name/action/JSON{x,y,z} 	where x, y, z... etc are the arguments for the action
	 * /ws/name/action/security 	TODO: Add some security so that others cannot hijack this connection
	**/

	Log.Println("received websocket connection")

	params 		:= strings.Split(reader.URL.Path, "/")
	if len(params) < 5 {
		Log.Println("A minimum of three parameters required: name/sessid, command, action, jsonString[opt]")
		return
	}
	name 		:= params[2]
	command 	:= params[3]
	action 		:= params[4]
	jsonString  := "{}"
	if len(params) > 5 {
		jsonString = params[5]
	}

	socket, err := setupWebSocket(writer, reader)
	if err != nil {
		Log.Printf("Cannot create a web socket")
	}

	switch command {
	case "ssh":
		//admSocket.CreateConnection()
		err := webSocketSSHInit(name, socket, action, jsonString)
		if err != nil {
			Log.Printf("Received error: %v", err)
		}
		break
	case "otp":
		webSocketOTPInit(name, socket, action, jsonString)
	}
}