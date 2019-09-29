package ssh

import (
	"../lib"

	"fmt"
	"golang.org/x/crypto/ssh"
	"log"
)

var Connections map[string]*ConnectionManagerSSH = make(map[string]*ConnectionManagerSSH)

type ConnectionManagerSSH struct {
	name       string
	admSocket  *lib.AdmSocket
	ssh        *ConnResources
	connParams *ConnectionParams
}

func GetSSHConnectionManager(admSocket *lib.AdmSocket) *ConnectionManagerSSH {
	sshConnManager, ok := Connections[admSocket.GetName()]
	if !ok {
		log.Println("Creating new SSH Connection manager...")
		sshConnManager = new(ConnectionManagerSSH)
		sshConnManager.name = admSocket.GetName()
		sshConnManager.admSocket = admSocket
		admSocket.AddCloseCallback(sshConnManager.Close)
		Connections[admSocket.GetName()] = sshConnManager
	}
	return sshConnManager
}

func (sm *ConnectionManagerSSH) Close() {
	log.Println("closing ssh connection manager...")
	delete(Connections, sm.name)
}

func (sm *ConnectionManagerSSH) CreateSSHConnection(jsonString string) {

	sm.ssh = new(ConnResources)
	sm.ssh.Setup(jsonString, sm.admSocket)
	sm.connParams = sm.ssh.connParams

	log.Println("Connecting to ", sm.connParams.Host, sm.connParams.Port, sm.connParams.User, sm.connParams.Pass)
	//err = Connect()
	//if err != nil {
	//	log.Println("Couldn't create an SSH ConnResources")
	//	admSocket.DeleteSocket()
	//	admSocket.Close()
	//}

	go sm.ssh.Connect(sm.Disconnect)
	go sm.admSocket.ReadInit()
	go sm.admSocket.WriteInit()
}

func (sm *ConnectionManagerSSH) Resize(cols int, rows int) (err error) {
	err = sm.ssh.Resize(cols, rows)
	return
}

func (sm *ConnectionManagerSSH) Run(command string) []byte {
	return sm.ssh.Run(command)
}

func (sm *ConnectionManagerSSH) Disconnect(conn *ssh.Client, sess *ssh.Session) {

	msg := fmt.Sprintf(">>> Closing SSH connection: %s:%d", sm.connParams.Host, sm.connParams.Port)
	fmt.Println(msg)

	w, err := sm.admSocket.GetWriter()
	if err == nil {
		_, _ = w.Write([]byte(msg))
		_ = w.Close()
	}

	if conn != nil {
		fmt.Println("Deleting existing object from sockets: ", sm.admSocket.GetName())
		sm.admSocket.DeleteSocket()
		_ = conn.Close()
	}

	if sess != nil {
		sess.Close()
	}

	sm.admSocket.Close()
}