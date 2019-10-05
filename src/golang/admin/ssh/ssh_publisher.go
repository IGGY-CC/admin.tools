package ssh

import (
	"bytes"
)

type message *bytes.Buffer
type notification string

type Publisher struct {
	id                    string
	client                *ServerConnection
	consumers             map[string]*Consumer
}

func NewPublisher(id string) *Publisher {
	return &Publisher{
		id,
		nil, // TODO
		make(map[string]*Consumer),
	}
}

func (publisher *Publisher) AddConsumer(consumer *Consumer) {
	publisher.consumers[consumer.id] = consumer
	consumer.publisher = publisher
}

func (publisher *Publisher) DeleteConsumer(consumer Consumer) {
	delete(publisher.consumers, consumer.id)
}