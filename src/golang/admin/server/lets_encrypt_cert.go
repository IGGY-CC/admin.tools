package server

import (
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/acme/autocert"
)

func getIP() (ip string){
	return "127.0.0.1"
}

func getDomain(sub string) (domain string) {
	return sub + getIP()
}

func test_lets_encrypt() {
	addr := getDomain("muse.am")

	m := mux.NewRouter()
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		_, err := fmt.Fprintf(w, "Hello world")
		if err != nil {
			Log.Printf("%v", err)
		}
	})

	s := &http.Server{
		Handler: m,
	}

	l := autocert.NewListener(addr)

	Log.Printf("%v", s.Serve(l))
}