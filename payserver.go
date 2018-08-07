package main

import (
	"fmt"
	"github.com/gorilla/websocket"
	"net/http"
)

func main() {
	fmt.Println("Payserver Started")
	http.HandleFunc("/ws", wsHandler)

	panic(http.ListenAndServe(":7000", nil))
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket.Upgrade(w, r, w.Header(), 1024, 1024)
	if err != nil {
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
	}
	if err := conn.WriteJSON(map[string]string{ "bitcoinAddress" : "3LVnhdermwHoWzEEteKvXqG4rUXn4Wuy4S" } ); err != nil {
		fmt.Println(err)
	}
}
