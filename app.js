require("dotenv").config();
const express = require("express");
const dataModel=require('../EventBooking/Models/Event');

const Router = require("../EventBooking/Router/routes");
const app = express();

const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(Router);
app.get("/", async (req, res) => {
  res.send("Welcome TO Event Booking");
});
app.listen(8000, () => {
  
  console.log(`Serving on http://127.0.0.1:8000`);
});
