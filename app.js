require("dotenv").config();
const express=require('express');
const ethers=require('ethers');
const mongoose = require("mongoose");

const eventModel=require('./Models/Event');

const abi = require("./ABI/abi.json");
const tokenAbi = require("./ABI/Token.json");
const contract_address = process.env.contract_address;
const Token_address = process.env.token_contract;
const account = process.env.account;
const account2 = process.env.account2;
const privateKey = process.env.account_private_key;
const provider = new ethers.providers.JsonRpcProvider(process.env.sepolia_url);

const toEth = (value) => etherss.utils.formatEther(value);
const toWei = (value) => ethers.utils.parseEther(value.toString());
const cors=require('cors');
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contract_address, abi, provider);
const token = new ethers.Contract(Token_address, tokenAbi, provider);
contracWithWallet = contract.connect(wallet);


const app=express();
try {
    mongoose.connect(process.env.mongo_url);
} catch (error) {
    console.log(error);  
}   
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

app.post('/ViewEvent',async(req,res)=>{
    const tx =await contracWithWallet.eventInfo(1);
    console.log(tx);

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
        console.log("🚀 ----------------------🚀")
        console.log("🚀 ~ app.post ~ tx:", tx)
        console.log("🚀 ----------------------🚀")
        console.log(req.body);
    res.send(tx);
    // res.send(name)

})

app.listen(8000,()=>{
    console.log(`Serving on http://127.0.0.1:8000`);
})

// con="0x77677De940e9E59941F4ae18E9EFDfa54a07A42C"
// TOk="0xC9DbD4EC58D9A235dd9495B0cff45Bb22e534997"