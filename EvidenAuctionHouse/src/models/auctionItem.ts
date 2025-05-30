export class AuctionItem {
    id: string;
    name: string;
    picturesPaths: string[];
    itemGroupId: string;
    auctionId: string;
    startingPrice: number;
    additionalParams: Map<string, string>;

    constructor(
        id: string, 
        name: string, 
        itemGroupId: string,
        startingPrice: number,
        additionalParams: Map<string, string>,
        auctionId: string = ""
    ) {
        this.id = id;
        this.name = name;
        this.startingPrice = startingPrice;
        this.additionalParams = additionalParams;
        this.itemGroupId = itemGroupId;
        this.auctionId = auctionId;
    }
}