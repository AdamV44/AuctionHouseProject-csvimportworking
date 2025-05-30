import { Component } from '@angular/core';
import { AuctionItem } from '../../../models/auctionItem';
import { ItemsService } from '../../services/items.service';
import { AuctionsService } from '../../services/auctions.service';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ListedItemPreviewListComponent } from '../../components/listed-item-preview-list/listed-item-preview-list.component';
import { Auction } from '../../../models/auction';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-auction-listed-items-page',
  imports: [ListedItemPreviewListComponent, NgIf],
  templateUrl: './auction-listed-items-page.component.html',
  styleUrl: './auction-listed-items-page.component.scss'
})
export class AuctionListedItemsPageComponent {

  listedItemsOnPage: AuctionItem[];
  auction: Auction;

  loaded: boolean = false;

  constructor(
    public itemsService: ItemsService, 
    public auctionsService: AuctionsService,
    public route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.reload()
  }

  public reload(): void {

    const auctionId: string = this.route.snapshot.params['id'];
    
    forkJoin({
      auction: this.auctionsService.getAuctionById(auctionId),
      items: this.auctionsService.getItemsForAuctionById(auctionId)
    }).subscribe(result => {
      this.auction = result.auction;
      this.listedItemsOnPage = result.items;
      this.loaded = true;
    })
    
  }
  
  
}
