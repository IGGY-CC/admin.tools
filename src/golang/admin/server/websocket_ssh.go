package server

import (
	"../lib"
	_ssh "../ssh"
	"net/url"

	"encoding/json"
	"log"
)

type ConnectionParams struct {
	Host     string
	Port     int
	User     string
	Pass     string
	Rows     int
	Cols     int
	CommPty  bool
	AdmPty   bool
	Config   *ssh.ClientConfig
}

func UnmarshalParams(jsonString string) (connObject ConnectionParams) {
	jsonSSHObject, err := url.QueryUnescape(jsonString)
	jsonSSHObject = jsonSSHObject[1 : len(jsonSSHObject)-1]

	if err != nil {
		log.Fatal("ERROR decoding jsonString", jsonString, err)
		return
	}

	err = json.Unmarshal([]byte(jsonSSHObject), &connObject)
	if err != nil {
		log.Fatal("ERROR Unmarshalling JSON", jsonSSHObject, err)
		return
	}

	log.Print("DECODED OBJECT: ", connObject)

	return
}

var sshManager = _ssh.NewManager()

func webSocketSSHInit(socket *lib.AdmSocket, action string, jsonString string) (createAndClose bool){

	//sshManager := ssh.GetSSHConnectionManager(socket)
	createAndClose = false

	log.Print("Executing given action: ", action)
	switch action {
	case "init":
		log.Print("In init... creating ServerConnection")
		// OLD
		//sshManager.CreateSSHConnection(jsonString)
		params := UnmarshalParams(jsonString)
		sshManager.InitSSHConnection(
			socket.name,
			params.Host,
			params.Port,
			params.User,
			params.Pass,
			[]string{"Verification code: "},
			[]string{params.Pass},
			params.Rows,
			params.Cols,
			true,
			socket.conn
		)
		break
	case "resize":
		type dimensions struct {
			Rows int
			Cols int
		}
		var dim dimensions
		err := json.Unmarshal([]byte(jsonString), &dim)
		if err != nil {
			log.Println("Unable to unmarshall...", err)
			return
		}

		log.Println("Window resized to: ", jsonString, dim, dim.Cols, dim.Rows)
		err = sshManager.Resize(dim.Cols, dim.Rows)
		if err != nil {
			log.Println(err)
		}
		createAndClose = true
		break
	case "sshrun":
		writer, err := socket.GetWriter()
		if err != nil {
			log.Println(err)
		}
		command, err := url.QueryUnescape(jsonString)
		if err != nil { log.Println(err) }
		_, err = writer.Write(sshManager.Run(command))
		if err != nil {
			log.Println(err)
		}
	default:
		log.Println("Unhandled command/action: ", action)
	}

	return
}