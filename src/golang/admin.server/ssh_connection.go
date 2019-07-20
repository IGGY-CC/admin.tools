package main

import (
	"bytes"
	"fmt"
	"io"
	"log"

	"github.com/gorilla/websocket"
	"golang.org/x/crypto/ssh"
)

type SSHConnObject struct {
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

type keyboardInteractive map[string]string

func (cr keyboardInteractive) Challenge(user string, instruction string, questions []string, echos []bool) ([]string, error) {
	var answers []string
	for _, q := range questions {
		answers = append(answers, cr[q])
	}
	return answers, nil
}

type SSHConnection struct {
	connection *ssh.Client
	sessionPty *ssh.Session
	sessionAdm *ssh.Session
	connObject *SSHConnObject
}

func (sc *SSHConnection) createAuthMethod(o *SSHConnObject) [] ssh.AuthMethod {
	answers := keyboardInteractive(map[string]string{
		"Verification code: ": o.Pass,
	})

	return []ssh.AuthMethod{
		ssh.KeyboardInteractive(answers.Challenge),
		ssh.Password(o.Pass),
	}
}

func (sc *SSHConnection) createSSHObject(o *SSHConnObject) {

	sc.connObject = o

	o.Config = &ssh.ClientConfig{
		User:            o.User,
		Auth:            sc.createAuthMethod(o),
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
}

func (sc *SSHConnection) connect(ws *AdmSocket) {

	ws.ssh = sc

	// Connect to host
	connection, err := ssh.Dial("tcp", fmt.Sprintf("%s:%d", sc.connObject.Host, sc.connObject.Port), sc.connObject.Config)
	sc.connection = connection

	if err != nil {
		errMsg := fmt.Sprintf("Failed to connect to the requested server: %s. Closing connection!\n", err)
		fmt.Println(errMsg)
		delete(sockets, ws.name)
		ws.conn.Close()
		return
	}
	defer func() {
		msg := fmt.Sprintf(">>> Closing SSH connection: %s:%d", sc.connObject.Host, sc.connObject.Port)
		fmt.Println(msg)
		w, err := ws.conn.NextWriter(websocket.TextMessage)
		if err == nil {
			w.Write([]byte(msg))
			_ = w.Close()
		}
		fmt.Println("Deleting existing object from sockets: ", ws.name)
		delete(sockets, ws.name)
		connection.Close()
		ws.conn.Close()
	}()

	// Create a communication session
	sessionPty, err := sc.connection.NewSession()
	sc.sessionPty = sessionPty

	if err != nil {
		fmt.Printf("Failed to create session for pty: %s\n", err)
	}
	defer func() {
		msg := fmt.Sprintf(">>> Closing SSH PTY session: %s:%d", sc.connObject.Host, sc.connObject.Port)
		fmt.Println(msg)
		// ws.write <- []byte(msg)
		ws.conn.Close()
		sessionPty.Close()
	}()

	// Create an admin session
	sessionAdm, err := sc.connection.NewSession()
	sc.sessionAdm = sessionAdm
	if err != nil {
		fmt.Printf("Failed to create an admin session: %s\n", err)
	}
	defer func() {
		msg := fmt.Sprintf(">>> Closing SSH Admin session: %s:%d", sc.connObject.Host, sc.connObject.Port)
		fmt.Println(msg)
		sessionAdm.Close()
	}()

	modes := ssh.TerminalModes{
		ssh.ECHO:          1,
		ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}

	if err := sessionPty.RequestPty("xterm-256color", sc.connObject.Rows, sc.connObject.Cols, modes); err != nil {
		sessionPty.Close()
		fmt.Printf("request for pseudo terminal failed: %s\n", err)
	}
	fmt.Println("Created session pty - xterm - with size: ", sc.connObject.Rows, sc.connObject.Cols)

	stdin, err := sessionPty.StdinPipe()
	if err != nil {
		fmt.Printf("Unable to setup stdin for session: %v\n", err)
	}
	go func() {
		for {
			select {
			case message, ok := <-ws.read:
				if !ok {
					log.Println(ok)
				}
				// fmt.Printf("RECVD FROM WS.READ %c\n", message)
				io.Copy(stdin, bytes.NewReader(message))
			}
		}
	}()

	stdout, err := sessionPty.StdoutPipe()
	if err != nil {
		fmt.Printf("Unable to setup stdout for session: %v\n", err)
	}

	go func() {
		// buf := make([]byte, sc.connObject.rows*sc.connObject.cols)
		buf := make([]byte, 8)
		tmpbuf := make([]byte, sc.connObject.Cols)
		tmpbufSize := 0

		for {
			n, _ := stdout.Read(buf)
			for i := 0; i < n; i++ {
				if tmpbufSize >= sc.connObject.Cols {
					ws.write <- tmpbuf[0:tmpbufSize]
					tmpbufSize = 0
				}
				fmt.Printf("%c", buf[i])
				if buf[i] == '\n' {
					tmpbuf[tmpbufSize] = buf[i]
					tmpbufSize++
					ws.write <- tmpbuf[0:tmpbufSize]
					tmpbufSize = 0
				} else {
					tmpbuf[tmpbufSize] = buf[i]
					tmpbufSize++
				}
			}

			if tmpbufSize > 0 {
				ws.write <- tmpbuf[0:tmpbufSize]
				tmpbufSize = 0
			}
		}
	}()

	stderr, err := sessionPty.StderrPipe()
	if err != nil {
		fmt.Printf("Unable to setup stderr for session: %v\n", err)
	}
	go func() {
		buf := make([]byte, sc.connObject.Rows*sc.connObject.Cols)
		// buf := make([]byte, 20*sc.connObject.cols)
		for {
			n, _ := stderr.Read(buf)
			if n > 0 {
				ws.writeErr <- buf[0:n]
			}
		}
	}()

	// Start remote shell
	err = sessionPty.Shell()
	if err != nil {
		log.Fatal(err)
	}

	// Wait for sess to finish
	err = sessionPty.Wait()
	if err != nil {
		log.Fatal(err)
	}
}

func (sc *SSHConnection) run() {
	session, _ := sc.connection.NewSession()
	defer session.Close()

	var stdoutBuf bytes.Buffer
	session.Stdout = &stdoutBuf
	session.Run("free -m")

	fmt.Printf("free -m -> %s", stdoutBuf.String())
}
