package server

import (
	_ssh "../ssh"
	"strconv"

	"encoding/json"
	"net/url"

	"github.com/gorilla/websocket"
	//"golang.org/x/crypto/ssh"
)

type ConnectionParams struct {
	Host               string
	Port               int
	User               string
	Pass               string
	Challenges         []string
	ChallengePasswords []string
	Rows               int
	Cols               int
}

var sshManager = _ssh.NewManager()

func webSocketSSHInit(name string, socket *websocket.Conn, action string, jsonString string) (err error) {
	Log.Print("Executing given action: ", action)
	switch action {
	case "init":
		Log.Print("In init... creating ServerConnection")
		var params ConnectionParams
		deconstruct(&params, jsonString)
		err = sshManager.InitSSHConnection(
			name,
			params.Host,
			params.Port,
			params.User,
			params.Pass,
			params.Challenges,
			params.ChallengePasswords,
			true,
			socket,
		)
		if err != nil {
			Log.Printf("Error creating connection!")
			socket.Close()
		}
		key := params.User+":"+params.Host+":"+strconv.Itoa(params.Port)
		err := sshManager.CreateTerminalSession(name, key, socket, params.Rows, params.Cols)
		if err != nil {
			Log.Printf("Cannot create a terminal session!")
			socket.Close()
		}
		break
	case "allow-share-session":
		type session struct {
			ID string
			Write bool
		}
		var sess session
		deconstruct(&sess, jsonString)
		err = sshManager.AllowShared(name, sess.ID, sess.Write)
		if err != nil {
			Log.Printf("Couldn't allow shared connection to %s from %s. Thrown Error %v", sess.ID, name, err)
		}
	case "share-session":
		type session struct {
			ID string
		}
		var sess session
		deconstruct(&sess, jsonString)
		sshManager.ShareSession(name, sess.ID, socket)
	case "sub-command-init":
	case "exec":
		type commandMap struct {
			Host               string
			Port               int
			User               string
			Pass               string
			Challenges         []string
			ChallengePasswords []string
			Command            string
		}
		var command commandMap
		deconstruct(&command, jsonString)
		err = sshManager.InitSSHConnection(
			name,
			command.Host,
			command.Port,
			command.User,
			command.Pass,
			command.Challenges,
			command.ChallengePasswords,
			true,
			socket,
		)
		key := command.User+":"+command.Host+":"+strconv.Itoa(command.Port)
		err := sshManager.ExecuteCommand(key, command.Command, socket)
		if err != nil {
			Log.Printf("Received err %v while executing command %s for: %s", err, command.Command, name)
		}
		socket.Close()
	case "resize":
		type dimensions struct {
			Rows int
			Cols int
		}
		var dim dimensions
		deconstruct(&dim, jsonString)

		err = sshManager.Resize(name, dim.Cols, dim.Rows)
		if err != nil {
			Log.Print(err)
		}
		Log.Println("Window resized to: ", jsonString, dim, dim.Cols, dim.Rows)
		break
	//case "sshrun":
	//	writer, err := socket.GetWriter()
	//	if err != nil {
	//		log.Println(err)
	//	}
	//	command, err := url.QueryUnescape(jsonString)
	//	if err != nil { log.Println(err) }
	//	_, err = writer.Write(sshManager.Run(command))
	//	if err != nil {
	//		log.Println(err)
	//	}
	default:
		Log.Println("Unhandled command/action: ", action)
	}

	return
}

func deconstruct(object interface{}, jsonString string) {
	Log.Printf("JSON STRING: %s", jsonString)
	jsonObject, err := url.QueryUnescape(jsonString)
	jsonObject = jsonObject[1 : len(jsonObject)-1]

	if err != nil {
		Log.Printf("ERROR decoding jsonString %s, %v", jsonString, err)
		return
	}

	err = json.Unmarshal([]byte(jsonObject), &object)
	if err != nil {
		Log.Printf("ERROR Unmarshalling JSON %v, %v", jsonObject, err)
		return
	}

	Log.Printf("DECODED OBJECT: %v", object)
}