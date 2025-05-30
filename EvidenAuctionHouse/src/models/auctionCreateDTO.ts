import { Auction } from "./auction";

export class AuctionCreateDTO {
    auction: Auction;
    auctionItemsIds: string[];
    constructor(auction: Auction, auctionItemsIds: string[]) {
        this.auction = auction;
        this.auctionItemsIds = auctionItemsIds;
    }
}