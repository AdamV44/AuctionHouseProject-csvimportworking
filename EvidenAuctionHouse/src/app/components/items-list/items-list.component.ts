import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ItemPreviewComponent } from '../item-preview/item-preview.component';
import { AuthenticationService } from '../../services/authentication.service';
import { AuctionItem } from '../../../models/auctionItem';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-items-list',
  imports: [NgFor, ItemPreviewComponent, NgIf, RouterLink],
  templateUrl: './items-list.component.html',
  styleUrl: './items-list.component.scss'
})
export class ItemsListComponent {

  constructor(public authenticationService: AuthenticationService) { 
  }

  ngOnInit() {
    if (!this.selectedItemsInput || this.selectedItemsInput.length == 0) {
      this.selectedItems = []
      this.displayItems = this.items
    }
    else {
      this.selectedItems = this.selectedItemsInput
      this.displayItems = [...this.items, ...this.selectedItemsInput]
    }
    
  }


  @Input()
  items: AuctionItem[]

  @Input()
  selectedItemsInput: AuctionItem[]


  @Output()
  selectedItemsEmitter = new EventEmitter<AuctionItem[]>();

  displayItems: AuctionItem[] = [];
  
  selectedItems: AuctionItem[] = [];

  onItemSelect(item: any): void {
    if (this.selectedItems.includes(item)) {
      this.selectedItems = this.selectedItems.filter(i => i !== item);
    } else {
      this.selectedItems.push(item);
    }
  
  this.selectedItemsEmitter.emit(this.selectedItems);
}


}
