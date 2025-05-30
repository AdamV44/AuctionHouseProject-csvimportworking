import { Bid } from './bid';

export class BidCreationDTO {
    Bid: Bid;
    ItemPerceivedPrice: number;
    
    constructor(bid: Bid, perceivedPrice: number) {
        this.Bid = bid;
        this.ItemPerceivedPrice = perceivedPrice;
    }
}