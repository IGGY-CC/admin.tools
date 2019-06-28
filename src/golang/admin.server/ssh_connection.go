package main

import (
	"fmt"
	"log"
	"io"
	"bytes"

	"golang.org/x/crypto/ssh"
)

type SSHConnObject struct {
	Host 	string
	Port 	int
	user 	string
	pass 	string
	rows 	int
	cols 	int
	commPty bool
	admPty 	bool
	Config *ssh.ClientConfig
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

func (sc *SSHConnection) createSSHObject(o *SSHConnObject) {
	
	sc.connObject = o;

	answers := keyboardInteractive(map[string]string{
		"Verification code: ": o.pass,
	})

	o.Config = &ssh.ClientConfig{
		User: o.user,
		Auth: []ssh.AuthMethod{
			ssh.KeyboardInteractive(answers.Challenge),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
}

func (sc *SSHConnection) connect(ws *AdmSocket) {
	
	ws.ssh = sc

	// Connect to host
	connection, err := ssh.Dial("tcp", fmt.Sprintf("%s:%d", sc.connObject.Host, sc.connObject.Port), sc.connObject.Config)
	sc.connection = connection

	if err != nil {
		fmt.Printf("Failed to connect to the requested server: %s\n", err)
	}
	defer connection.Close()
 
	// Create a communication sesssion
	sessionPty, err := sc.connection.NewSession()
	sc.sessionPty = sessionPty

	if err != nil {
		fmt.Printf("Failed to create session for pty: %s\n", err)
	}
	defer func() {
		fmt.Println("Closing session")
		sessionPty.Close()	
	}()

	// Create an admin sesssion
	sessionAdm, err := sc.connection.NewSession()
	sc.sessionAdm = sessionAdm
	if err != nil {
		fmt.Printf("Failed to create an admin session: %s\n", err)
	}
	defer func() {
		fmt.Println("Closing session")
		sessionAdm.Close()	
	}()

	modes := ssh.TerminalModes{
		ssh.ECHO:          0,     
		ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}

	if err := sessionPty.RequestPty("xterm", sc.connObject.rows, sc.connObject.cols, modes); err != nil {
		sessionPty.Close()
		fmt.Printf("request for pseudo terminal failed: %s\n", err)
	}

	stdin, err := sessionPty.StdinPipe()
	if err != nil {
		fmt.Printf("Unable to setup stdin for session: %v\n", err)
	}
	go func() {
		for {
			select {
			case message, ok := <- ws.read:
				if !ok {
					log.Println(ok);
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
		buf := make([]byte, sc.connObject.rows*sc.connObject.cols)
		// buf := make([]byte, 20*sc.connObject.cols)
		for {
			n, _ := stdout.Read(buf)
			if n > 0 {
				ws.write <- buf[0:n]
			}
		}
	}()
	
	stderr, err := sessionPty.StderrPipe()
	if err != nil {
		fmt.Printf("Unable to setup stderr for session: %v\n", err)
	}
	go func() { 
		buf := make([]byte, sc.connObject.rows*sc.connObject.cols)
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
 
	// for {
	// 	select {
	// 		case message, ok := <- ws.read:
	// 			_, err = fmt.Fprintf(cmd.Stdin, "%s", message)
	// 			if err != nil {
	// 				log.Fatal(err)
	// 			}
	// 	}
	// }
	
 
	// Wait for sess to finish
	err = sessionPty.Wait()
	if err != nil {
		log.Fatal(err)
	}
 
	// Uncomment to store in variable
	//fmt.Println(b.String())
}

func (sc *SSHConnection) run() {
	session, _ := sc.connection.NewSession()
    defer session.Close()

    var stdoutBuf bytes.Buffer
    session.Stdout = &stdoutBuf
    session.Run("free -m")

    fmt.Printf("free -m -> %s", stdoutBuf.String())
}