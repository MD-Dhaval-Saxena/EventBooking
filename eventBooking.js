require("dotenv").config();
const { ethers } = require("ethers");

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

const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contract_address, abi, provider);
const token = new ethers.Contract(Token_address, tokenAbi, provider);
const connect = async () => {
  contracWithWallet = contract.connect(wallet);
  TokenWithWallet = token.connect(wallet);
  
//   const name = await contracWithWallet.owner();
//   console.log("🚀 -------------------------🚀")
//   console.log("🚀 ~ connect ~ name:", name)
//   console.log("🚀 -------------------------🚀")


    // const tx=await contracWithWallet.createEvent(3,"yoyo",11,1,1,10);

    // const tx=await contracWithWallet.add_Ticket_Category(1,1,toWei(0.1),3);
    // const options = {value: toWei(0.1)}
    // const tx=await contracWithWallet.bookTicket(1,1,1,options);
    
    // const tx=await TokenWithWallet.setApprovalForAll(contract_address,true);
    // const tx=await contracWithWallet.cancelTicket(1,1,1);
    // const tx=await contracWithWallet.Cancel_event(1);
    // const tx=await contracWithWallet.claimRefund(1);
    // const tx=await contracWithWallet.eventInfo(1);
    const tx=await contracWithWallet.cance(1);
    console.log("🚀 ---------------------🚀")
    console.log("🚀 ~ connect ~ tx:", tx)
    console.log("🚀 ---------------------🚀")


    

    // const rc = await tx.wait();
    // console.log("🚀 ---------------------🚀")
    // console.log("🚀 ~ connect ~ rc:", rc)
    // console.log("🚀 ---------------------🚀")
    //     const events = rc.events;
    //     console.log("🚀 -----------------------------🚀")
    // console.log("🚀 ~ connect ~ events:", events)
    // console.log("🚀 -----------------------------🚀")

    
    

}
connect()

const toDate=(value)=>{
    const unixTimestamp = value
    const milliseconds = value * 1000 
    const dateObject = new Date(milliseconds)
    const humanDateFormat = dateObject.toLocaleString() 
    return humanDateFormat;
}

contract.on("EventCreate", (eventId,EventName,Owner,Date,startTime,endTime,tickets,event) => {
    let transferEvent ={
        eventId: parseInt(eventId),
        EventName: EventName,
        Owner: Owner,
        Date:toDate(Date),
        startTime: toDate(startTime),
        endTime: toDate(endTime),
        tickets:parseInt(tickets),
        // evenData:event
    }
    console.log(transferEvent);
  })