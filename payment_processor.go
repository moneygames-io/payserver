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

type Player struct{
	Id string
	Status string
	PaymentAddress string
	PersonalAddress string
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
	var player = &Player{
		Id: p.GenerateToken(8),
		Status: "unpaid",
		PaymentAddress: p.GenerateWallet(),
	}
	conn.WriteJSON(map[string]string{"bitcoinAddress": player.PaymentAddress})
	p.RedisClient.HSet(player.Id, "status", player.Status)
	p.RedisClient.HSet(player.Id, "paymentAddress", player.PaymentAddress)

	target := p.CurrentCost()
	isPaid := make(chan bool)

	go p.CheckBalance(player, target, isPaid)
	go p.SendToken(player, conn, isPaid)
}

func (p *PaymentProcessor) CheckBalance(player *Player, target float64, isPaid chan bool) {
	time.Sleep(time.Duration(rand.Intn(10)*1000) * time.Millisecond)
	player.Status = "paid"
	p.RedisClient.HSet(player.Id, "status", player.Status)
	isPaid <- true
}

func (p *PaymentProcessor) SendToken(player *Player, conn *websocket.Conn, isPaid chan bool) {
	select {
	case done := <-isPaid:
		if done {
			conn.WriteJSON(map[string]string{"token": player.Status})
			conn.Close()
		}
	}
}

func (p *PaymentProcessor) CurrentCost() float64 {
	return 0.0001 // roughly $0.60
}

func (p *PaymentProcessor) GenerateToken(length int) string {
	rand.Seed(time.Now().UnixNano())
	charRunes := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

	b := make([]rune, length)
	for i := range b {
		b[i] = charRunes[rand.Intn(len(charRunes))]
	}
	return string(b)
}

func (p *PaymentProcessor) GenerateWallet() string {
	return "3LVnhdermwHoWzEEteKvXqG4rUXn4Wuy4S"
}
