export interface Contract {
    Id: string;
    AuctionId: string;
    ItemId: string;
    WinnerUserId: string;
    Price: number;
    Currency: string;
    PdfPath: string;
    SignedPdfPath: string;
    SignatureMethod: string;
    SignatureMetadata: string;
    Status: string;
    GeneratedBy: string;
    TemplateVersion: string;
    CreatedAt: Date;
    Audit: string;
}
