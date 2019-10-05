package ssh

import (
	"errors"
	"log"
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
	terminals map[string]*Terminal
}

func NewManager() *Manager {
	return &Manager{nil, nil}
}

func (manager *Manager) InitSSHConnection(
									id string, host string, port int,
									username string, password string,
									challenge []string, challengePasswords []string,
									rows int, cols int, isReuseConnection bool,
									socket *websocket.Conn) (err error) {

	serverConnection := NewServerConnection(host, port)

	if challenge != nil {
		for index, challenge := range challenge {
			serverConnection.CreateKBIAuthMethod(challengePasswords[index], challenge)
		}
	}

	if password != "" {
		serverConnection.CreatePasswordAuthMethod(password)
	}

	serverConnection.CreateConfig(username, ssh.InsecureIgnoreHostKey())

	if isReuseConnection {
		existingConnection, ok := manager.connections[username+":"+host+":"+strconv.Itoa(port)]
		if ok && existingConnection.isEqualIdentifier(serverConnection.id) {
			serverConnection = existingConnection
		}
	}

	err = manager.setupServerConnections(id, serverConnection, socket, rows, cols)

	return err
}

func (manager *Manager) setupServerConnections(id string, connection *ServerConnection, socket *websocket.Conn, rows int, cols int) error {
	if !connection.isConnected {
		// If not yet connected, create a new connection to server
		err := connection.Connect()
		if err != nil {
			return err
		}
	}

	// Maintain a list of connections w.r.to their id
	manager.connections[id] = connection

	// Create a main terminal session
	terminal, err := manager.createTerminal(id, connection, rows, cols)
	if err != nil {
		return err
	}

	// Maintain a list of terminals w.r.to their id
	manager.terminals[id] = terminal

	// Setup a terminal client
	terminalClient, err := manager.createTerminalClient(id, socket)
	if err != nil {
		return err
	}

	// add terminal client to terminal
	terminal.addTerminalClient(terminalClient)

	return err
}

func (manager *Manager) createTerminal(id string, connection *ServerConnection, rows int, cols int) (*Terminal, error) {
	return NewTerminal(id, connection, rows, cols)
}

func (manager *Manager) createTerminalClient(id string, socket *websocket.Conn) (*TerminalClient, error) {
	return NewTerminalClient(id, socket)
}

func (manager *Manager) ShareSession(id string) (terminal *Terminal){
	if terminal, ok := manager.terminals[id]; ok && terminal.checkAllowed(id) {
		return terminal
	}
	return nil
}

func (manager *Manager) AllowShared(sourceID string, destinationID string, isWrite bool) error {
	if terminal, ok := manager.terminals[sourceID]; ok {
		terminal.allowTerminal(destinationID, isWrite)
	}
	return errors.New("SourceID " + sourceID + " doesn't exist")
}
