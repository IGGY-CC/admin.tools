package ssh

import (
	"bytes"
	"fmt"
	"io"

	"golang.org/x/crypto/ssh"
)

var modes = ssh.TerminalModes {
	ssh.ECHO:          1,
	ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
	ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
}

type Terminal struct {
	id 				string
	server      	*ServerConnection
	publisher		*Publisher
	session			*ssh.Session
	stdin			io.WriteCloser
	stdout			io.Reader
	stderr			io.Reader
	rows            int
	cols            int
	allowWrites		map[string]struct{}
	allow			map[string]struct{}
	consumerRoutines map[*Consumer]struct{}
}

func NewTerminal(id string, server *ServerConnection, rows int, cols int) (terminal *Terminal, err error) {
	terminal = &Terminal{}
	terminal.id = id
	terminal.server = server
	terminal.publisher = NewPublisher(id)
	terminal.rows = rows
	terminal.cols = cols
	terminal.allowWrites = make(map[string]struct{})
	terminal.allow = make(map[string]struct{})
	terminal.consumerRoutines = make(map[*Consumer]struct{})

	/* Allow the consumer with id same as terminal to read and write */
	terminal.allow[id] = struct{}{}
	terminal.allowWrites[id] = struct{}{}

	err = terminal.setupTerminal()
	return
}

func (terminal *Terminal) setupTerminal() (err error) {
	terminal.session, err = terminal.server.CreateTerminalSession(terminal.id, terminal.rows, terminal.cols, terminal.close)
	terminal.attachPTY()

	// attach SSH server's stdin, stdout and stderr
	_, err = terminal.attachStdin()

	if err != nil {
		Log.Printf("Couldn't attach Stdin from session")
	}
	_, err = terminal.attachStdout()

	if err != nil {
		Log.Printf("Couldn't attach Stdout from session")
	}
	_, err = terminal.attachStderr()

	if err != nil {
		Log.Printf("Couldn't attach Stderr from session")
	}

	// Setup Stdout and Stderr for consumers
	go terminal.setupServerToChannel()
	go terminal.setupServerErrToChannel()

	// attach a Shell to this session
	terminal.session.Shell()

	return
}

func (terminal *Terminal) checkAllowed(id string) bool {
	if _, ok := terminal.allow[id]; ok {
		Log.Printf("ID %s is allowed", id)
		return true
	}
	Log.Printf("ID %s is NOT allowed", id)
	return false
}

func (terminal *Terminal) allowTerminal(id string, isWrite bool) {
	terminal.allow[id] = struct{}{}
	if isWrite {
		terminal.allowWrites[id] = struct{}{}
		// if there is a consumer already running that just got the rights of write
		// activate it
		for _, consumer := range terminal.publisher.consumers {
			terminal.setupChannelToServer(consumer)
		}
	} else {
		// check if there is a consumer that already has write permissions which were
		// just removed
		if _, ok := terminal.allowWrites[id]; ok {
			delete(terminal.allowWrites, id)
			consumer, ok := terminal.publisher.consumers[id]
			if ok {
				consumer.stopSendingToServer <- true
			}
		}
	}
}

func (terminal *Terminal) addTerminalClient(terminalClient *TerminalClient) {
	terminal.addConsumer(terminalClient.consumer)
}

func (terminal *Terminal) addConsumer(consumer *Consumer) {
	if _, ok := terminal.allow[consumer.id]; ok {
		Log.Printf("Adding consumer with id: %s, whose terminal ID is %s", consumer.id, terminal.id)
		terminal.publisher.AddConsumer(consumer)
		terminal.setupChannelToServer(consumer)
	} else {
		Log.Printf("Failed adding consumer %s to publisher %s", consumer.id, terminal.id)
	}
}

func (terminal *Terminal) attachPTY() {
	err := terminal.session.RequestPty("xterm-256color", terminal.rows, terminal.cols, modes)

	if err != nil {
		Log.Printf("request for pseudo terminal failed: %v\n", err)
	}
}

func (terminal *Terminal) attachStdin() (stdin io.WriteCloser, err error) {
	terminal.stdin, err = terminal.session.StdinPipe()
	if err != nil {
		Log.Printf("Unable to setup stdin for session: %v\n", err)
	}
	return terminal.stdin, err
}

