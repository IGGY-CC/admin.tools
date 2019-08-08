package lib

type SocketConnection interface {
	Setup()
	Connect()
	Read()
	Write()
	Disconnect()
	Resize(cols int, rows int)  (err error)
	UnmarshalParams(jsonString string)
}
