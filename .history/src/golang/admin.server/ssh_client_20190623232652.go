package main

import (
	"fmt"
	"golang.org/x/crypto/ssh"
	"log"
	"io"
	"bufio"
	// "bytes"
)

type SSHClient struct {
	Config *ssh.ClientConfig
	Host   string
	Port   int
}

type keyboardInteractive map[string]string

func (cr keyboardInteractive) Challenge(user string, instruction string, questions []string, echos []bool) ([]string, error) {
	var answers []string
	for _, q := range questions {
		answers = append(answers, cr[q])
	}
	return answers, nil
}

func read(r io.Reader) []byte {
    byts := make(chan []byte)
    go func() {
        defer close(byts)
        scan := bufio.NewScanner(r)
        for scan.Scan() {
            byts <- scan.Bytes()
        }
    }()
    return <-byts
}

func sshInit(ws *Ws) {
    answers := keyboardInteractive(map[string]string{
		"Verification code: ": "12345678",
	})

	sshConfig := &ssh.ClientConfig{
		User: "admin",
		Auth: []ssh.AuthMethod{
			ssh.KeyboardInteractive(answers.Challenge),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
 
	client := &SSHClient{
		Config: sshConfig,
		Host:   "localhost",
		Port:   9038,
	}

	// Connect to host
	connection, err := ssh.Dial("tcp", fmt.Sprintf("%s:%d", client.Host, client.Port), client.Config)
	if err != nil {
		// return nil, fmt.Errorf("Failed to connect to the requested server: %s", err)
		fmt.Printf("Failed to connect to the requested server: %s\n", err)
	}
	defer connection.Close()
 
	// Create sesssion
	session, err := connection.NewSession()
	if err != nil {
		// return nil, fmt.Errorf("Failed to create session: %s", err)
		fmt.Printf("Failed to create session: %s\n", err)
	}
	defer session.Close()

	stdin, err := session.StdinPipe()
	if err != nil {
		fmt.Printf("Unable to setup stdin for session: %v\n", err)
	}
	go func() {
		for {
			select {
			case message, ok := <- ws.read:
				fmt.Fprintf(stdin, "%s", cmd)
			}
		}
	}()
	
	stdout, err := session.StdoutPipe()
	if err != nil {
		fmt.Printf("Unable to setup stdout for session: %v\n", err)
	}
	go func() { ws.write <- read(stdout) }()
	
	stderr, err := session.StderrPipe()
	if err != nil {
		fmt.Printf("Unable to setup stderr for session: %v\n", err)
	}
	go func() { ws.write <- read(stderr) }()
	
	// Start remote shell
	err = session.Shell()
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
	err = session.Wait()
	if err != nil {
		log.Fatal(err)
	}
 
	// Uncomment to store in variable
	//fmt.Println(b.String())
}