func (terminal *Terminal) attachStdout() (stdout io.Reader, err error) {
	terminal.stdout, err = terminal.session.StdoutPipe()
	if err != nil {
		fmt.Printf("Unable to setup stdout for session: %v\n", err)
	}
	return terminal.stdout, err
}

func (terminal *Terminal) attachStderr() (stderr io.Reader, err error) {
	terminal.stderr, err = terminal.session.StderrPipe()
	if err != nil {
		fmt.Printf("Unable to setup stderr for session: %v\n", err)
	}
	return terminal.stderr, err
}

func (terminal *Terminal) Resize(rows int, cols int) (err error) {
	terminal.rows = rows
	terminal.cols = cols
	return terminal.session.WindowChange(rows, cols)
}

func (terminal *Terminal) close(name string) {
	// TODO: send close to all consumers and delete everything and free up space
	//
	Log.Println("Close callback called from: " + name)
}

func (terminal *Terminal) writeToServer(message []byte) (err error) {
	//Log.Printf("Writing bytes to server %b", message)
	_, err = io.Copy(terminal.stdin, bytes.NewReader(message))
	return
}

func (terminal *Terminal) readFromServer(message []byte) (n int, err error) {
	n, err = terminal.stdout.Read(message)
	//Log.Printf("Read %d bytes from server: ", n)
	if err != nil {
		Log.Printf("Couldn't read from server: server threw: %v", err)
	}
	return
}

func (terminal *Terminal) readErrFromServer(message []byte) (n int, err error) {
	n, err = terminal.stderr.Read(message)
	if err != nil {
		Log.Printf("Couldn't read from server: server stderr threw: %v", err)
	}
	return
}

func (terminal *Terminal) setupChannelToServer(consumer *Consumer) {
	if _, ok := terminal.allowWrites[consumer.id]; ok {
		Log.Printf("Channel to Server communication initiated for consumer %s", consumer.id)
		if _, ok := terminal.consumerRoutines[consumer]; ok {
			// Return if there is already a go routine running for this consumer
			return
		}
		go func(consumer *Consumer) {
			for {
				select {
					case _message, ok := <-consumer.Stdin:
					if !ok {
						Log.Printf("Closing routine for consumer %s", consumer.id)
						return
					}
					var buf *bytes.Buffer
					buf = _message
					err := terminal.writeToServer(buf.Bytes())
					if err != nil {
						Log.Printf("Error while writing buffer to server")
						return
					}
					case _stop := <-consumer.stopSendingToServer:
						if _stop {
							Log.Printf("Stop signal received! Closing go routine")
							return
						}
				}
			}
		}(consumer)
		terminal.consumerRoutines[consumer] = struct{}{}
	}
}

func (terminal *Terminal) setupServerToChannel() {
	Log.Printf("Server stdout to Channel communication initiated")

	buf := make([]byte, terminal.rows*terminal.cols)
	for {
		n, err := terminal.readFromServer(buf)
		if err != nil {
			Log.Printf("Received error from server while reading: %v", err)
			terminal.closeOnError()
			return
		}
		if n > 0 {
			buffer := bytes.NewBuffer(buf[:n])
			for _, consumer := range terminal.publisher.consumers {
				if _, ok := terminal.allow[consumer.id]; ok {
					go func(buffer *bytes.Buffer, consumer *Consumer) {
						consumer.Stdout <- buffer
					}(buffer, consumer)
				}
			}
		}
	}

}

func (terminal *Terminal) setupServerErrToChannel() {
	Log.Printf("Server stderr to Channel communication initiated %v, %T", terminal, terminal.readFromServer)
	buf := make([]byte, terminal.rows*terminal.cols)
	for {
		n, err := terminal.readErrFromServer(buf)
		if err != nil {
			Log.Printf("Received error from server: %v", err)
			terminal.closeOnError()
			return
		}
		if n > 0 {
			buffer := bytes.NewBuffer(buf[:n])
			for _, consumer := range terminal.publisher.consumers {
				if _, ok := terminal.allow[consumer.id]; ok {
					go func(buffer *bytes.Buffer, consumer *Consumer) {
						consumer.Stderr <- buffer
					}(buffer, consumer)
				}
			}
		}
	}
}

func (terminal *Terminal) closeOnError() {
	for _, consumer := range terminal.publisher.consumers {
		if _, ok := terminal.allow[consumer.id]; ok {
			Log.Printf("CLOSING CONSUMER: %s", consumer.id)
			consumer.socket.Close()
		}
	}
}