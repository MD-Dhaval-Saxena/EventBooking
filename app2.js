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
tokenWithWallet = token.connect(wallet);


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
    const options = { month: "long", day: "numeric", hour: "numeric", minute: "numeric", year: "numeric" };
    const humanDateFormat = dateObject.toLocaleString('en-US', options) 
    return humanDateFormat;
}

app.get('/',async(req,res)=>{
    res.send('Welcome TO Event Booking');
});

app.get('/ViewEvent/:id',async(req,res)=>{
    let id=req.params.id;
    const tx =await contracWithWallet.eventInfo(id);
    let event ={
    eventId: parseInt(tx.eventId),
    EventName: tx.EventName,
    Owner: tx.Owner,
    Date:toDate(tx.Date),
    startBooking: toDate(tx.startBooking),
    endBooking: toDate(tx.endBooking),
    tickets:parseInt(tx.tickets),
    }   
    res.send(event);

})
app.get('/ViewAllEvent',async(req,res)=>{
    let events=[];
    let event;
    let category;
    let tx1;
    for (let i = 1; i < 8; i++) {
        const tx =await contracWithWallet.eventInfo(i);
      
        event ={
            eventId: parseInt(tx.eventId),
            EventName: tx.EventName,
            Owner: tx.Owner,
            Date:toDate(tx.Date),
            startBooking: toDate(tx.startBooking),
            endBooking: toDate(tx.endBooking),
            tickets:parseInt(tx.tickets),
            ticketCategories:tx.ticketCategories
        }   
    
        
            // events.push(event,category);
        if(!event.eventId==0){
            events.push(event);
        }
        for (let cID = 1; cID <= 3; cID++) {
            tx1 =await contracWithWallet.eventTicketCategories(i,cID);
            category={
                categoryID:tx1.cID,
                price:parseInt(tx1.price),
                totalTickets:parseInt(tx1.totalTickets),
                 }

                if(!category.price==0){
                    events.push(category);
                }
        }
        }


        // console.log(category);
        res.send(events);
    

})
app.post('/CreateEvent',async(req,res)=>{
    // {
    //     "eventId": 9,
    //     "EventName": "krsna dollar sign",
    //     "Date": 1682763026,
    //     "startBooking": 1682660878,
    //     "endBooking": 1682763026,
    //     "tickets": 40
    //   }
        let data=req.body;

        let eventId= data.eventId;
        let EventName= data.EventName;
        let Date=data.Date;
        let startBooking= data.startBooking;
        let endBooking= data.endBooking;
        let tickets=data.tickets;
        const tx =await contracWithWallet.createEvent(
            eventId,EventName,Date,startBooking,endBooking,tickets
        );
        console.log(tx);
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
        let data=req.body;

        let eventId= data.eventId;
        let category=data.category;
        let price= data.price;
        let totalTickets=data.totalTickets;
        const tx =await contracWithWallet.add_Ticket_Category(
            eventId,category,toWei(price),totalTickets
        );
       
     res.send(tx);

})
app.post('/bookTicket',async(req,res)=>{
//     {
//         "eventId": 1,
//         "category": 2,
//         "_quantity":1,
//         "value":0.5
// }
        let data=req.body;

        let eventId= data.eventId;
        let category=data.category;
        let _quantity=data._quantity;
        let valueAmount={value:toWei(data.value)};
        const tx =await contracWithWallet.bookTicket(
            eventId,category,_quantity,valueAmount
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
        let category=data.category;
        let _quantity=data._quantity;
        const tx =await contracWithWallet.cancelTicket(
            eventId,category,_quantity
        );
        console.log(req.body);
     res.send(data);
    // res.send(name)

})
app.post('/setApprovalForAll',async(req,res)=>{
    // {
    //     "operator": "0x77677De940e9E59941F4ae18E9EFDfa54a07A42C",
    //     "approved": true
    //   }
        let data=req.body;

        let operator= data.operator;
        let approved=data.approved;
        const tx =await tokenWithWallet.setApprovalForAll(
            operator,approved
        );
        
        console.log(tx);
     res.send(data);

})

app.listen(8000,()=>{
    console.log(`Serving on http://127.0.0.1:8000`);
})


