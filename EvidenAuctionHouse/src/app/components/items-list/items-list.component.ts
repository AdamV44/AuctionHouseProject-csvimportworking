import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ItemPreviewComponent } from '../item-preview/item-preview.component';
import { AuthenticationService } from '../../services/authentication.service';
import { AuctionItem } from '../../../models/auctionItem';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-items-list',
  standalone: true,
  imports: [NgFor, ItemPreviewComponent, NgIf, RouterLink],
  templateUrl: './items-list.component.html',
  styleUrl: './items-list.component.scss'
})
export class ItemsListComponent {
  constructor(public authenticationService: AuthenticationService) {}

  @Input() items: AuctionItem[];
  @Input() selectedItemsInput: AuctionItem[];
  @Input() allowSelection: boolean = false;
  @Output() selectedItemsEmitter = new EventEmitter<AuctionItem[]>();

  displayItems: AuctionItem[] = [];
  selectedItems: AuctionItem[] = [];

  ngOnInit() {
    // Initialize selectedItems from input and merge displayItems ensuring uniqueness by id
    this.selectedItems = this.selectedItemsInput ? [...this.selectedItemsInput] : [];

    const map = new Map<string, AuctionItem>();
    if (this.items) {
      for (const it of this.items) {
        if (it && it.id) map.set(it.id, it);
      }
    }
    if (this.selectedItems) {
      for (const it of this.selectedItems) {
        if (it && it.id && !map.has(it.id)) map.set(it.id, it);
      }
    }
    this.displayItems = Array.from(map.values());
  }

  onItemSelect(item: AuctionItem): void {
    const existsIndex = this.selectedItems.findIndex(i => i.id === item.id);
    if (existsIndex !== -1) {
      this.selectedItems.splice(existsIndex, 1);
    } else {
      this.selectedItems.push(item);
    }
    this.selectedItemsEmitter.emit([...this.selectedItems]);
  }

  isSelected(item: AuctionItem): boolean {
    if (!item) return false;
    return this.selectedItems.some(i => i.id === item.id);
  }

  // Row click selects/deselects an item. Prevents navigation if click originates from a link/button.
  onRowClick(event: MouseEvent, item: AuctionItem): void {
    const target = event.target as HTMLElement;
    // If click was on an anchor or button, allow default (navigation) behavior
    if (target.closest('a') || target.closest('button') || target.closest('input')) {
      return;
    }
    event.stopPropagation();
    this.onItemSelect(item);
  }
}