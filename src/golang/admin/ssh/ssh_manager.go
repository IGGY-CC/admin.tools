package ssh

import (
	"bytes"
	"errors"
	"io"
	"log"
	"net"
	"os"
	"strconv"

	"github.com/gorilla/websocket"
	"golang.org/x/crypto/ssh"
)

var Log *log.Logger

func init() {
	Log = log.New(os.Stdout, "[SSH] ", log.Ldate|log.Ltime|log.Lshortfile)
}

type Manager struct {
	connections map[string]*ServerConnection
	terminals   map[string]*Terminal
}

func NewManager() (manager *Manager) {
	manager = &Manager{nil, nil}
	manager.connections = make(map[string]*ServerConnection)
	manager.terminals = make(map[string]*Terminal)
	return
}

func (manager *Manager) SetLogger(logWriter *SocketWriter) {
	Log.SetOutput(logWriter)
}

func (manager *Manager) getServerConnection(
	host string, port int, username string, password string,
	challenge []string, challengePasswords []string,
	isReuseConnection bool, privateKey []byte) (serverConnection *ServerConnection) {

	serverConnection = NewServerConnection(host, port)
	key := username + ":" + host + ":" + strconv.Itoa(port)

	if challenge != nil {
		for index, challenge := range challenge {
			serverConnection.CreateKBIAuthMethod(challengePasswords[index], challenge)
		}
	}

	if password != "" {
		serverConnection.CreatePasswordAuthMethod(password)
	}

	if privateKey != nil {
		serverConnection.CreatePrivateKeyAuthMethod(privateKey)
	}

	serverConnection.CreateConfig(username, ssh.InsecureIgnoreHostKey())

	if isReuseConnection {
		existingConnection, ok := manager.connections[key]
		if ok && existingConnection.isEqualIdentifier(serverConnection.id) {
			serverConnection = existingConnection
		} else {
			log.Printf("DID NOT FIND A CONNECTION TO REUSE: %v:%s:%s", ok, serverConnection.id, key)
		}
	}

	err := manager.createConnection(serverConnection, key)
	if err != nil {
		log.Printf("THERE IS AN ERROR CREATING CONNECTION: %v", err)
	}
	return serverConnection
}

func (manager *Manager) createConnection(serverConnection *ServerConnection, key string) (err error){
	if !serverConnection.isConnected {
		// If not yet connected, create a new connection to server
		err := serverConnection.Connect()
		if err != nil {
			return err
		}

		// Maintain a list of connections w.r.to their id
		log.Printf("~~~~~~~ CREATING NEW CONNECTION FOR: %s", key)
		manager.connections[key] = serverConnection
	}
	return err
}

func (manager *Manager) InitSSHConnection(
	id string, host string, port int,
	username string, password string,
	challenge []string, challengePasswords []string,
	isReuseConnection bool, socket *websocket.Conn,
	privateKey []byte) (err error) {

	manager.getServerConnection(host, port, username, password, challenge, challengePasswords, isReuseConnection, privateKey)
	return err
}

func (manager *Manager) createLocalConnection() (localConnection net.Listener, err error) {
	localConnection, err = net.Listen("tcp", "localhost:0")
	if err != nil {
		return nil, err
	}

	return localConnection, err
}

func (manager *Manager) forwardConnections(local net.Conn, remote net.Conn) {
	//defer local.Close()
	closeConnection := make(chan bool)

	// Copy remote data to local
	go func() {
		_, err := io.Copy(local, remote)
		if err != nil {
			log.Println("error while copying data from remote to local:", err)
		}
		closeConnection <- true
	}()

	// Copy local data to remote
	go func() {
		_, err := io.Copy(remote, local)
		if err != nil {
			log.Println("error while copying data from local to remote:", err)
		}
		closeConnection <- true
	}()

	<-closeConnection
	log.Printf("+++++++++++++++ CLOSED LOCAL CONNECTION! ++++++++++++++++++++++++++++")
}

func (manager *Manager) CheckActiveServerConnection(hostKey string) bool {
	_, ok := manager.connections[hostKey]
	if !ok {
		return false
	}
	return true
}
func (manager *Manager) UpdateRouteKey(routeKey string, hostKey string) {
	serverConnection, ok := manager.connections[routeKey]
	if !ok {
		log.Printf("Cannot find a server connection for route key")
		return
	}
	manager.connections[hostKey] = serverConnection
}

func (manager *Manager) TunnelConnection(
	id string, host string, port int,
	username string, password string,
	challenge []string, challengePasswords []string,
	isReuseConnection bool, socket *websocket.Conn,
	parentKey string,
	privateKeyPath string) (key string, err error) {

	var parentConnection *ServerConnection = nil

	if parentKey == "" {
		return "", errors.New("parent key is mandatory for a tunnel connection")
	}

	Log.Printf("Getting connection to parent server %s", parentKey)
	parentConnection = manager.connections[parentKey]

	Log.Printf("Creating a Local connection")
	localConnection, err := manager.createLocalConnection()
	if err != nil {
		return "", err
	}

	localPort := localConnection.Addr().(*net.TCPAddr).Port

	// Open a remote connection
	Log.Printf("Creating connection to remote server %s:%d %T %v", host, port, parentConnection, parentConnection.isConnected)
	remoteConnection, err := parentConnection.connection.Dial("tcp", net.JoinHostPort(host, strconv.Itoa(port)))
	if err != nil {
		return "", err
	}

	go func() {
		for {
			local, err := localConnection.Accept()
			if err != nil {
				Log.Print("Couldn't initiate a connection on Localhost")
			}
			manager.forwardConnections(local, remoteConnection)
		}
	}()

	log.Printf("GETTING PRIVATE KEY FROM THE PARENT SERVER")

	var privateKey []byte

	if privateKeyPath != "" {
		var stdout bytes.Buffer
		var stderr bytes.Buffer

		err = manager.executeCommand(parentKey, "cat "+ privateKeyPath, &stdout, &stderr)
		if err != nil {
			log.Printf("COULDN'T GET PRIVATE KEY: %v", err)
		}
		log.Printf("FOUND PRIVATE KEY %s", string(stdout.Bytes()))
		if &stdout != nil {
			privateKey = stdout.Bytes()
		}
	}
	log.Printf("INITIATING SSH CONNECTION to LOCALHOST AT PORT %v", localPort)
	key = username + ":localhost:" + strconv.Itoa(localPort)
	return key, manager.InitSSHConnection(id, "localhost", localPort, username, password, challenge, challengePasswords, isReuseConnection, socket, privateKey)
}

