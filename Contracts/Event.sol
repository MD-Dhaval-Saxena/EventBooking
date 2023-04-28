// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "./Token.sol";

contract EventBooking is ERC1155Holder {
    Ticket tokenAdd;

    address contract_owner;
    constructor(address _token) {
        tokenAdd = Ticket(_token);
        contract_owner=msg.sender;
    }

    uint public eventIdTracker=0;
    uint256 []  CurrEvents ;
    uint256 [] public CountCategories ;
    event EventCreate(
        uint256 eventId,
        string EventName,
        address Owner,
        uint256 Date,
        uint256 startBooking,
        uint256 endBooking,
        uint256 tickets
    );

    struct Event {
        uint256 eventId;
        string EventName;
        address Owner;
        uint256 Date;
        uint256 startBooking;
        uint256 endBooking;
        uint256 tickets;
        uint256[] ticketCategories;
    }
    
    mapping(uint256 => Event) public eventInfo;
    mapping(uint256 => mapping(uint256 => TicketCategory))
        public eventTicketCategories;
    mapping(uint256 => uint256)  remainCategory; //Testing
    mapping(uint256 => bool) public CancelEvent;

    // userFunds public until testing phase
    mapping(uint256 => mapping(address => uint256)) public userFunds; 
    struct TicketCategory {
        uint256 price;
        uint256 totalTickets;
        uint256 remainingTickets;
    }

    function createEvent(
        uint256 _eventID,
        string memory _EventName,
        uint256 _Date,
        uint256 _startBooking,
        uint256 _endBooking,
        uint256 _tickets
    ) public {
        eventIdTracker++;

        Event storage events = eventInfo[_eventID];
        require(_eventID != events.eventId, "EventId Aleready Exist");
        eventInfo[_eventID] = Event(
            _eventID,
            _EventName,
            msg.sender,
            _Date,
            _startBooking,
            _endBooking,
            _tickets,
            new uint256[](0)
        );
        emit EventCreate( _eventID,
            _EventName,
            msg.sender,
            _Date,
            _startBooking,
            _endBooking,
            _tickets
            );
        remainCategory[_eventID] = _tickets;
        CancelEvent[_eventID] = false;
        CurrEvents.push(_eventID);
    }

    function add_Ticket_Category(
        uint256 _eventID,
        uint256 category,
        uint256 price,
        uint256 totalTickets
    ) public {
        // Silver =1,Gold=2,Diamond=3
        Event storage events = eventInfo[_eventID];
        require(events.Owner == msg.sender,"Only Event Organizer");

        // if yOU DON'T WANT THE ORGINIZER TO UPDATE CATEGORY+
        // require(ticCategory.totalTickets < 1 ,"Event Category Exist");
        require(events.Owner != address(0), "Event Not Found");

        // condition category tickets can not greater than total tickets
        require(
            totalTickets <= remainCategory[_eventID],
            "Not Enough Ticket to add"
        );

        eventInfo[_eventID].ticketCategories.push(category);
        eventTicketCategories[_eventID][category] = TicketCategory(
            price,
            totalTickets,
            totalTickets
        );
        remainCategory[_eventID] -= totalTickets;
        CountCategories.push(category);
    }

    function bookTicket(
        uint256 _eventID,
        uint256 _category,
        uint256 _quantity
    ) public payable {
        Event storage events = eventInfo[_eventID];
        require(block.timestamp >= events.startBooking, "Booking Will Open Soon,Not began yet");
        require(block.timestamp <= events.endBooking, "Sorry! Booking's For this Event ended");

        require(events.Owner != address(0), "Event Not Found,Please Reconfirm");
        TicketCategory storage ticCategory = eventTicketCategories[_eventID][
            _category
        ];
        require(msg.value > 0, "Funds Not provided");
        require(_quantity > 0, "Quantity Not provided");
        require(
            _quantity <= ticCategory.totalTickets,
            "Quantity is more than available Tickets"
        );
        require(ticCategory.price > 0, "Invalid ticket category ");
        require(ticCategory.totalTickets > 0, "Tickets Sold Out");
        require(msg.value >= ticCategory.price * _quantity, "Not Enough Funds");
        events.tickets -= _quantity;
        ticCategory.totalTickets -= _quantity;
        // Mint by user
        tokenAdd.mint(msg.sender, _category, _quantity); //owner mint
        userFunds[_eventID][msg.sender] += msg.value;
        
    }

    function ViewTicket(address acc, uint256 id) public view returns (uint256) {
        return tokenAdd.balanceOf(acc, id);
    }

    function VerifyTicket(address acc,uint _eventID, uint256 _category) public returns (bool) {
        // This Method Is Called ON Event venue
        require(
            userFunds[_eventID][acc] > 0,
            "User Don't Have Any Tickets"
        );
        Event storage events = eventInfo[_eventID];
        TicketCategory storage ticCategory = eventTicketCategories[_eventID][
            _category
        ];
        require(ticCategory.price > 0, "Invalid ticket category ");
        require(events.Owner != address(0), "Event Not Found");
        uint tokenBalance=tokenAdd.balanceOf(acc, _category);
        uint256 balance=ticCategory.price * _category;
        // require(balance > userFunds[_eventID][acc],"Not Verified");
        if(userFunds[_eventID][acc] >= balance && tokenBalance > 0){
            // Give Entry and Burn Ticket
            tokenAdd.burn(acc, _category, tokenBalance);
            return true ;
        }
        return false;
    }

    function cancelTicket(
        uint256 eventID,
        uint256 category,
        uint256 quantity
    ) public payable {
        // 10% tax on cancelTicket
        // Event storage events = eventInfo[eventID];
        TicketCategory storage ticCategory = eventTicketCategories[eventID][
            category
        ];
        uint256 Amount = ticCategory.price * quantity;
        uint256 Tax = Amount / 10;
        uint256 totalRefund = Amount - Tax;
        payable(msg.sender).transfer(totalRefund);
        tokenAdd.burn(msg.sender, category, quantity);
    }

    function Cancel_event(uint256 _eventID) public {
        Event storage events = eventInfo[_eventID];
        require(events.Owner == msg.sender,"Only Event Organizer");
        CancelEvent[_eventID] = true;
        delete eventInfo[_eventID];
        // uint balance= tokenAdd.balanceOf(msg.sender, _category);
        // tokenAdd.burn(msg.sender, _category, balance);

        // delete eventTicketCategories[]
    }

    // For Testing
    function WithdrawETH() public payable {
        payable(msg.sender).transfer(address(this).balance);
    }

    // Claim Refund and Burned Tickets
    function claimRefund(uint256 _eventID,uint _category) public payable {
        require(CancelEvent[_eventID], "Event is Not cancelled");
        require(
            userFunds[_eventID][msg.sender] > 0,
            "Your not eligible or already withdrawn funds"
        );
        uint256 amount = userFunds[_eventID][msg.sender];
        payable(msg.sender).transfer(amount);
        delete userFunds[_eventID][msg.sender];
        uint balance= tokenAdd.balanceOf(msg.sender, _category);
        // Claim Refund and Burned Tickets
        tokenAdd.burn(msg.sender, _category, balance);

    }

    function PaymentToOWner(uint _eventID) public payable {
        Event storage events = eventInfo[_eventID];
        require(events.Owner != address(0), "Event Not Found");
        require(block.timestamp > events.endBooking,"Booking For Event is Still Open");
        require(contract_owner == msg.sender,"Only Contract Owner");
        payable(events.Owner).transfer(address(this).balance);

    }

    // function ViewEvents() public view returns(uint256[] memory){
    //     return CurrEvents;
    // }

    function getCat() public view returns(uint[] memory){
        return CountCategories;
    }
    function viewAllEvents() public view returns (Event[] memory) {
        Event[] memory id = new Event[](CurrEvents.length); //2
        for(uint256 i = 0; i < CurrEvents.length; i++) { 
            Event storage eve=eventInfo[i];
            id[i]=eve;
        }
        return id;
    }
}
