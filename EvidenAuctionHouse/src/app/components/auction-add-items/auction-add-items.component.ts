import { Component, Output, EventEmitter, Input } from '@angular/core';
import { ItemsListComponent } from "../items-list/items-list.component";
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { AuctionItem } from '../../../models/auctionItem';
import { confirmationResult } from '../../../models/confirmationResult';
import { ItemsService } from '../../services/items.service';
import { NgIf } from '@angular/common';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AuctionsService } from '../../services/auctions.service';

@Component({
  selector: 'app-auction-add-items',
  standalone: true,
  templateUrl: './auction-add-items.component.html',
  styleUrl: './auction-add-items.component.scss',
  imports: [ItemsListComponent, ItemsListComponent, ConfirmationComponent, NgIf]
})
export class AuctionAddItemsComponent {

  

  @Input()
  auctionId: string
  
  @Output() itemsSelected = new EventEmitter<AuctionItem[]>();


  selectableItems: AuctionItem[] = []

  selectedItems: AuctionItem[] = []

  loaded: boolean = false


  constructor(public itmesService: ItemsService, private auctionsService: AuctionsService) {
  
  }

  ngOnInit() {

    console.log("reloading");
    
    
    
    forkJoin({
      auctionItems: this.auctionsService.getItemsForAuctionById(this.auctionId).pipe(
        catchError(err => {
          console.log("Error loading auction items", err);

          return of([])
        })
      ),
      selectableItems: this.itmesService.getUnlistedItems()
    })
    .subscribe(result => {
      this.selectedItems = result.auctionItems;
      this.selectableItems = result.selectableItems;
      this.loaded = true;
      
    })



  }

  onConfirmation(result: confirmationResult) {
  if (result == confirmationResult.OK) {
    this.itemsSelected.emit(this.selectedItems);
  }
  else if (result == confirmationResult.Cancel) {
    this.itemsSelected.emit([]);
  }
}

  getSelected(selectedItems: AuctionItem[]) {
    this.selectedItems = selectedItems
    
  }


}