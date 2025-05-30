export class Bid {
    id: string;
    auctionItemId: string;
    userId: string;
    amountAdded: number;
    date: Date;

    constructor(
        id: string, 
        auctionItemId: string, 
        userId: string, 
        amountAdded: number,
        date: Date
    ) {
        this.id = id;
        this.auctionItemId = auctionItemId;
        this.userId = userId;
        this.amountAdded = amountAdded;
        this.date = date;
    }
}