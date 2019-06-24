package main

import (
	"fmt"
	"golang.org/x/crypto/ssh"
	"log"
	"os"
	// Uncomment to store output in variable
	//"bytes"
)
 
func main() {
 
	username := ""
	password := ""
	hostname := ""
	port := ""
 
	// SSH client config
	config := &amp;ssh.ClientConfig{
		User: username,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		// Non-production only
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
 
	// Connect to host
	client, err := ssh.Dial("tcp", hostname+":"+port, config)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()
 
	// Create sesssion
	sess, err := client.NewSession()
	if err != nil {
		log.Fatal("Failed to create session: ", err)
	}
	defer sess.Close()
 
	// StdinPipe for commands
	stdin, err := sess.StdinPipe()
	if err != nil {
		log.Fatal(err)
	}
 
	// Uncomment to store output in variable
	//var b bytes.Buffer
	//sess.Stdout = &amp;b
	//sess.Stderr = &amp;b
 
	// Enable system stdout
	// Comment these if you uncomment to store in variable
	sess.Stdout = os.Stdout
	sess.Stderr = os.Stderr
 
	// Start remote shell
	err = sess.Shell()
	if err != nil {
		log.Fatal(err)
	}
 
	// send the commands
	commands := []string{
		"pwd",
		"whoami",
		"echo 'bye'",
		"exit",
	}
	for _, cmd := range commands {
		_, err = fmt.Fprintf(stdin, "%s\n", cmd)
		if err != nil {
			log.Fatal(err)
		}
	}
 
	// Wait for sess to finish
	err = sess.Wait()
	if err != nil {
		log.Fatal(err)
	}
 
	// Uncomment to store in variable
	//fmt.Println(b.String())
 
}