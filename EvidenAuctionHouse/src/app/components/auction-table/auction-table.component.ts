import { Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';
import { AuctionPreviewComponent } from '../auction-preview/auction-preview.component';
import { Auction } from '../../../models/auction';

@Component({
  selector: 'app-auction-table',
  imports: [NgFor, AuctionPreviewComponent],
  templateUrl: './auction-table.component.html',
  styleUrl: './auction-table.component.scss'
})
export class AuctionTableComponent {
  @Input()
  auctionPreviews: Auction[];
}
