
const express = require('express'),
    app = express(),
    router = require('./route')(express.Router());

//import config to global
require('./constants')

//handle request
app.use(router)

// handler request not found
app.use((req, res) => {
    return res.status(404).json({ status: false, message: 'Your request is not found !' })
})
app.use((err, req, res) => {
    return res.status(500).json({ status: false, message: err });
})
module.exports = app