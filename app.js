require("dotenv").config();
const express = require("express");
const ethers = require("ethers");
const mongoose = require("mongoose");

// const eventModel = require("./Models/Event");

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
const cors = require("cors");
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contract_address, abi, provider);
const token = new ethers.Contract(Token_address, tokenAbi, provider);
contracWithWallet = contract.connect(wallet);
tokenWithWallet = token.connect(wallet);

const app = express();
// try {
//   mongoose.connect(process.env.mongo_url);
// } catch (error) {
//   console.log(error);
// }
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function That Convert UnixTimeStamp to Data
const toDate = (value) => {
  const unixTimestamp = value;
  const milliseconds = value * 1000;
  const dateObject = new Date(milliseconds);
  const options = {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    year: "numeric",
  };
  const humanDateFormat = dateObject.toLocaleString("en-US", options);
  return humanDateFormat;
};

app.get("/", async (req, res) => {
  res.send("Welcome TO Event Booking");
});

app.get("/ViewEvent/:id", async (req, res) => {
  let events = []; //Stores the Json Data
  let CatLen = [1, 2, 3]; 
  let event; 
  let category;
  let tx1;
  let id = req.params.id;

  //Mapping that stores event data 
  // mapping(uint256 => Event) public eventInfo;
  const tx = await contracWithWallet.eventInfo(id);
  event = {
    eventId: parseInt(tx.eventId),
    EventName: tx.EventName,
    Owner: tx.Owner,
    Date: toDate(tx.Date),
    startBooking: toDate(tx.startBooking),
    endBooking: toDate(tx.endBooking),
    tickets: parseInt(tx.tickets),
  };
  if (!event.eventId == 0) {
    events.push(event);
  }

  for (let cID = 1; cID <= CatLen.length; cID++) {
    tx1 = await contracWithWallet.eventTicketCategories(id, `${id}00${cID}`);
    category = {
      categoryID: `${id}00${cID}`,
      price: parseInt(tx1.price),
      totalTickets: parseInt(tx1.totalTickets),
    };

    if (!category.price == 0 && !event.eventId == 0) {
      events.push(category);
    }
  }
  if (!events.length == 0) {
    res.send(events);
  }
  res.send({ status: "No event Found" });

});
app.get("/ViewAllEvent", async (req, res) => {
  let events = [];
  let CatLen = [1, 2, 3]; //Fetch from contract
  let event;
  let category;
  let tx1;


  // total numbers of events
  // const totalEvent = await contracWithWallet.eventIdTracker();

  // Array With EventId
  let getEve = await contracWithWallet.getEvent();

  for (let i = 0; i < getEve.length; i++) {
    let No = getEve[i];

    //Mapping that stores event data 
    const tx = await contracWithWallet.eventInfo(No);

    event = {
      eventId: parseInt(tx.eventId),
      EventName: tx.EventName,
      Owner: tx.Owner,
      Date: toDate(tx.Date),
      startBooking: toDate(tx.startBooking),
      endBooking: toDate(tx.endBooking),
      tickets: parseInt(tx.tickets),
      ticketCategories: tx.ticketCategories,
    };

    if (!event.eventId == 0) {
      events.push(event);
    }
    for (let cID = 1; cID <= CatLen.length; cID++) {
      tx1 = await contracWithWallet.eventTicketCategories(No, `${No}00${cID}`);
      category = {
        categoryID: `${No}00${cID}`,
        price: parseInt(tx1.price),
        totalTickets: parseInt(tx1.totalTickets),
      };

      if (!category.price == 0 && !event.eventId == 0) {
        events.push(category);
      }
    }
  }

  if (!events.length == 0) {
    res.send(events);
  }
  else{
    res.send({ status: "No events Found" });
  }
});
app.post("/CreateEvent", async (req, res) => {
  let event;
  // {
  //   "eventId": 1,
  //   "EventName": "Samay Raina Unfiltered - India Tour",
  //   "Date": 1683022226,
  //   "startBooking": 1682919935,
  //   "endBooking": 1683022226,
  //   "tickets": 100
  // }
  let data = req.body;

  event = {
    eventId: data.eventId,
    EventName: data.EventName,
    Date: data.Date,
    startBooking: data.startBooking,
    endBooking: data.endBooking,
    tickets: data.tickets,
  };

  try {

    const tx = await contracWithWallet.createEvent(
      event.eventId,
      event.EventName,
      event.Date,
      event.startBooking,
      event.endBooking,
      event.tickets
    );

    // console.log(event)
    // Mongo
    // try {
    //   const eventData = new eventModel(event);
    //   await eventData.save();
    // } catch (error) {
    //   console.log(error);
    // }

    res.send({ Status: `Event Created Succefully EventID:${event.eventId}` });
  } catch (error) {
    res.send(error);
  }
});
app.post("/add_Ticket_Category", async (req, res) => {
  //   {
  //     "eventId": 2,
  //     "category": 2001,
  //     "price": 0.1,
  //     "totalTickets": 30
  // }
  let data = req.body;

  let eventId = data.eventId;
  let category = data.category;
  let price = data.price;
  let totalTickets = data.totalTickets;
  try {
    const tx = await contracWithWallet.add_Ticket_Category(
      eventId,
      category,
      toWei(price),
      totalTickets
    );
    res.send({ Status: `Category Added For EventID:${eventId}` });
  } catch (error) {
    res.send(error);
  }
});

