class Payserver {

    constructor(redisURL) {
        conenctToRedis()
    }

    newCustomer() {
        generateToken()
        save token
        go checkstatus(connection)
    }

    onclose() {
        setTokenStatus -> disconnect
    }
}
