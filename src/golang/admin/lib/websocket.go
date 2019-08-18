package lib

import (
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader {
	ReadBufferSize:  1,
	WriteBufferSize: 1,
}

var Sockets map[string]*AdmSocket = make(map[string]*AdmSocket)

type AdmSocket struct {
	name 			string
	conn 			*websocket.Conn
	read 			chan []byte
	write 			chan []byte
	writeErr 		chan []byte
	closeCallbacks 	[]func()
	httpWriter		http.ResponseWriter
	httpReader		*http.Request
}

func Init() {
	upgrader.CheckOrigin = func(_ *http.Request) bool {
		return true
	}
}

func GetAdminSocket(name string, w http.ResponseWriter, r *http.Request) *AdmSocket {
	admSocket, ok := Sockets[name]
	if !ok {
		admSocket = new(AdmSocket)
		admSocket.name = name
		admSocket.read = make(chan []byte)
		admSocket.write = make(chan []byte)
		admSocket.writeErr = make(chan []byte)
		admSocket.closeCallbacks = make([]func(), 0)
		Sockets[name] = admSocket
	} else {
		log.Println("Connection already exists, trying to use one: ", Sockets[name])
	}
	admSocket.httpWriter = w
	admSocket.httpReader = r
	return admSocket
}

func (as *AdmSocket) AddCloseCallback(closeCallback func()) {
	as.closeCallbacks = append(as.closeCallbacks, closeCallback)
}

func (as *AdmSocket) CreateAndCloseConnection() {
	if as.conn != nil {
		conn, err := upgrader.Upgrade(as.httpWriter, as.httpReader, nil)
		if err != nil {
			log.Println("There is an error upgrading connection to websocket connection", err)
			return
		}
		_ = conn.Close()
	}
}

func (as *AdmSocket) CreateConnection() {
	if as.conn == nil {
		log.Println("Request for new websocket connection after checking for old existent connection")
		conn, err := upgrader.Upgrade(as.httpWriter, as.httpReader, nil)
		if err != nil {
			log.Println(err)
			as.DeleteSocket()
			as.Close()
			return
		}

		as.conn = conn
	}
	// defer conn.Close();
}

func (as *AdmSocket) Close() {
	log.Println("closing websocket connection...")
	_ = as.conn.Close()
	as.DeleteSocket()
	for _, value := range as.closeCallbacks {
		value()
	}
}

func (as *AdmSocket) ReadInit() {
	defer func() {
		log.Println("closing from read channel...")
		as.Close()
	}()
	for {
		_, message, err := as.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		fmt.Printf("Received message: %c\n", message)
		as.read <- message
	}
}

func (as *AdmSocket) WriteInit() {
	defer func() {
		log.Println("closing from write channel...")
		as.Close()
	}()
	for {
		select {
		case message, ok := <- as.write:
			if !ok {
				as.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := as.GetWriter()
			if err != nil {
				return
			}

			// fmt.Printf("Received message writeInit: %c\n", message)
			_, _ = w.Write(message)
			if err := w.Close(); err != nil {
				return
			}
		}
	}
}

func (as *AdmSocket) Read(ioCopyCallback func(msg []byte)) {
	go func() {
		for {
			select {
			case message, ok := <-as.read:
				if !ok {
					log.Println(ok)
				}
				// fmt.Printf("RECVD FROM WS.READ %c\n", message)
				ioCopyCallback(message)
			}
		}
	}()
}

func (as *AdmSocket) Write(rows int, cols int, readStdout func(msg []byte) (n int, err error)) {
	go func() {
		buf := make([]byte, cols * rows)
		// buf := make([]byte, 8)
		//tmpBuf := make([]byte, cols)
		//tmpBufSize := 0

		for {
			n, _ := readStdout(buf)
			as.write <- buf[:n]
			//for i := 0; i < n; i++ {
			//	if tmpBufSize >= cols {
			//		as.write <- tmpBuf[0:tmpBufSize]
			//		tmpBufSize = 0
			//	}
			//	// fmt.Printf("%c", buf[i])
			//	if buf[i] == '\n' {
			//		tmpBuf[tmpBufSize] = buf[i]
			//		tmpBufSize++
			//		as.write <- tmpBuf[0:tmpBufSize]
			//		tmpBufSize = 0
			//	} else {
			//		tmpBuf[tmpBufSize] = buf[i]
			//		tmpBufSize++
			//	}
			//}
			//
			//if tmpBufSize > 0 {
			//	as.write <- tmpBuf[0:tmpBufSize]
			//	tmpBufSize = 0
			//}
		}
	}()
}

func (as *AdmSocket) WriteErr(rows int, cols int, readStderr func(msg []byte) (n int, err error)) {
	go func() {
		buf := make([]byte, rows * cols)
		// buf := make([]byte, 20*sc.connParams.cols)
		for {
			n, _ := readStderr(buf)
			as.write <- buf[:n]
			//if n > 0 {
			//	as.writeErr <- buf[0:n]
			//}
		}
	}()
}

func (as *AdmSocket) GetWriter() (io.WriteCloser, error) {
	writer, err := as.conn.NextWriter(websocket.TextMessage)
	return writer, err
}

func (as *AdmSocket) WriteHTTP(data string) {
	if as.conn == nil {
		code, err := io.WriteString(as.httpWriter, data + "\n")
		//as.httpWriter.(http.Flusher).Flush()
		//code, err := fmt.Fprintf(*as.httpWriter, data)
		if err != nil {
			log.Println("Error while writing to http(s) stream", err, code)
		}
	}
}

func (as *AdmSocket) GetName() string {
	return as.name
}

func (as *AdmSocket) DeleteSocket() {
	delete(Sockets, as.name)
}