app.post("/bookTicket", async (req, res) => {
//   {
//     "eventId": 1,
//     "category": 1001,
//     "_quantity":1,
//     "value":0.1

// }
  let data = req.body;

  let eventId = data.eventId;
  let category = data.category;
  let _quantity = data._quantity;
  let valueAmount = { value: toWei(data.value) };
  
  try {
    const tx = await contracWithWallet.bookTicket(
      eventId,
      category,
      _quantity,
      valueAmount
    );
    res.send({ Status: `Ticket Booked Succefully ID:${category}` });
  } catch (error) {
    // res.send( error);
    res.send(error.error.error.body);
  }
});
app.get("/ViewTicket", async (req, res) => {
  // {
  //  "category": 2
  // }
  let data = req.body;

  let _category = data.category;
  try {
    const tx = await contracWithWallet.ViewTicket(_category);
    res.send({ "Category Ticket balance": parseInt(tx) });
  } catch (error) {
    res.send(error);
  }
});
app.post("/VerifyTicket", async (req, res) => {
  // Please Give Apporval Before Calling..

  // {
  //   "eventID": 3,
  //   "category":3001
  // }
  let data = req.body;
  let eventId = data.eventId;
  let category = data.category;
  const tx = await contracWithWallet.VerifyTicket(eventId, category);
  console.log("Please Give Apporval Before Calling..");
  res.send({ "Ticket Verified": true });
});
app.post("/cancelTicket", async (req, res) => {
  // {
  //     "eventId": 1,
  //     "category": 1,
  //     "_quantity":1
  //   }
  let data = req.body;

  let eventId = data.eventId;
  let category = data.category;
  let _quantity = data._quantity;
  try {
    const tx = await contracWithWallet.cancelTicket(
      eventId,
      category,
      _quantity
    );
  } catch (error) {}
  res.send({ "Ticket Cancelled Succufully": true });

  // console.log(req.body);
  // res.send(name)
});
app.post("/Cancel_event", async (req, res) => {
  //   {
  //       "eventId": 1
  //     }
  let data = req.body;

  let eventId = data.eventId;
  try {
    const tx = await contracWithWallet.Cancel_event(eventId);
    res.send({ "Event Cancelled Succufully": true });
  } catch (error) {
    res.send(error);
  }
});
app.post("/claimRefund", async (req, res) => {
  // {
  //     "eventId": 1,
  //         "_category": 1
  //   }
  let data = req.body;

  let eventId = data.eventId;
  let _category = data._category;
  const tx = await contracWithWallet.claimRefund(eventId, _category);
  console.log(req.body);
  res.send({ "Claimed Refund Succufully": true });
});

app.post("/PaymentToOWner", async (req, res) => {
  // {
  //     "eventId": 1,
  //   }
  let data = req.body;

  let eventId = data.eventId;
  console.log(eventId);
  try {
    let tx = await contracWithWallet.PaymentToOWner(eventId);
    res.send({ "Payment Sent Succufully to Owner": true });
  } catch (error) {
    res.send(error);
  }
});

app.post("/setApprovalForAll", async (req, res) => {
  // {
  //     "operator": "0x77677De940e9E59941F4ae18E9EFDfa54a07A42C",
  //     "approved": true
  //   }
  let data = req.body;

  let operator = data.operator;
  let approved = data.approved;
  const tx = await tokenWithWallet.setApprovalForAll(operator, approved);

  console.log(tx);
  res.send(data);
});

app.listen(8000, () => {
  console.log(`Serving on http://127.0.0.1:8000`);
});
