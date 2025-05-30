import { Component } from '@angular/core';
import { AuctionItem } from '../../../models/auctionItem';
import { Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ListedItemPreviewComponent } from '../listed-item-preview/listed-item-preview.component';

@Component({
  selector: 'app-listed-item-preview-list',
  imports: [NgFor, ListedItemPreviewComponent, NgIf],
  templateUrl: './listed-item-preview-list.component.html',
  styleUrl: './listed-item-preview-list.component.scss'
})
export class ListedItemPreviewListComponent {

  @Input()
  listedItems: AuctionItem[] = [];





}
