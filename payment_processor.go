package main

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/gorilla/websocket"

	"github.com/go-redis/redis"
)

type PaymentProcessor struct {
	RedisClient *redis.Client
}

func NewPaymentProcessor() *PaymentProcessor {
	var client *redis.Client
	for {
		fmt.Println("Attempting to connect to redis")
		client = redis.NewClient(&redis.Options{
			Addr:     "redis-players:6379",
			Password: "",
			DB:       0,
		})
		_, err := client.Ping().Result()
		if err != nil {
			fmt.Println("Payserver could not connect to redis")
			fmt.Println(err)
		} else {
			break
		}
		time.Sleep(500 * time.Millisecond)
	}

	return &PaymentProcessor{
		RedisClient: client,
	}
}

func (p *PaymentProcessor) NewCustomer(conn *websocket.Conn) {
	wallet := p.GenerateWallet()
	conn.WriteJSON(wallet)

	target := p.CurrentCost()
	isPaid := make(chan bool)

	go p.CheckBalance("", target, isPaid)
	go p.SendToken(conn, isPaid)
}

func (p *PaymentProcessor) CheckBalance(wallet string, target float64, isPaid chan bool) {
	time.Sleep(time.Duration(rand.Intn(10)*1000) * time.Millisecond)
	isPaid <- true
}

func (p *PaymentProcessor) SendToken(conn *websocket.Conn, isPaid chan bool) {
	select {
	case done := <-isPaid:
		if done {
			token := p.GenerateToken()
			p.RedisClient.Set(token["token"], "paid", 0)
			conn.WriteJSON(token)
			conn.Close()
		}
	}
}

func (p *PaymentProcessor) CurrentCost() float64 {
	return 0.0001 // roughly $0.60
}

func (p *PaymentProcessor) GenerateToken() map[string]string {
	rand.Seed(time.Now().UnixNano())
	letterRunes := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

	b := make([]rune, 8)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return map[string]string{"token": string(b)}
}

func (p *PaymentProcessor) GenerateWallet() map[string]string {
	return map[string]string{"bitcoinAddress": "3LVnhdermwHoWzEEteKvXqG4rUXn4Wuy4S"}
}
