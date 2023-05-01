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

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() internal view virtual {
        require(contract_owner == msg.sender, "Ownable: caller is not the owner");
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
    mapping(uint256 => bool)  CancelEvent;

    // userFunds public until testing phase
    mapping(uint256 => mapping(address => uint256)) public userFunds; 
    mapping(uint256 =>  uint256) public paymentEvent; 
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
    function isEvent(uint _eventID) internal view{
        Event storage events = eventInfo[_eventID];
        require(events.Owner != address(0), "Event Not Found,Please Reconfirm");
    }

    // _category is unique for all events
    // start with eventId + 00 + Category number example:1001,1002,1003

    function add_Ticket_Category(
        uint256 _eventID,
        uint256 _category,
        uint256 _price,
        uint256 _totalTickets
    ) public {
        TicketCategory storage ticCategory = eventTicketCategories[_eventID][
            _category
        ];
        require(ticCategory.totalTickets <= 0,"Event Category Already Exist!");
        // Silver =1,Gold=2,Diamond=3
        Event storage events = eventInfo[_eventID];
        require(events.Owner == msg.sender,"Only Event Organizer");
        isEvent(_eventID);
        // condition category tickets can't be greater than total tickets
        require(
            _totalTickets <= remainCategory[_eventID],
            "Not Enough Ticket to add"
        );

        eventInfo[_eventID].ticketCategories.push(_category);
        eventTicketCategories[_eventID][_category] = TicketCategory(
            _price,
            _totalTickets,
            _totalTickets
        );
        remainCategory[_eventID] -= _totalTickets;
        CountCategories.push(_category);
    }

    function bookTicket(
        uint256 _eventID,
        uint256 _category,
        uint256 _quantity
    ) public payable {
        Event storage events = eventInfo[_eventID];
        require(block.timestamp >= events.startBooking, "Booking Will Open Soon,Not began yet");
        require(block.timestamp <= events.endBooking, "Sorry! Booking's For this Event ended");
        isEvent(_eventID);
        TicketCategory storage ticCategory = eventTicketCategories[_eventID][
            _category
        ];
        require(msg.value > 0, "Funds Not provided");
        require(_quantity > 0, "Quantity Not provided");
        require(ticCategory.price > 0, "Invalid ticket category ");
        require(
            _quantity <= ticCategory.totalTickets,
            "Quantity is more than available Tickets"
        );
        require(ticCategory.totalTickets > 0, "Tickets Sold Out");
        require(msg.value >= ticCategory.price * _quantity, "Not Enough Funds");
        events.tickets -= _quantity;
        ticCategory.totalTickets -= _quantity;
        // Mint by user
        tokenAdd.mint(msg.sender, _category, _quantity); //owner mint
        userFunds[_eventID][msg.sender] += msg.value;
        paymentEvent[_eventID]+=msg.value;
        
    }
    
    function ViewTicket(uint256 _category) public view returns (uint256) {
       return tokenAdd.balanceOf(msg.sender, _category);
    } 
    function VerifyTicket(uint _eventID, uint256 _category) public returns(bool) {
        isEvent(_eventID);
        // This Method Is Called ON Event venue
        uint tokenBalance=tokenAdd.balanceOf(msg.sender, _category);
        require(tokenBalance > 0,"No Tickets Found");
        tokenAdd.burn(msg.sender, _category, tokenBalance);
        userFunds[_eventID][msg.sender]=0;
        return true;
    }

    function cancelTicket(
        uint256 _eventID,
        uint256 _category,
        uint256 _quantity
    ) public payable {
        // 10% tax on cancelTicket
        // Event storage events = eventInfo[eventID];
        TicketCategory storage ticCategory = eventTicketCategories[_eventID][
            _category
        ];
        uint256 Amount = ticCategory.price * _quantity;
        uint256 Tax = Amount / 10;
        uint256 totalRefund = Amount - Tax;
        payable(msg.sender).transfer(totalRefund);
        tokenAdd.burn(msg.sender, _category, _quantity);
        userFunds[_eventID][msg.sender]-=Amount;

    }

    function Cancel_event(uint256 _eventID) public {
        Event storage events = eventInfo[_eventID];
        require(events.Owner == msg.sender,"Only Event Organizer");
        CancelEvent[_eventID] = true;
        delete eventInfo[_eventID];
    }

    // For Testing
    function WithdrawETH() public payable {
        payable(msg.sender).transfer(address(this).balance);
    }

    // Claim Refund and Burned Tickets
    function claimRefund(uint256 _eventID,uint _category) public payable {
        TicketCategory storage ticCategory = eventTicketCategories[_eventID][
        _category
        ];
        uint tokenBalance=tokenAdd.balanceOf(msg.sender, _category);
        require(CancelEvent[_eventID], "Event is Not cancelled");
        require(ticCategory.price > 0, "Invalid ticket category ");

         require(
            tokenBalance > 0,
            "Your not eligible or already withdrawn funds"
        );
    
        uint256 Amount = ticCategory.price * tokenBalance;
        userFunds[_eventID][msg.sender]-=Amount;
        payable(msg.sender).transfer(Amount);
        // Claim Refund and Burned Tickets
        tokenAdd.burn(msg.sender, _category, tokenBalance);
        

    }

    function PaymentToOWner(uint _eventID) public payable onlyOwner {
        uint balance=paymentEvent[_eventID];
        require(balance > 0,"No Funds to Send");
        Event storage events = eventInfo[_eventID];
         isEvent(_eventID);
        require(block.timestamp > events.endBooking,"Booking For Event is Still Open");
        // require(contract_owner == msg.sender,"Only Contract Owner");
        payable(events.Owner).transfer(balance);

    }

    function getCat() public view returns(uint[] memory){
        return CountCategories;
    }
    function getEvent() public view returns(uint[] memory){
        return CurrEvents;
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
