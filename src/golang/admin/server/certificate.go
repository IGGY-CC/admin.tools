package server

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"log"
	"math/big"
	"os"
	"time"
)

const EC_KEYFILE string = "ec_key.pem"
const EC_CERTFILE string = "ec_cert.crt"

const RSA_KEYFILE string = "rsa_key.pem"
const RSA_CERTFILE string = "rsa_cert.crt"

func generateECKey() (key *ecdsa.PrivateKey) {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		log.Fatalf("Failed to generate ECDSA key: %s\n", err)
	}

	keyDer, err := x509.MarshalECPrivateKey(key)
	if err != nil {
		log.Fatalf("Failed to serialize ECDSA key: %s\n", err)
	}

	keyBlock := pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: keyDer,
	}

	keyFile, err := os.Create(EC_KEYFILE)
	if err != nil {
		log.Fatalf("Failed to open %s for writing: %s", EC_KEYFILE, err)
	}
	defer func() {
		err = keyFile.Close()
		if err != nil {
			Log.Printf("There is an error closing the KeyFile: %s", err)
		}
	}()

	err = pem.Encode(keyFile, &keyBlock)
	if err != nil {
		Log.Printf("There is an error encoding the PEM: %s", err)
	}

	return
}

func generateRSAKey() (key *rsa.PrivateKey) {
	key, err := rsa.GenerateKey(rand.Reader, 3072)
	if err != nil {
		log.Fatalf("Failed to generate RSA key: %s\n", err)
	}

	keyDer := x509.MarshalPKCS1PrivateKey(key)

	keyBlock := pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: keyDer,
	}

	keyFile, err := os.Create(RSA_KEYFILE)
	if err != nil {
		log.Fatalf("Failed to open %s for writing: %s", RSA_KEYFILE, err)
	}
	defer func() {
		err = keyFile.Close()
		if err != nil {
			Log.Printf("There is an error closing the KeyFile: %s", err)
		}
	}()

	err = pem.Encode(keyFile, &keyBlock)
	if err != nil {
		Log.Printf("There is an error encoding the PEM: %s", err)
	}
	return
}

func generateCert(pub, priv interface{}, filename string) {
	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Organization: []string{"muse.am"},
		},
		NotBefore: time.Now().Add(-time.Hour * 24 * 365),
		NotAfter:  time.Now().Add(time.Hour * 24 * 365),
	}
	certDer, err := x509.CreateCertificate(
		rand.Reader, &template, &template, pub, priv,
	)
	if err != nil {
		log.Fatalf("Failed to create certificate: %s\n", err)
	}

	certBlock := pem.Block{
		Type:  "CERTIFICATE",
		Bytes: certDer,
	}

	certFile, err := os.Create(filename)
	if err != nil {
		log.Fatalf("Failed to open '%s' for writing: %s", filename, err)
	}
	defer func() {
		err = certFile.Close()
		if err != nil {
			Log.Printf("There is an error closing the CertFile: %s", err)
		}
	}()

	err = pem.Encode(certFile, &certBlock)
	if err != nil {
		Log.Printf("There is an error encoding the PEM file: %s", err)
	}
}

func test() {
	// Generate ECDSA P-256 Key
	log.Println("Generating an ECDSA P-256 Private Key")
	ECKey := generateECKey()

	// Generate Self-Signed Certificate using ECDSA P-256 Key
	log.Println("Generating a Self-Signed Certificate from ECDSA P-256 Key")
	generateCert(&ECKey.PublicKey, ECKey, EC_CERTFILE)

	// Generate RSA 3072 Key
	log.Println("Generating an RSA 3072 Private Key")
	RSAKey := generateRSAKey()

	// Generate Self-Signed Certificate using RSA 3072 Key
	log.Println("Generating a Self-Signed Certificate from RSA 3072 Key")
	generateCert(&RSAKey.PublicKey, RSAKey, RSA_CERTFILE)
}