func (manager *Manager) CreateTerminalSession(id string, key string, socket *websocket.Conn, rows int, cols int) error {
	connection, ok := manager.connections[key]
	if !ok {
		Log.Printf("Couldn't create a Terminal Session for requested key: %s", key)
		return errors.New("Couldn't create a Terminal Session for requested key: " + key)
	}

	// Setup a terminal client
	terminalClient, err := manager.createTerminalClient(id, socket)
	if err != nil {
		return err
	}

	Log.Printf("Created a terminal client successfully!")

	// Create a main terminal session
	terminal, err := manager.createTerminal(id, connection, rows, cols)
	if err != nil {
		return err
	}

	// Maintain a list of terminals w.r.to their id
	Log.Printf("Saving terminal in terminals at %s", id)
	manager.terminals[id] = terminal

	Log.Printf("Created a new terminal session successfully!")

	// add terminal client to terminal
	terminal.addTerminalClient(terminalClient)

	Log.Printf("Attached terminal client to new terminal session successfully!")

	return err
}

func (manager *Manager) executeCommand(key string, command string, stdout *bytes.Buffer, stderr *bytes.Buffer) error {
	connection, ok := manager.connections[key]
	if !ok {
		str := "Couldn't create a Terminal Session for requested key: " + key
		Log.Printf(str)
		return errors.New(str)
	}

	log.Printf("EXECUTING COMMAND WITH CONNECTION %v", connection)
	err := connection.ExecuteCommand(command, stdout, stderr)
	if err != nil {
		log.Printf("THERE IS AN ERROR EXECUTING LOCAL COMMAND: %v", err)
	}

	log.Printf("COMMAND RETURNED DATA %s, %s", string(stdout.Bytes()), string(stderr.Bytes()))
	return err
}

func (manager *Manager) ExecuteCommand(key string, command string, socket *websocket.Conn) error {
	connection, ok := manager.connections[key]
	if !ok {
		str := "Couldn't create a Terminal Session for requested key: " + key
		Log.Printf(str)
		return errors.New(str)
	}
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	err := connection.ExecuteCommand(command, &stdout, &stderr)

	w, err := socket.NextWriter(websocket.TextMessage)
	if err != nil {
		return err
	}

	_, _ = w.Write(stdout.Bytes())
	//errorBytes := append([]byte("\u001b[31m"), stderr.Bytes()...)
	//_, _ = w.Write(append(errorBytes, []byte("\u001b[0m")...))
	Log.Printf("RECEIVED FROM STDERR: %s", string(stderr.Bytes()))

	if err := w.Close(); err != nil {
		Log.Printf("Error cloising socket next writer in Stdout")
		return err
	}

	socket.Close()
	return err
}

func (manager *Manager) createTerminal(id string, connection *ServerConnection, rows int, cols int) (*Terminal, error) {
	return NewTerminal(id, connection, rows, cols)
}

func (manager *Manager) createTerminalClient(id string, socket *websocket.Conn) (*TerminalClient, error) {
	return NewTerminalClient(id, socket)
}

func (manager *Manager) ShareSession(id string, source string, socket *websocket.Conn) {
	Log.Printf("TERMINAL WITH GIVEN SOURCE %s %v AND CHECKALLOWED FOR %s", source, manager.terminals[source], id)
	if terminal, ok := manager.terminals[source]; ok && terminal.checkAllowed(id) {
		terminalClient, err := manager.createTerminalClient(id, socket)
		if err != nil {
			Log.Printf("Cannot connect to a shared session as a terminal client couldn't be instantiated")
		}
		terminal.addTerminalClient(terminalClient)
		Log.Printf("Attached a shared session successfully!")
	} else {
		Log.Printf("Couldn't activate share session")
	}
}

func (manager *Manager) AllowShared(sourceID string, destinationID string, isWrite bool) error {
	if terminal, ok := manager.terminals[sourceID]; ok {
		terminal.allowTerminal(destinationID, isWrite)
		Log.Printf("Allowed %s from %s in write mode? %t", sourceID, destinationID, isWrite)
	} else {
		return errors.New("SourceID " + sourceID + " doesn't exist. Length of terminals: " + strconv.Itoa(len(manager.terminals)))
	}
	return nil
}

func (manager *Manager) Resize(id string, rows int, cols int) (err error) {
	if terminal, ok := manager.terminals[id]; ok {
		err = terminal.Resize(rows, cols)
		return err
	} else {
		return errors.New("Couldn't find a session with id: " + id)
	}
}
