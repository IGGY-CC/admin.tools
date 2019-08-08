package server

import (
	"../lib"
	"../ssh"

	"encoding/json"
	"log"
)

func webSocketSSHInit(socket *lib.AdmSocket, action string, jsonString string) (createAndClose bool){

	sshManager := ssh.GetSSHConnectionManager(socket)
	createAndClose = false

	switch action {
	case "init":
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
		//sockets[name].ssh.Run()
	}

	return
}