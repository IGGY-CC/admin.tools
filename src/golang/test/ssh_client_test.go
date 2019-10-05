package test

import (
	adminSSH "../admin/ssh"
	"bytes"
	"io"
	"log"
	"os"
	"testing"

	"golang.org/x/crypto/ssh"
)

var Log *log.Logger

type args struct {
	host string
	port int
}

var tests = []struct {
	name    string
	user    string
	pass	string
	args    args
	wantErr bool
}{
	{
		"Jumpbox",
		"admin",
		"12345678",
		args{"localhost", 9038},
		false,
	},
	//{
	//	"PXE",
	//	"root",
	//  "12345678",
	//	args{"localhost",9022},
	//	false,
	//},
}
func init() {
	Log = log.New(os.Stdout, "[SSH] ", log.Ldate|log.Ltime|log.Lshortfile)
}
func TestClient_Connect(t *testing.T) {
	for _, tt := range tests {
		tt := tt // https://gist.github.com/posener/92a55c4cd441fc5e5e85f27bca008721
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			client := new(adminSSH.ServerConnection)

			authMethods := client.GenerateAuthMethod(client.CreateKBIAuthMethod(tt.pass, "Verification code: "), client.CreatePasswordAuthMethod(tt.pass))
			client.CreateConfig(tt.user, authMethods, ssh.InsecureIgnoreHostKey())

			var err error
			if err = client.Connect(tt.args.host, tt.args.port); (err != nil) != tt.wantErr {
				Log.Fatalf("Connect() error = %v, wantErr %v", err, tt.wantErr)
			}
			session, err := client.CreateTerminalSession("main")
			stdin, err := session.StdinPipe()
			if err != nil {
				Log.Fatalf("Unable to setup stdin for session: %v", err)
			}
			go io.Copy(stdin, os.Stdin)

			stdout, err := session.StdoutPipe()
			if err != nil {
				Log.Fatalf("Unable to setup stdout for session: %v", err)
			}
			go io.Copy(os.Stdout, stdout)

			stderr, err := session.StderrPipe()
			if err != nil {
				Log.Fatalf("Unable to setup stderr for session: %v", err)
			}
			go io.Copy(os.Stderr, stderr)
			session.Shell()

			var stdoutBuf1 bytes.Buffer
			var stderrBuf1 bytes.Buffer
			err = client.CreateCommandSession("cat /tmp/test", &stdoutBuf1, &stderrBuf1)
			Log.Println("RECEIVED RESPONSE FROM COMMAND", "cat /tmp/test", stdoutBuf1, stderrBuf1)

			var stdoutBuf = make(chan *bytes.Buffer)
			var stderrBuf = make(chan *bytes.Buffer)
			go func(error) {
				err = client.CreateCommandSessionChannel("free -m", stdoutBuf, stderrBuf)
			}(err)

			var stdoutBuf2 = make(chan *bytes.Buffer)
			var stderrBuf2 = make(chan *bytes.Buffer)
			go func(error) {
				err = client.CreateCommandSessionChannel("cat /etc/resolv.conf", stdoutBuf2, stderrBuf2)
			}(err)

			select {
			case sout := <-stdoutBuf:
				Log.Println("RECEIVED FROM SOUT: ", sout)
				close(stdoutBuf)
			case serr := <-stderrBuf:
				Log.Println("RECEIVED FROM SERR: ", serr)
				close(stderrBuf)
			}



			select {
			case sout := <-stdoutBuf2:
				Log.Println("RECEIVED FROM SOUT: ", sout)
				close(stdoutBuf2)
			case serr := <-stderrBuf2:
				Log.Println("RECEIVED FROM SERR: ", serr)
				close(stderrBuf2)
			}

			//session.Wait()
		})
	}
}
