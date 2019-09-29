package server

import (
	"../lib"
	"../ssh"
	"net/url"

	"encoding/json"
	"log"
)

func webSocketSSHInit(socket *lib.AdmSocket, action string, jsonString string) (createAndClose bool){

	sshManager := ssh.GetSSHConnectionManager(socket)
	createAndClose = false

	log.Print("Executing given action: ", action)
	switch action {
	case "init":
		log.Print("In init... creating SSHConnection")
		sshManager.CreateSSHConnection(jsonString)
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