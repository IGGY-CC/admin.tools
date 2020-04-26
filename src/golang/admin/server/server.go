package server

import (
	_ssh "../ssh"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"flag"
	"io"
	"io/ioutil"
	"log"
	"net/http"
		"os"
	"strings"
	"time"
	"mime"
	"path/filepath"

	"github.com/duo-labs/webauthn.io/session"
	"github.com/duo-labs/webauthn/webauthn"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

//https://gist.github.com/LivingInSyn/b2634518f654c0e877224bb03e2ed3bb
var addr = flag.String("addr", ":443", "admin.tools server")
//var addr = flag.String("addr", ":16443", "admin.tools server")
var Log *log.Logger
var webAuthn *webauthn.WebAuthn
var userDB *userdb
var sessionStore *session.Store
const ECDSA bool = false
var rootCAs *x509.CertPool
var serverCert tls.Certificate

var upgrader = websocket.Upgrader {
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func Init() {
	flag.Parse()
	Log = log.New(os.Stdout, "[MUSE.AM] ", log.Ldate|log.Ltime|log.Lshortfile)

	//get root ca
	caAddr := "ca.crt"
	rootCAs = configureRootCAs(&caAddr)

	// TODO: SECURITY CHECK AND UPDATE
	upgrader.CheckOrigin = func(_ *http.Request) bool {
		return true
	}

	var err error
	webAuthn, err = webauthn.New(&webauthn.Config{
		RPDisplayName: "MUSE.AM",     // Display Name for your site
		RPID:          "localhost",        // Generally the domain name for your site
		RPOrigin:      "https://localhost", // The origin URL for WebAuthn requests
		//RPIcon: "https://muse.am/logo.png", // Optional icon URL for your site
	})

	if err != nil {
		Log.Fatal("failed to create WebAuthn from config:", err)
	}

	userDB = DB()

	sessionStore, err = session.NewStore()
	if err != nil {
		Log.Fatal("failed to create session store:", err)
	}

	if ECDSA {
		// Generate ECDSA P-256 Key
		Log.Println("Generating an ECDSA P-256 Private Key")
		ECKey := generateECKey()

		// Generate Self-Signed Certificate using ECDSA P-256 Key
		Log.Println("Generating a Self-Signed Certificate from ECDSA P-256 Key")
		generateCert(&ECKey.PublicKey, ECKey, EC_CERTFILE)
	} else {
		// Generate RSA 3072 Key
		Log.Println("Generating an RSA 3072 Private Key")
		RSAKey := generateRSAKey()

		// Generate Self-Signed Certificate using RSA 3072 Key
		Log.Println("Generating a Self-Signed Certificate from RSA 3072 Key")
		generateCert(&RSAKey.PublicKey, RSAKey, RSA_CERTFILE)
	}

	router := mux.NewRouter()
	router.HandleFunc("/register/begin/{username}", BeginRegistration).Methods("GET")
	router.HandleFunc("/register/finish/{username}", FinishRegistration).Methods("POST")
	router.HandleFunc("/login/begin/{username}", BeginLogin).Methods("GET")
	router.HandleFunc("/login/finish/{username}", FinishLogin).Methods("POST")

	// static serve
	// static := http.StripPrefix("/web/scripts/", http.FileServer(http.Dir("./web/scripts/")))
	// router.PathPrefix("/web/scripts/").Handler(static)
	router.HandleFunc("/web/scripts/{filename}", FileServer)

	//r.PathPrefix("/").Handler(http.FileServer(http.Dir("./")))

	//router.HandleFunc("/", defaultHandleFunc).Methods("GET")
	router.HandleFunc("/ws/{name}/{command}/{action}", WebSocketHandlerFunc) //.Methods("GET")
	router.HandleFunc("/ws/{name}/{command}/{action}/", WebSocketHandlerFunc) //.Methods("GET")
	router.HandleFunc("/ws/{name}/{command}/{action}/{jsonString}", WebSocketHandlerFunc) //.Methods("GET")
	//router.HandleFunc("/ws/", WebSocketHandlerFunc) //.Methods("GET")

	tlsConfig := &tls.Config{
		MinVersion:               tls.VersionTLS12,
		CurvePreferences:         []tls.CurveID{tls.CurveP521, tls.CurveP384, tls.CurveP256},
		PreferServerCipherSuites: true,
		CipherSuites: []uint16{
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
			tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_RSA_WITH_AES_256_CBC_SHA,
		},
		//GetCertificate: func(clientInfo *tls.ClientHelloInfo) (*tls.Certificate, error) {
		//		Log.Printf("SUPPORTED CIPHER SUITES: %v", clientInfo.CipherSuites)
		//		Log.Printf("Supported versions: %v", clientInfo.SupportedVersions)
		//		return nil, nil
		//},
		// TODO: CLIENT CERTIFICATE CHECK
		//GetCertificate: func(hi *tls.ClientHelloInfo) (*tls.Certificate, error) {
		//	return &serverCert, nil
		//},
		//ClientAuth: tls.RequireAndVerifyClientCert,
		//ClientCAs: rootCAs,
		//GetConfigForClient: func(hi *tls.ClientHelloInfo) (*tls.Config, error) {
		//	serverConf := &tls.Config{
		//		GetCertificate: func(hi *tls.ClientHelloInfo) (*tls.Certificate, error) {
		//			return &serverCert, nil
		//		},
		//		MinVersion:            tls.VersionTLS12,
		//		ClientAuth:            tls.RequireAndVerifyClientCert,
		//		ClientCAs:             rootCAs,
		//		VerifyPeerCertificate: getClientValidator(hi),
		//		//Certificates: []tls.Certificate{cer},
		//	}
		//	return serverConf, nil
		//},
	}

	tlsServer := &http.Server{
		Addr:         *addr, //":443",
		Handler:      router,
		TLSConfig:    tlsConfig,
		TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler), 0),
	}

	//test_lets_encrypt()
	//err = http.ListenAndServe(*addr, nil)
	//Log.Fatal(http.ListenAndServe(*addr, router))
	//Log.Fatal(http.ListenAndServeTLS(*addr, "https-server.crt", "https-server.key", router);
	if ECDSA {
		Log.Fatal(tlsServer.ListenAndServeTLS(EC_CERTFILE, EC_KEYFILE))
	} else {
		Log.Fatal(tlsServer.ListenAndServeTLS(RSA_CERTFILE, RSA_KEYFILE))
	}
}

