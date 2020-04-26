package server

import (
	_otp "../otp"
	_ssh "../ssh"
	"strconv"
	"strings"

	"encoding/json"
	"net/url"

	"github.com/gorilla/websocket"
	//"golang.org/x/crypto/ssh"
)

type ConnectionParams []struct {
	Host               string
	Port               int
	User               string
	Pass               string
	Challenges         []string
	ChallengePasswords []string
	Rows               int
	Cols               int
	Commands           []string
	Key                string
}

var sshManager = _ssh.NewManager()

// TODO: for now its a simple placeholder. Make it a full-fledged method to
// read key data as byte array taken from the client
func keyToByteArray(key string) []byte {
	if key != "" {
		return []byte(key)
	} else {
		return nil
	}
}

func generatePasswordFromOTP(challenges []string) (password string, err error) {
	if len(challenges) > 0 {
		challenge := challenges[0]
		strs := strings.Split(challenge, "@")
		if len(strs) == 2 {
			var otpManager = _otp.New()
			password, err = otpManager.GenerateCodeFromName(strs[1])
			if err != nil {
				Log.Printf("Couldn't fetch the OTP for server %s: %v", strs[1], err)
				password = strs[0]
			}
		} else {
			password = strs[0]
		}
	}

	return password, err
}

func createSSHConnection(name string, params ConnectionParams, socket *websocket.Conn) (err error) {
	challenges := params[0].ChallengePasswords
	password, _ := generatePasswordFromOTP(challenges)

	err = sshManager.InitSSHConnection(
		name,
		params[0].Host,
		params[0].Port,
		params[0].User,
		params[0].Pass,
		params[0].Challenges,
		[]string{password},
		true,
		socket,
		keyToByteArray(params[0].Key),
	)

	return err
}

func createConnection(params ConnectionParams, key string, name string, socket *websocket.Conn) (err error) {
	if ! sshManager.CheckActiveServerConnection(key) {
		err = createSSHConnection(name, params, socket)
		if err != nil {
			Log.Printf("Error creating connection!")
			socket.Close()
			return err
		}
	}
	return err
}

func createTerminalSession(name string, key string, socket *websocket.Conn, rows int, cols int) (err error) {
	err = sshManager.CreateTerminalSession(name, key, socket, rows, cols)
	if err != nil {
		Log.Printf("Cannot create a terminal session!")
		socket.Close()
		return err
	}
	return
}

func ExecuteCommandsOnParent(command string, key string) (data string, err error) {
	data, err = sshManager.ExecuteCommand(key, command, nil)
	return
}


func webSocketSSHInit(name string, socket *websocket.Conn, action string, jsonString string) (err error) {
	Log.Print("Executing given action: ", action)
	switch action {
	case "init":
		Log.Print("In init... creating ServerConnection")
		var params ConnectionParams
		deconstruct(&params, jsonString)
		key := params[0].User + ":" + params[0].Host + ":" + strconv.Itoa(params[0].Port)
		err = createConnection(params, key, name, socket)
		if err != nil {
			return err
		}

		return createTerminalSession(name, key, socket, params[0].Rows, params[0].Cols)
	case "route":
		Log.Print("In init... creating ServerConnection using route")
		var params ConnectionParams
		deconstruct(&params, jsonString)
		hostKey := params[1].User + ":" + params[1].Host + ":" + strconv.Itoa(params[1].Port)
		parentKey := params[0].User + ":" + params[0].Host + ":" + strconv.Itoa(params[0].Port)
		if !sshManager.CheckActiveServerConnection(hostKey) {
			err = createConnection(params, parentKey, name, socket)
			if err != nil {
				Log.Printf("Error creating connection to Parent server!")
				socket.Close()
				return err
			}
			// If there exists a command to be executed, then the command needs to be executed on parent
			// before making the connection attempt
			if params[1].Commands != nil {
				_, err := ExecuteCommandsOnParent(params[1].Commands[0], parentKey)
				if err != nil {
					Log.Println("Error executing command on parent terminal: ", err)
				}
			}

			challenges := params[1].ChallengePasswords
			password, _ := generatePasswordFromOTP(challenges)

			// TODO: THIS IS INSECURE WAY OF GETTING HOLD OF A SERVER USING KEY. A CALL TO InitSSHConnection should send in
			// an identifier (if all the connection params are correct, only that identifier shall be used to connect further
			serverKey, err := sshManager.TunnelConnection(
				name,
				params[1].Host,
				params[1].Port,
				params[1].User,
				password,
				params[1].Challenges,
				[]string{password},
				true,
				socket,
				parentKey,
				params[1].Key,
			)

			// TODO: THIS IS INSECURE WAY OF GETTING HOLD OF A SERVER USING KEY. A CALL TO InitSSHConnection should send in
			// an identifier (if all the connection params are correct, only that identifier shall be used to connect further
			err = createTerminalSession(name, serverKey, socket, params[1].Rows, params[1].Cols)
			if err != nil {
				Log.Printf("Cannot create a terminal session for routed server!")
				socket.Close()
			}
			sshManager.UpdateRouteKey(serverKey, hostKey)
		} else {
			err = createTerminalSession(name, hostKey, socket, params[1].Rows, params[1].Cols)
			if err != nil {
				Log.Printf("Cannot create a terminal session for already existing routed server!")
				socket.Close()
			}
		}
		break
	case "allow-share-session":
		type session struct {
			ID    string
			Write bool
		}
		var sess session
		deconstruct(&sess, jsonString)
		err = sshManager.AllowShared(name, sess.ID, sess.Write)
		if err != nil {
			Log.Printf("Couldn't allow shared connection to %s from %s. Thrown Error %v", sess.ID, name, err)
		}
		Log.Printf("Allowed shared connection to #{sess.ID} from #{name}")
	case "share-session":
		type session struct {
			ID string
		}
		var sess session
		deconstruct(&sess, jsonString)
		sshManager.ShareSession(sess.ID, name, socket)
	case "sub-command-init":
	case "exec":
		var params ConnectionParams
		deconstruct(&params, jsonString)

		var key string
		if len(params) == 2 {
			key = params[1].User + ":" + params[1].Host + ":" + strconv.Itoa(params[1].Port)
			_, err = sshManager.ExecuteCommand(key, params[1].Commands[0], socket)
		} else {
			key = params[0].User + ":" + params[0].Host + ":" + strconv.Itoa(params[0].Port)
			_, err = sshManager.ExecuteCommand(key, params[0].Commands[0], socket)
		}

		if err != nil {
			Log.Printf("Received err %v while executing command %s for: %s", err, params[0].Commands, name)
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
	default:
		Log.Println("Unhandled command/action: ", action)
	}

	return
}

func deconstruct(object interface{}, jsonString string) {
	//Log.Printf("JSON STRING: %s", jsonString)
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
