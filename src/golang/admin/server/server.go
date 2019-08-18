package server

import (
	"../lib"

	"flag"
	"log"
	"net/http"
	"strings"
)

var addr = flag.String("addr", ":16443", "admin.tools server")

func Init() {
	flag.Parse()
	lib.Init()
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

func  webSocketHandlerFunc(w http.ResponseWriter, r *http.Request) {
	/**
	 * /ws 							path components
	 * /ws/name 					name for the component
	 * /ws/name/action 				action to be taken
	 * /ws/name/action/JSON{x,y,z} 	where x, y, z... etc are the arguments for the action
	 * /ws/name/action/security 	TODO: Add some security so that others cannot hijack this connection
	**/

	log.Println("received websocket connection")

	params 		:= strings.Split(r.URL.Path, "/")
	if len(params) < 5 {
		log.Println("A minimum of three parameters required: name/sessid, command, action, jsonString[opt]")
		return
	}
	name 		:= params[2]
	command 	:= params[3]
	action 		:= params[4]
	jsonString  := "{}"
	if len(params) > 5 {
		jsonString = params[5]
	}

	admSocket := lib.GetAdminSocket(name, w, r)
	createAndClose := false

	switch command {
	case "ssh":
		admSocket.CreateConnection()
		createAndClose = webSocketSSHInit(admSocket, action, jsonString)
		break
	case "otp":
		createAndClose = webSocketOTPInit(admSocket, action, jsonString)
	}

	if createAndClose {
		admSocket.CreateAndCloseConnection()
	}
}