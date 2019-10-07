package ssh

import "github.com/gorilla/websocket"

type Consumer struct {
	id                   string
	publisher            *Publisher
	socket               *websocket.Conn
	Stdout               chan message
	Stderr               chan message
	Stdin                chan message
	stopSendingToServer  chan bool
	notificationChannel  chan<- notification
}

func NewConsumer(id string, websocket *websocket.Conn) *Consumer {
	return &Consumer{
		id,
		nil,
		websocket,
		make(chan message, 1024),
		make(chan message, 1024),
		make(chan message, 1024),
		make(chan bool),
		make(chan<- notification, 1024),
	}
}