func FileServer(w http.ResponseWriter, r *http.Request) {
    Log.Println("FILE SERVER CALLED")
    vars := mux.Vars(r)
    file := "./web/scripts/" + vars["filename"]
    extension := filepath.Ext(file)
    fileMime :=  mime.TypeByExtension(extension)
    // TODO: an issue on windows (https://github.com/golang/go/issues/32350) can result in giving text/plain instead of
    // application/javascript for .js files
    if (extension == ".js") {
        fileMime = "application/javascript"
    }
    Log.Println("Serving file: " + file + " -- " + fileMime)
    w.Header().Set("Content-Type", fileMime)
    http.ServeFile(w, r, file)
}

func IndexHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("hello, world!"))
}

func getClientValidator(helloInfo *tls.ClientHelloInfo) func([][]byte, [][]*x509.Certificate) error {
	return func(rawCerts [][]byte, verifiedChains [][]*x509.Certificate) error {
		//copied from the default options in src/crypto/tls/handshake_server.go, 680 (go 1.11)
		//but added DNSName
		opts := x509.VerifyOptions{
			Roots:         rootCAs,
			CurrentTime:   time.Now(),
			Intermediates: x509.NewCertPool(),
			KeyUsages:     []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
			DNSName:       strings.Split(helloInfo.Conn.RemoteAddr().String(), ":")[0],
		}
		_, err := verifiedChains[0][0].Verify(opts)
		return err
	}
}

