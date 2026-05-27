export interface AuctionItemOptions {
    id: string;
    name: string;
    startingPrice: number;
    additionalParameters?: string;
    auctionId?: string;
    serialNumber?: string;
    picturesPaths?: string[];
    state?: string;
}

export class AuctionItem {
    id: string;
    name: string;
    picturesPaths: string[] = [];
    auctionId: string = "";
    startingPrice: number;
    additionalParameters?: string;
    state?: string = "new";
    serialNumber?: string;

    constructor(opts: AuctionItemOptions) {
        this.id = opts.id;
        this.name = opts.name;
        this.startingPrice = opts.startingPrice;
        this.additionalParameters = opts.additionalParameters;
        this.auctionId = opts.auctionId ?? "";
        this.serialNumber = opts.serialNumber ?? "";
        this.picturesPaths = opts.picturesPaths ?? [];
        this.state = opts.state ?? "new";
    }
}