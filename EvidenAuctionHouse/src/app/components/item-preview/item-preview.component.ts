import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuctionItem } from '../../../models/auctionItem';
import { ItemsService } from '../../services/items.service';
import { UtilityService } from '../../services/utility.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-item-preview',
  imports: [NgIf],
  templateUrl: './item-preview.component.html',
  styleUrl: './item-preview.component.scss'
})
export class ItemPreviewComponent {
  constructor(
    public itemsService: ItemsService,
    public utility: UtilityService,
    private router: Router
  ) {

  }

  @Input()
  item: AuctionItem


}
