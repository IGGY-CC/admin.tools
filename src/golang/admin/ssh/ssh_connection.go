package ssh

import (
	"../lib"
	"net/url"

	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"

	"golang.org/x/crypto/ssh"
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

type ConnResources struct {
	connection 	*ssh.Client
	sessionPty 	*ssh.Session
	sessionAdm 	*ssh.Session
	connParams 	*ConnectionParams
	socket   	*lib.AdmSocket
}

//type keyboardInteractive map[string]string

//var modes = ssh.TerminalModes{
//	ssh.ECHO:          1,
//	ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
//	ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
//}

func (cr *ConnResources) Resize(cols int, rows int) (err error) {
	return cr.sessionPty.WindowChange(rows, cols)
}

func (cr *ConnResources) UnmarshalParams(jsonString string) {
	var connObject ConnectionParams
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

	cr.connParams = &connObject
}

func (cr *ConnResources) createAuthMethod() [] ssh.AuthMethod {
	answers := keyboardInteractive(map[string]string{
		"Verification code: ": cr.connParams.Pass,
	})

	return []ssh.AuthMethod{
		ssh.KeyboardInteractive(answers.Challenge),
		ssh.Password(cr.connParams.Pass),
	}
}

func (cr *ConnResources) Setup(jsonString string, socket *lib.AdmSocket) {
	cr.UnmarshalParams(jsonString)
	cr.socket = socket

	cr.connParams.Config = &ssh.ClientConfig{
		User:            cr.connParams.User,
		Auth:            cr.createAuthMethod(),
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
}

func (cr *ConnResources) Connect(deferCallback func(connection *ssh.Client, session *ssh.Session)) (err error) {

	// Connect to host
	connection, err := ssh.Dial("tcp", fmt.Sprintf("%s:%d", cr.connParams.Host, cr.connParams.Port), cr.connParams.Config)
	cr.connection = connection

	if err != nil {
		errMsg := fmt.Sprintf("Failed to connect to the requested server: %s. Closing connection!\n", err)
		fmt.Println(errMsg)
		return err
	}
	defer func() {
		msg := fmt.Sprintf(">>> Closing SSH connection: %s:%d", cr.connParams.Host, cr.connParams.Port)
		fmt.Println(msg)
		deferCallback(connection, nil)
	}()

	log.Print("Connected to server successfully! creating an admin session!")
	cr.createAdminSession()

	log.Print("Admin session created successfully! creating a terminal session!")
	err = cr.createTerminalSession(deferCallback)
	if err != nil {
		return
	}

	log.Print("Terminal session created successfully! returning...")
	return nil
}

func (cr *ConnResources) createTerminalSession(deferCallback func(connection *ssh.Client, session *ssh.Session)) (err error) {
	// Create a communication session
	sessionPty, err := cr.connection.NewSession()
	cr.sessionPty = sessionPty

	log.Print("Created a communication session for terminal session successfully! Attempting to attach PTY")
	if err != nil {
		fmt.Printf("Failed to create session for pty: %s\n", err)
		return
	}
	defer func() {
		msg := fmt.Sprintf(">>> Closing SSH PTY session: %s:%d", cr.connParams.Host, cr.connParams.Port)
		fmt.Println(msg)
		// ws.write <- []byte(msg)
		deferCallback(nil, sessionPty)
	}()

	cr.attachPTY()
	cr.attachStdin()
	cr.attachStdout()
	cr.attachStderr()

	// Start remote shell
	err = sessionPty.Shell()
	if err != nil {
		log.Fatal(err)
		return
	}

	log.Print("Created a session PTY successfully! putting it on wait...")

	// Wait for sess to finish
	err = sessionPty.Wait()
	if err != nil {
		log.Fatal(err)
		return
	}

	log.Print("Session PTY wait returned...")
	return nil
}

func (cr *ConnResources) attachPTY() {
	err := cr.sessionPty.RequestPty("xterm-256color", cr.connParams.Rows, cr.connParams.Cols, modes)

	if err != nil {
		cr.sessionPty.Close()
		fmt.Printf("request for pseudo terminal failed: %s\n", err)
	}

	fmt.Println("Created session pty - xterm - with size: ", cr.connParams.Rows, cr.connParams.Cols)
}

func (cr *ConnResources) attachStdin() {
	stdin, err := cr.sessionPty.StdinPipe()
	if err != nil {
		fmt.Printf("Unable to setup stdin for session: %v\n", err)
	}

	cr.socket.Read(func(message []byte) {
		_, _ = io.Copy(stdin, bytes.NewReader(message))
	})
}

func (cr *ConnResources) attachStdout() {
	stdout, err := cr.sessionPty.StdoutPipe()
	if err != nil {
		fmt.Printf("Unable to setup stdout for session: %v\n", err)
	}

	cr.socket.Write(cr.connParams.Rows, cr.connParams.Cols, func(message []byte) (n int, err error) {
		n, err = stdout.Read(message)
		return
	})
}

func (cr *ConnResources) attachStderr() {
	stderr, err := cr.sessionPty.StderrPipe()
	if err != nil {
		fmt.Printf("Unable to setup stderr for session: %v\n", err)
	}

	cr.socket.WriteErr(cr.connParams.Rows, cr.connParams.Cols, func(message []byte) (n int, err error) {
		n, err = stderr.Read(message)
		return
	})
}

func (cr *ConnResources) createAdminSession() {
	// Create an admin session
	sessionAdm, err := cr.connection.NewSession()
	cr.sessionAdm = sessionAdm

	if err != nil {
		fmt.Printf("Failed to create an admin session: %s\n", err)
	}
	defer func() {
		msg := fmt.Sprintf(">>> Closing SSH Admin session: %s:%d", cr.connParams.Host, cr.connParams.Port)
		fmt.Println(msg)
		sessionAdm.Close()
	}()

	cr.Run("free -m")
}

func (cr *ConnResources) Run(command string) []byte {
	session, err := cr.connection.NewSession()
	if err != nil {
		log.Println("Could not create a new session!")
	}
	defer func() {
		log.Println("CLOSING COMMAND SESSION")
		session.Close()
	}()

	var stdoutBuf bytes.Buffer
	var stderrBuf bytes.Buffer
	session.Stdout = &stdoutBuf
	session.Stderr = &stderrBuf
	session.Run(command)

	fmt.Printf("free -m -> %s - %s\r\n", stdoutBuf.String(), stderrBuf.String())

	log.Println("COMMAND: ", command)
	log.Println("RESPONSE: ", stdoutBuf)
	return stdoutBuf.Bytes()
}

//func (ki keyboardInteractive) Challenge(user string, instruction string, questions []string, echos []bool) ([]string, error) {
//	var answers []string
//	for _, q := range questions {
//		answers = append(answers, ki[q])
//	}
//	return answers, nil
//}
