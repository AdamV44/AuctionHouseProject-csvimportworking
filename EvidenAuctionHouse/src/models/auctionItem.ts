export class AuctionItem {
    id: string;
    name: string;
    picturesPaths: string[];
    auctionId: string;
    startingPrice: number;
    additionalParameters?: string;
    state?: string;

    constructor(
        id: string, 
        name: string, 
        startingPrice: number,
        additionalParameters?: string,
        auctionId: string = ""
    ) {
        this.id = id;
        this.name = name;
        this.startingPrice = startingPrice;
        this.additionalParameters = additionalParameters;
        this.auctionId = auctionId;
    this.state = "new";
    }
}