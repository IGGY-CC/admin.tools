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
}

func NewTerminal(id string, server *ServerConnection, rows int, cols int) (terminal *Terminal, err error) {
	terminal = &Terminal{}
	terminal.id = id
	terminal.server = server
	terminal.publisher = NewPublisher(id)
	terminal.rows = rows
	terminal.cols = cols
	err = terminal.setupTerminal()
	return
}

func (terminal *Terminal) setupTerminal() (err error) {
	terminal.session, err = terminal.server.CreateTerminalSession(terminal.id, terminal.rows, terminal.cols, terminal.close)
	terminal.attachPTY()

	// attach SSH server's stdin, stdout and stderr
	_, err = terminal.attachStdin()
	_, err = terminal.attachStdout()
	_, err = terminal.attachStderr()

	// Setup Stdout and Stderr for consumers
	terminal.setupServerToChannel()
	terminal.setupServerErrToChannel()

	return
}

func (terminal *Terminal) checkAllowed(id string) bool {
	if _, ok := terminal.allow[id]; ok {
		return true
	}
	return false
}

func (terminal *Terminal) allowTerminal(id string, isWrite bool) {
	terminal.allow[id] = struct{}{}
	if isWrite {
		terminal.allowWrites[id] = struct{}{}
	}
}

func (terminal *Terminal) addTerminalClient(terminalClient *TerminalClient) {
	terminal.addConsumer(terminalClient.consumer)
}

func (terminal *Terminal) addConsumer(consumer *Consumer) {
	if _, ok := terminal.allow[consumer.id]; ok {
		terminal.publisher.AddConsumer(consumer)
		terminal.setupChannelToServer(consumer)
	}
}

func (terminal *Terminal) attachPTY() {
	err := terminal.session.RequestPty("xterm-256color", terminal.rows, terminal.cols, modes)

	if err != nil {
		Log.Fatalf("request for pseudo terminal failed: %v\n", err)
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
}

func (terminal *Terminal) writeToServer(message []byte) (err error) {
	_, err = io.Copy(terminal.stdin, bytes.NewReader(message))
	return
}

func (terminal *Terminal) readFromServer(message []byte) (n int, err error) {
	n, err = terminal.stdout.Read(message)
	return
}

func (terminal *Terminal) readErrFromServer(message []byte) (n int, err error) {
	n, err = terminal.stderr.Read(message)
	return
}

func (terminal *Terminal) setupChannelToServer(consumer *Consumer) {
	if _, ok := terminal.allowWrites[consumer.id]; ok {
		go func(consumer *Consumer) {
			select {
			case _message := <-consumer.Stdin:
				var buf *bytes.Buffer
				buf = _message
				err := terminal.writeToServer(buf.Bytes())
				if err != nil {
					Log.Fatalf("Error while writing buffer to server")
				}
			}
		}(consumer)
	}
}

func (terminal *Terminal) setupServerToChannel() {
	go func() {
		buf := make([]byte, terminal.rows * terminal.cols)
		for {
			n, _ := terminal.readFromServer(buf)
			if n > 0 {
				buffer := bytes.NewBuffer(buf[:n])
				for _, consumer := range terminal.publisher.consumers {
					if _, ok := terminal.allow[consumer.id]; ok {
						go func(buffer *bytes.Buffer) {
							consumer.Stdout <- buffer
						}(buffer)
					}
				}
			}
		}
	}()
}

func (terminal *Terminal) setupServerErrToChannel() {
	go func() {
		buf := make([]byte, terminal.rows * terminal.cols)
		for {
			n, _ := terminal.readErrFromServer(buf)
			if n > 0 {
				buffer := bytes.NewBuffer(buf[:n])
				for _, consumer := range terminal.publisher.consumers {
					if _, ok := terminal.allow[consumer.id]; ok {
						go func(buffer *bytes.Buffer) {
							consumer.Stderr <- buffer
						}(buffer)
					}
				}
			}
		}
	}()
}