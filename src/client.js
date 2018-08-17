import { WebSocket } from 'ws';

export default class Client {
    constructor(conn, token) {
        this.connection = conn
        this.token = token

        this.connection.on('message', this.message.bind(this));
        this.connection.send(JSON.stringify({'bitcoinAddress' : '3LVnhdermwHoWzEEteKvXqG4rUXn4Wuy4S'}))
    }

    message(message) {
        console.log(message)
    }

}
