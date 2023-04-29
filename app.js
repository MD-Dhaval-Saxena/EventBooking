<<<<<<< HEAD
=======
// const config=require('./Config');

>>>>>>> 9f5a5b71f7c705193ca24ba01198af3877fbffb3
require("dotenv").config()
const express=require('express');
const ethers= require('ethers');
// const mongoose = require("mongoose");

const eventModel=require('./Models/Event');

const abi = require("./ABI/abi.json");
const tokenAbi = require("./ABI/Token.json");
const contract_address = process.env.contract_address;
const Token_address = process.env.token_contract;
const account = process.env.account;
// const account2 = process.env.account2;
const privateKey = process.env.account_private_key;
const provider = new ethers.providers.JsonRpcProvider(process.env.sepolia_url);

const toEth = (value) => ethers.utils.formatEther(value);
const toWei = (value) => ethers.utils.parseEther(value.toString());
const cors=require('cors');
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contract_address, abi, provider);
const token = new ethers.Contract(Token_address, tokenAbi, provider);
contracWithWallet = contract.connect(wallet);


const app=express();
// try {
//     mongoose.connect(process.env.mongo_url);
// } catch (error) {
//     console.log(error);  
// }   
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const toDate=(value)=>{
    const unixTimestamp = value
    const milliseconds = value * 1000 
    const dateObject = new Date(milliseconds)
    const humanDateFormat = dateObject.toLocaleString() 
    return humanDateFormat;
}

app.get('/',async(req,res)=>{
    res.send('hello');
});

app.get('/ViewEvent/:id',async(req,res)=>{
    let id=req.params.id;
    const tx =await contracWithWallet.eventInfo(id);


    let event ={
    eventId: parseInt(tx.eventId),
    EventName: tx.EventName,
    Owner: tx.Owner,
    Date:toDate(tx.Date),
    startTime: toDate(tx.startTime),
    endTime: toDate(tx.endTime),
    tickets:parseInt(tx.tickets),
    }   
    res.send(event);

})
app.post('/CreateEvent',async(req,res)=>{
    // {
    //     "eventId": 1,
    //     "EventName": "EventName",
    //     "Date": 1,
    //     "startTime": 1,
    //     "endTime": 1,
    //     "tickets": 40
    //   }
        let data=req.body;

        let eventId= data.eventId;
        let EventName= data.EventName;
        // let Owner= data.Owner;
        let Date=data.Date;
        let startTime= data.startTime;
        let endTime= data.endTime;
        let tickets=data.tickets;
        // const tx =await contracWithWallet.createEvent(data);
        const tx =await contracWithWallet.createEvent(
            eventId,EventName,Date,startTime,endTime,tickets
        );
        // const tx =await contracWithWallet.createEvent(
        //     1,"EventName",1,1,1,40
        // );
        
        console.log(req.body);
    res.send(data);
    // res.send(name)

})
app.post('/add_Ticket_Category',async(req,res)=>{
    // {
    //     "eventId": 1,
    //     "category": 1,
    //     "price": 0.1,
    //     "totalTickets": 1
    //   }
    // price bigInt Problem
        let data=req.body;

        let eventId= data.eventId;
        let category=data.Date;
        let price= data.startTime;
        let totalTickets=data.tickets;
        const tx =await contracWithWallet.add_Ticket_Category(
            eventId,category,BigInt(price),totalTickets
        );
        console.log(req.body);
     res.send(data);
    // res.send(name)

})
app.post('/bookTicket',async(req,res)=>{
    // {
    //     "eventId": 1,
    //     "category": 1,
    //     "_quantity":1
    //   }
        let data=req.body;

        let eventId= data.eventId;
        let category=data.Date;
        let _quantity=data._quantity;
        let value=toWei(0.1);
        const tx =await contracWithWallet.add_Ticket_Category(
            eventId,category,_quantity,value
        );
        console.log(req.body);
    res.send(data);
    // res.send(name)

})
app.post('/cancelTicket',async(req,res)=>{
    // {
    //     "eventId": 1,
    //     "category": 1,
    //     "_quantity":1
    //   }
        let data=req.body;

        let eventId= data.eventId;
        let category=data.Date;
        let _quantity=data._quantity;
        const tx =await contracWithWallet.cancelTicket(
            eventId,category,_quantity
        );
        console.log(req.body);
     res.send(data);
    // res.send(name)

})

app.listen(8000,()=>{
    console.log(`Serving on http://127.0.0.1:8000`);
})
