const mongoose = require("mongoose");
const { Schema } = mongoose;


// uint256 eventId,
// string EventName,
// address Owner,
// uint256 Date,
// uint256 startBooking,
// uint256 endBooking,
// uint256 tickets

const dataSchema = new Schema({
    eventId: {
        type: String,
        unique: true,
      },
    
      EventName: String,
      Owner: String,
      Date: Date,
      startBooking: Date,
      endBooking: Date,
      EventName: String,
      tickets: Number
});

module.exports = mongoose.model("Data", dataSchema);
