package ssh

import (
	"bytes"
	"crypto/md5"
	"io"
	"log"
	"net"
	"reflect"
	"strconv"

	"golang.org/x/crypto/ssh"
)

type authConstants int
const (
	PASSWORD authConstants = 1 << iota
	KEYBOARD_INTERACTIVE
	PUBLIC_KEY
)

type keyboardInteractive map[string]string

func (cr keyboardInteractive) Challenge(user string, instruction string, questions []string, echos []bool) ([]string, error) {
	var answers []string
	for _, q := range questions {
		answers = append(answers, cr[q])
	}
	return answers, nil
}

type ServerConnection struct {
	id 			map[string]string
	isConnected bool
	host       	string
	port       	int
	auth        []ssh.AuthMethod
	config     	*ssh.ClientConfig
	connection 	*ssh.Client
	sessions	map[string]*ssh.Session
}

func NewServerConnection(host string, port int) *ServerConnection {
	serverConnection := &ServerConnection{}
	serverConnection.id = make(map[string]string)
	serverConnection.sessions = make(map[string]*ssh.Session)
	serverConnection.host = host
	serverConnection.port = port
	serverConnection.addToIdentifier("HOST:KEY", host + strconv.Itoa(port))
	return serverConnection
}

func (serverConnection *ServerConnection) addToIdentifier(key string, value string) {
	hash := md5.New()
	_, _ = io.WriteString(hash, key + ":" + value)
	serverConnection.id[key] = string(hash.Sum(nil))
}

func (serverConnection *ServerConnection) isEqualIdentifier(id map[string]string) bool {
	//Log.Printf("Comparing %v, %v", serverConnection.id, id)
	return reflect.DeepEqual(id, serverConnection.id)
}

func (serverConnection *ServerConnection) CreateConfig(username string, hostKeyCallback ssh.HostKeyCallback) {
	// Create SSH Config
	serverConnection.config = &ssh.ClientConfig{
		User: username,
		Auth: serverConnection.auth,

		// This callback function validates the server.
		HostKeyCallback: func(hostname string, remote net.Addr, key ssh.PublicKey) error {
			log.Printf("HOSTKEYCALLBACK: hostname")
			log.Printf("hostname: %s", hostname)
			log.Printf("remote: %v, port %d, IP %s, Zone %s", remote, remote.(*net.TCPAddr).Port, remote.(*net.TCPAddr).IP, remote.(*net.TCPAddr).Zone)
			log.Printf("key: %v", key)
			// Return nil because we want the connection to move forward
			return nil
		},
		BannerCallback: func(message string) error {
			log.Printf("BANNER: %s", message)
			return nil
		},
	}
	serverConnection.addToIdentifier("USER", username)
}

func (serverConnection *ServerConnection) CreateKBIAuthMethod(password string, catchPhrase string) {
	Log.Printf("Using password verification: %s, %s", catchPhrase, password)
	answers := keyboardInteractive(map[string]string{
		catchPhrase: password,
	})

	serverConnection.addToIdentifier("KBI", catchPhrase + ":" + password)
	serverConnection.auth = append(serverConnection.auth, ssh.KeyboardInteractive(answers.Challenge))

}

func (serverConnection *ServerConnection) CreatePasswordAuthMethod(password string) {
	serverConnection.addToIdentifier("PASS", password)
	serverConnection.auth = append(serverConnection.auth, ssh.Password(password))
}

func (serverConnection *ServerConnection) CreatePrivateKeyAuthMethod(keyData []byte) {
	signer, err := ssh.ParsePrivateKey(keyData)
	if err != nil {
		log.Printf("COULDN'T PARSE GIVEN BYTES INTO PRIVATE KEY: %v", err)
	}
	serverConnection.addToIdentifier("KEY", string(keyData)[10:20])
	serverConnection.auth = append(serverConnection.auth, ssh.PublicKeys(signer))
}

func (serverConnection ServerConnection) Close() {
	serverConnection.connection.Close()
	serverConnection.isConnected = false
}

func (serverConnection *ServerConnection) Connect() (err error) {
	Log.Printf("Connecting to server %s on port %d with Config %v:%v:%v", serverConnection.host, serverConnection.port, serverConnection.config.User, serverConnection.config.Auth, serverConnection.config.HostKeyCallback)

	// Connect to host
	serverConnection.connection, err = ssh.Dial("tcp", net.JoinHostPort(serverConnection.host, strconv.Itoa(serverConnection.port)), serverConnection.config)

	if err != nil {
		Log.Printf("Failed to connect to the requested server: %s. Closing connection!\n", err)
		return err
	}

	serverConnection.isConnected = true
	serverConnection.auth = nil
	Log.Printf("Connected to server %s on port %d successfully", serverConnection.host, serverConnection.port)
	return
}

func (serverConnection *ServerConnection) CreateTerminalSession(name string, rows int, cols int, closeCallback func(name string)) (session *ssh.Session, err error) {
	// Create a communication session
	session, err = serverConnection.connection.NewSession()
	if err != nil {
		Log.Printf("Failed to create session for pty: %s\n", err)
		return
	}

	// TODO: Session.Wait throws "session not started" and this defer gets executed immediately
	//defer func() {
	//	Log.Println("Closing terminal session for id: ", name)
	//	session.Close()
	//	delete(serverConnection.sessions, name)
	//
	//	// trigger the callback
	//	closeCallback(name)
	//}()

	Log.Println("Created a communication session for terminal session successfully!")

	serverConnection.sessions[name] = session

	// If a closeCallback is passed, then it is expected that, session.Wait is handled
	// right here. If not passed, then it is expected that, session.Wait or a similar
	// functionality is handled by the caller
	if closeCallback != nil {
		Log.Println("Calling on session.wait...")
		err = session.Wait()
		if err != nil {
			defer func() {
				//return session, err
			}()
			Log.Printf("Session wait threw error: %v", err)
		}
	}

	return session, err
}

func (serverConnection *ServerConnection) ExecuteCommand(command string, stdout *bytes.Buffer, stderr *bytes.Buffer) (err error) {
	// Create a communication session
	sessionPty, err := serverConnection.connection.NewSession()
	if err != nil {
		Log.Printf("Failed to create session for pty: %s\n", err)
		return
	}

	defer func() {
		sessionPty.Close()
		//Log.Println("Command session with command: ", command, "closed")
	}()

	//sessionPty.Shell()
	sessionPty.Stdout = stdout
	sessionPty.Stderr = stderr

	err = sessionPty.Run(command)
	if err != nil {
		//Log.Printf("Received err, %v", err)
	}
	return err
}

func (serverConnection *ServerConnection) ExecuteChannelCommand(command string, stdout chan<- *bytes.Buffer, stderr chan<- *bytes.Buffer) (err error) {
	var sout bytes.Buffer
	var serr bytes.Buffer

	err = serverConnection.ExecuteCommand(command, &sout, &serr)
	if err != nil {
		return
	}

	stdout <-&sout
	stderr <-&serr

	return
}