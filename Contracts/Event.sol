// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "./Token.sol";

 contract EventBooking is ERC1155Holder {
    ERC1155 tokenAdd;
    constructor(ERC1155 _token) {
        tokenAdd = _token;
    }

    struct Event {
        // ERC1155 _token;
        uint256 eventId;
        string EventName;
        address Owner;
        uint256 Date;
        uint256 startTime;
        uint256 endTime;
        uint256 tickets;
        // string[] ticketCategories;
        uint256[] ticketCategories;
    }
    mapping(uint256 => Event) public eventInfo;
    // mapping(uint256 => mapping(string => TicketCategory))
    //     public eventTicketCategories;
    mapping(uint256 => mapping(uint256 => TicketCategory))
        public eventTicketCategories;
    mapping(uint256 => uint256) public remainCategory; //Testing

    struct TicketCategory {
        uint256 price;
        uint256 totalTickets;
        uint256 remainingTickets;
    }
    // uint256 public eventCount;

    function createEvent(
        uint256 _eventId,
        string memory _EventName,
        uint256 _Date,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tickets
    ) public {
        eventInfo[_eventId] = Event(
            _eventId,
            _EventName,
            msg.sender,
            _Date,
            _startTime,
            _endTime,
            _tickets,
            new uint256[](0)
        );
        remainCategory[_eventId] = _tickets;

    }

    function add_Ticket_Category(
        //One time Add All Category with array 
        uint256 _eventId,
        uint256 category,
        uint256 price,
        uint256 totalTickets
    ) public {
        // Silver =0,Gold=1,Diamond=2

        Event storage events = eventInfo[_eventId];
        require(events.Owner != address(0), "Event Not Found");

        // condition category tickets can not greater than total tickets
        require(
            totalTickets <= remainCategory[_eventId],
            "Not Enough Ticket to add"
        );

        eventInfo[_eventId].ticketCategories.push(category);
        eventTicketCategories[_eventId][category] = TicketCategory(
            price,
            totalTickets,
            totalTickets
        );
        remainCategory[_eventId] -= totalTickets;
    }

    function Cancel_event( uint _eventId) public{
        delete eventInfo[_eventId];
        // TODO: Refund All payments & Burn Tickets
        // delete eventTicketCategories[]

    }

    function bookTicket(
        uint256 eventID,
        uint256 category,
        uint256 quantity
    ) public payable {
        Event storage events = eventInfo[eventID];
        require(events.Owner != address(0), "Event Not Found");
        TicketCategory storage ticCategory = eventTicketCategories[eventID][
            category
        ];
        require(msg.value > 0, "Funds Not provided");
        require(quantity > 0, "quantity Not provided");
        require(ticCategory.totalTickets > 0, "Invalid ticket category");
        require(msg.value >= ticCategory.price * quantity, "Not Enough Funds");
        events.tickets -= quantity;
        ticCategory.totalTickets-=quantity;
        tokenAdd.safeTransferFrom(events.Owner,msg.sender,category,quantity,"");
    }

    function myTicket(address acc, uint256 id) public view returns(uint) {
        return tokenAdd.balanceOf(acc, id);
    }

    function cancelTicket( uint256 eventID,uint256 category,uint256 quantity) public payable{
        // 10% tax on cancelTicket
        Event storage events = eventInfo[eventID];
        TicketCategory storage ticCategory = eventTicketCategories[eventID][category];
        uint256 Amount= ticCategory.price * quantity;
        uint256 Tax=Amount / 10;
        uint256 totalRefund= Amount - Tax;
        payable(msg.sender).transfer(totalRefund);
        tokenAdd.safeTransferFrom(msg.sender,events.Owner,category,quantity,"");
        // tokenAdd.burn(msg.sender,category,quantity);
    }

    // function get(uint256 eventID, string memory category)
    //     public
    //     view
    //     returns (uint256)
    // {
    //     TicketCategory storage ticCategory = eventTicketCategories[eventID][
    //         category
    //     ];
    //     uint256 price = ticCategory.price;
    //     return price;
    // }
}
