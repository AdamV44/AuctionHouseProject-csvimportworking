import { Component, Input, input } from '@angular/core';
import { AuctionItem } from '../../../models/auctionItem';
import { OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ItemsService } from '../../services/items.service';
import { forkJoin, of, switchMap } from 'rxjs';
import { CommonModule, CurrencyPipe, KeyValuePipe, NgFor, NgIf } from '@angular/common';
import { PriceInputComponent } from '../../components/price-input/price-input.component';
import { BidsService } from '../../services/bids.service';
import { UserService } from '../../services/user.service';
import { FileService } from '../../services/file.service';
@Component({
  selector: 'app-item-detail-page',
  imports: [NgFor, KeyValuePipe, NgIf, PriceInputComponent, CurrencyPipe, CommonModule],
  templateUrl: './item-detail-page.component.html',
  styleUrl: './item-detail-page.component.scss'
})
export class ItemDetailPageComponent {

  item: AuctionItem
  itemPrice: number
  highestBidderName: string
  imgsUrls: string[] = []
  bids: Array<{ bidderInitial: string; amount: number }> = []
  constructor(
    public route: ActivatedRoute,
    public itemsService: ItemsService,
    public bidsService: BidsService,
    public userService: UserService,
    public fileService: FileService,
  ) {

  }
  ngOnInit() {
    this.refresh();

    
  }
  loaded: boolean = false

  public refresh(): void {
    const itemId = this.route.snapshot.params['id'];

    forkJoin({
      item: this.itemsService.getItemById(itemId),
      price: this.itemsService.getItemPrice(itemId),
      highestBidder: this.bidsService.getLatestBidderForItem(itemId),
      pictures: this.fileService.getItemPictures(itemId),
      allBids: this.bidsService.getBidsForItem(itemId)
    
    }).subscribe(result => {
      this.item = this.itemsService.parseAuctionItem(result.item);
      this.itemPrice = result.price;
      this.highestBidderName = result.highestBidder ? result.highestBidder.name : "Žádný příhoz";
      this.imgsUrls = result.pictures.map(img => `data:${img.contentType};base64,${img.base64Data}`)
      
      // Process bids - get first letter of bidder name and amount
      if (result.allBids && Array.isArray(result.allBids)) {
        this.bids = result.allBids.map((bid: any) => ({
          bidderInitial: bid.bidderName ? bid.bidderName.charAt(0).toUpperCase() : '?',
          amount: bid.amount || 0
        }));
      }
      
      this.loaded = true;

    })
}

  currentImageIndex = 0;

  prevImage() {
    if (this.item && this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage() {
    if (this.item) {
      this.currentImageIndex = (this.currentImageIndex + 1)% this.imgsUrls.length;
    }
    console.log(this.item);
    
  }

  
}
