const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const port = 4000;
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();


mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log('연결 완료');
    }) 
    .catch(err =>{
        console.error(err);
    })


app.use(cors());
app.use(express.json());

app.get('/', (req, res)=>{
    res.send('안녕, 유랑아!');
})

app.post('/', (req, res)=>{
    console.log(req.body);
    res.json(req.body);
})


app.use(express.static(path.join(__dirname,`../uploads`)));

app.listen(port, ()=>{
        console.log(`${port}번에서 실행이 되었습니다.`);
});
