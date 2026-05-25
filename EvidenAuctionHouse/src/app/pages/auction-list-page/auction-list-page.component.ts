import { Component } from '@angular/core';
import { AuctionTableComponent } from '../../components/auction-table/auction-table.component';
import { AuctionsService } from '../../services/auctions.service';
import { Auction } from '../../../models/auction';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-auction-list-page',
  imports: [AuctionTableComponent, NgIf, RouterLink],
  templateUrl: './auction-list-page.component.html',
  styleUrl: './auction-list-page.component.scss'
})
export class AuctionListPageComponent {

  constructor(
    public auctionsService: AuctionsService, 
    public router: Router,
    public authService: AuthenticationService
  ) {
      this.reload()
    }

  loaded: boolean = false
  
  auctionPreviewsOnPage: Auction[];
  

  public reload() {
    if (this.authService.isAdmin()) {
        // Admin should see only active auctions here; finished auctions are in reports
        this.auctionsService.getActiveAuctions().subscribe(data => {
          this.auctionPreviewsOnPage = data;
          this.loaded = true;
        })
    }
    else {
      this.auctionsService.getActiveAuctions().subscribe(data => {
        this.auctionPreviewsOnPage = data;
        this.loaded = true;
      })
    }
  }
}
