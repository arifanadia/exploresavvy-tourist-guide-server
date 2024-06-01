const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000

// middleware
app.use(cors());
app.use(express.json());


app.get('/',(req,res)=> {
    res.send('exploreSavvy are now exploring')
})
app.listen(port,(req,res)=>{
    console.log(`exploreSavvy are exploring on port : ${port}`);
})