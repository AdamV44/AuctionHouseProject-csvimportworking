import { Component, Input } from '@angular/core';
import { AuctionItem } from '../../../models/auctionItem';
import { ItemsService } from '../../services/items.service';
import { OnInit } from '@angular/core';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { BidsService } from '../../services/bids.service';
import { UserService } from '../../services/user.service';
import { UtilityService } from '../../services/utility.service';
import { PriceInputComponent } from '../price-input/price-input.component';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-listed-item-preview',
  imports: [PriceInputComponent, RouterLink, NgIf],
  templateUrl: './listed-item-preview.component.html',
  styleUrl: './listed-item-preview.component.scss'
})
export class ListedItemPreviewComponent implements OnInit {

  constructor(
    public itemsService: ItemsService, 
    public bidsService: BidsService, 
    public usersService: UserService,
    public stringHelper: UtilityService,
    public router: Router
  ) {
    
  }
  
  ngOnInit() {
    this.refresh()
  }

  loaded: boolean = false

  @Input()
  item: AuctionItem

  itemPrice: number
  highestBidderName: string = "loading"

  public refresh(): void {
    if (!this.item) {
      return
    }
    forkJoin({
      price: this.itemsService.getItemPrice(this.item.id),
      highestBidder: this.bidsService.getLatestBidderForItem(this.item.id).pipe(
        catchError(err => {
          return of();
        })
      )
    })
    .subscribe(result => {
      this.itemPrice = result.price;
      if (!result.highestBidder) {
        this.highestBidderName = 'Žádný příhoz';
      }
      else {
        this.highestBidderName = result.highestBidder.name
      }
      this.loaded = true; 
    });  
  }

  // Nová metoda pro zpracování výsledku příhozu
  onBidResult(bidAmount: number): void {
    console.log(`Příhoz ${bidAmount} byl úspěšně uložen pro položku ${this.item.id}`);
    
    // Po úspěšném příhozu obnovit data komponenty
    this.refresh();
  }

  onPriceInputClick(event: MouseEvent) {
    event.stopPropagation();
    // zde proveď akci pro price input, např. otevři popup
  }
}
