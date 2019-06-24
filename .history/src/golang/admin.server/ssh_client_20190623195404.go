package main

import (
	"fmt"
	"golang.org/x/crypto/ssh"
	"log"
	"os"
	"io"
	// Uncomment to store output in variable
	// "bytes"
)

type SSHClient struct {
	Config *ssh.ClientConfig
	Host   string
	Port   int
}

type SSHCommand struct {
	Stdin  io.Reader
	Stdout io.Writer
	Stderr io.Writer
}

type keyboardInteractive map[string]string

func (cr keyboardInteractive) Challenge(user string, instruction string, questions []string, echos []bool) ([]string, error) {
	var answers []string
	for _, q := range questions {
		answers = append(answers, cr[q])
	}
	return answers, nil
}

func sshInit(read chan byte[], write chan byte[], writeErr chan byte[]) {
 
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

	cmd := &SSHCommand{
		Stdin:  read,
		Stdout: write,
		Stderr: writeErr,
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

	if cmd.Stdin != nil {
		stdin, err := session.StdinPipe()
		if err != nil {
			fmt.Printf("Unable to setup stdin for session: %v\n", err)
		}
		go io.Copy(stdin, cmd.Stdin)
	}

	if cmd.Stdout != nil {
		stdout, err := session.StdoutPipe()
		if err != nil {
			fmt.Printf("Unable to setup stdout for session: %v\n", err)
		}
		go io.Copy(cmd.Stdout, stdout)
	}

	if cmd.Stderr != nil {
		stderr, err := session.StderrPipe()
		if err != nil {
			fmt.Printf("Unable to setup stderr for session: %v\n", err)
		}
		go io.Copy(cmd.Stderr, stderr)
	}

	// Uncomment to store output in variable
	// var b bytes.Buffer
	// session.Stdout = &b
	// session.Stderr = &b
 
	// Start remote shell
	err = session.Shell()
	if err != nil {
		log.Fatal(err)
	}
 
	for {
		
	}
	
 
	// Wait for sess to finish
	err = session.Wait()
	if err != nil {
		log.Fatal(err)
	}
 
	// Uncomment to store in variable
	//fmt.Println(b.String())
 
}