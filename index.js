const express = require('express');
const app = express();
const cors = require('cors');
const pool = require("./db");

//middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    console.log("Test run")
    res.send('Hello world!')
})

app.listen(3001, () => {
    console.log('Server is running at port 3001')
})