func defaultHandleFunc(w http.ResponseWriter, r *http.Request) {
	Log.Print("REQUEST RECEIVED")
	w.Header().Add("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
	w.Header().Add("Content-Type", "application/json")
	_, err := io.WriteString(w, `{"message":"hello, world", "status":"ok"}`)
	//_, err := w.Write([]byte("hello, world!\n"))
	if err != nil {
		Log.Printf("Couldn't write output to server: %s", err)
	}

	// Throw not found for every unsupported request
	if r.URL.Path != "/" || r.Method != "GET" {
	    Log.Println("Arrived at default case")
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
}

func setupWebSocket(writer http.ResponseWriter, reader *http.Request) (socket *websocket.Conn, err error) {
	socket, err = upgrader.Upgrade(writer, reader, nil)
	if err != nil {
		Log.Println(err)
		return nil, err
	}
	return socket, err
}

func  WebSocketHandlerFunc(writer http.ResponseWriter, reader *http.Request) {
	/**
	 * /ws 							path components
	 * /ws/name 					name for the component
	 * /ws/name/action 				action to be taken
	 * /ws/name/action/JSON{x,y,z} 	where x, y, z... etc are the arguments for the action
	 * /ws/name/action/security 	TODO: Add some security so that others cannot hijack this connection
	**/

	//Log.Println("received websocket connection")

	params 		:= strings.Split(reader.URL.Path, "/")
	if len(params) < 5 {
		Log.Println("A minimum of three parameters required: name/sessid, command, action, jsonString[opt]")
		return
	}
	name 		:= params[2]
	command 	:= params[3]
	action 		:= params[4]
	jsonString  := "{}"
	if len(params) > 5 {
		jsonString = params[5]
	}

	switch command {
	case "ssh":
	    socket, err := setupWebSocket(writer, reader)
		if err != nil {
			Log.Printf("Cannot create a web socket")
		}

		err = webSocketSSHInit(name, socket, action, jsonString)
		if err != nil {
			Log.Printf("Received error: %v", err)
		}
		break
	case "otp":
		//_, err := setupWebSocket(writer, reader)
		//if err != nil {
		//	Log.Printf("Cannot create a web socket")
		//}
		webSocketOTPInit(writer, action, jsonString)
	case "system-info":
		// TODO: DANGER HARD CODED CODE -- FOR DEMO PURPOSE ONLY

		var key string
		switch action {
		case "pxe":
			key = "root:localhost:9022"
			break
		case "jumpbox":
			key = "admin:localhost:9038"
			break
		case "kali":
			key = "sanjeev:localhost:9222"
			break
		case "jumpbox2":
			key = "admin:10.1.1.148:22"
			break
		}
		//
		//commands := []string{
		//	"hostnamectl",
		//	"uname -a",
		//	"free | grep Mem | awk '{print $3/$2 * 100.0}'",
		//	"awk '{u=$2+$4; t=$2+$4+$5; if (NR==1){u1=u; t1=t;} else print ($2+$4-u1) * 100 / (t-t1) \"%\"; }' <(grep 'cpu ' /proc/stat) <(sleep 1;grep 'cpu ' /proc/stat)",
		//}

		var serverInfo map[string]string = make(map[string]string)
		var data string

		data, _ = ExecuteCommandsOnParent("hostnamectl | grep -i hostname | awk -F: '{ print $2 }'", key)
		serverInfo["hostname"] = strings.TrimSpace(data)
		data, _ = ExecuteCommandsOnParent("hostnamectl | grep -i chassis | awk -F: '{ print $2 }'", key)
		serverInfo["SERVER"] = strings.ToUpper(strings.TrimSpace(data))
		data, _ = ExecuteCommandsOnParent("hostnamectl | grep -i operating | awk -F: '{ print $2 }'", key)
		serverInfo["DISTRIB"] = strings.TrimSpace(data)
		data, _ = ExecuteCommandsOnParent("hostnamectl | grep -i kernel | awk -F: '{ print $2 }'", key)
		serverInfo["KERNEL"] = strings.TrimSpace(data)
		data, _ = ExecuteCommandsOnParent("hostnamectl | grep -i architecture | awk -F: '{ print $2 }'", key)
		serverInfo["ARCH"] = strings.TrimSpace(data)
		data, _ = ExecuteCommandsOnParent("free -mh | grep Mem | awk '{ print $3 \" / \" $2 }'", key)
		serverInfo["MEM"] = strings.TrimSpace(data)
		data, _ = ExecuteCommandsOnParent(" uptime | awk '{ print $10 \" \" $11 \" \" $12}'", key)
		serverInfo["CPU"] = strings.TrimSpace(data)
		data, _ = ExecuteCommandsOnParent("uptime | awk '{ print $3 \" \" $4 \" \" $5 }' | sed 's/,$//'", key)
		serverInfo["UPTIME"] = strings.TrimSpace(data)
		//data, _ = ExecuteCommandsOnParent("ip route get 1.1.1.1 | grep -oP 'src \\K\\S+'", key)
		data, _ = ExecuteCommandsOnParent("ip route get 1.1.1.1 | grep src | awk '{ print $7 }'", key)
		serverInfo["IP"] = strings.TrimSpace(data)
		data, _ = ExecuteCommandsOnParent("/sbin/ip route | awk '/default/ { print $3 }'", key)
		serverInfo["GATEWAY"] = strings.TrimSpace(data)
		data, _ = ExecuteCommandsOnParent("curl gu.ms/ip", key)
		serverInfo["PUBLIC IP"] = strings.TrimSpace(data)
		data, _ = ExecuteCommandsOnParent("netstat -anptl 2>/dev/null | head -n 10 | grep -i tcp | awk '{ print $4 }' | awk -F: '{ print $2 }' | tr '\n' ', ' | sed 's/,$//'", key)
		serverInfo["PORTS"] = strings.TrimSpace(data)
		data, _ = ExecuteCommandsOnParent("df -h / | tail -n1 | awk '{ print $3 \"/\" $2 }'", key)
		serverInfo["/"] = strings.TrimSpace(data)

		jsonString, err := json.Marshal(serverInfo)
		if err != nil {
			Log.Printf("There is an error marshalling the server info object %v", err)
		}
		response := string(jsonString)
		//Log.Printf("JSON RESPONSE STRING %s", response)
		//WriteHTTP(url.QueryEscape(response), writer)
		WriteHTTP(response, writer)
		break
	case "logs":
	    socket, err := setupWebSocket(writer, reader)
		if err != nil {
			Log.Printf("Cannot create a web socket")
		}

		socketWriter := _ssh.NewSocketWriter(socket)
		Log.SetOutput(socketWriter)
		sshManager.SetLogger(socketWriter)
	}
}

func configureRootCAs(caCertPathFlag *string) *x509.CertPool {
	// also load as bytes for x509
	// Read in the cert file
	x509certs, err := ioutil.ReadFile(*caCertPathFlag)
	if err != nil {
		Log.Printf("Failed to append certificate to RootCAs: %v", err)
	}

	// Get the SystemCertPool, continue with an empty pool on error
	rootCAs, _ := x509.SystemCertPool()
	if rootCAs == nil {
		rootCAs = x509.NewCertPool()
	}
	// append the local cert to the in-memory system CA pool
	if ok := rootCAs.AppendCertsFromPEM(x509certs); !ok {
		Log.Printf("No certs appended, using system certs only")
	}
	return rootCAs
}