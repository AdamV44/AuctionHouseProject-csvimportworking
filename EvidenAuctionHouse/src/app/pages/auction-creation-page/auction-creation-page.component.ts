import { Component, ViewChild } from '@angular/core';
import { AuctionAddItemsComponent } from '../../components/auction-add-items/auction-add-items.component';
import { AuctionItem } from '../../../models/auctionItem';
import { NgIf } from '@angular/common';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { AuctionsService } from '../../services/auctions.service';
import { Auction } from '../../../models/auction';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilityService } from '../../services/utility.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-auction-creation-page',
  standalone: true,
  imports: [AuctionAddItemsComponent, NgIf, ConfirmationDialogComponent, FormsModule],
  templateUrl: './auction-creation-page.component.html',
  styleUrl: './auction-creation-page.component.scss'
})
export class AuctionCreationPageComponent {

  @ViewChild(ConfirmationDialogComponent) confirmation: ConfirmationDialogComponent;

  constructor(
    private auctionsService: AuctionsService,
    private router: Router,
    private route: ActivatedRoute,
    private utility: UtilityService
  ) {
    this.reload();
  }

  auctionItemspopupVisible: boolean = false;
  auctionId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  selectedItemIds: string[] = [];

  public onAddItemsClick() {
    this.auctionItemspopupVisible = true;
  }

  public onAddedItems(selectedItems: AuctionItem[]) {
    this.selectedItemIds = selectedItems.map(item => item.id);
    this.auctionItemspopupVisible = false;
  }

  public promptCreateAuction() {
    if (!this.name || !this.startDate || !this.endDate) {
      console.error("Název a data jsou povinná.");
      return;
    }
    this.confirmation.show();
  }

  public onConfirmation(confirmed: boolean) {
    if (confirmed) {
      this.route.snapshot.params['id']
        ? this.updateAuction(this.route.snapshot.params['id'])
        : this.createAuction();
    }
    this.router.navigate(['/auctions']).then(() => {
      this.utility.reloadPage();
    });
  }

  private createAuction() {
    let a: Auction = new Auction();
    a.id = "0";
    a.name = this.name;
    a.startDate = this.startDate;
    a.endDate = this.endDate;

    this.auctionsService.createAuction(a, this.selectedItemIds).subscribe(result => {
      console.log(result);
      this.router.navigate(['/auctions']);
      this.utility.reloadPage();
    });
  }

  private updateAuction(auctionId: string) {
    let a: Auction = new Auction();
    a.id = auctionId;
    a.name = this.name;
    a.startDate = this.startDate;
    a.endDate = this.endDate;

    this.auctionsService.editAuction(a, this.selectedItemIds, auctionId).subscribe(result => {
      console.log(result);
    });
  }

  public reload() {
    this.auctionId = this.route.snapshot.params['id'];
    if (!this.auctionId) return;

    forkJoin({
      auctionItems: this.auctionsService.getItemsForAuctionById(this.auctionId),
      auction: this.auctionsService.getAuctionById(this.auctionId)
    }).subscribe(({ auctionItems, auction }) => {
      this.selectedItemIds = auctionItems.map(item => item.id);
      this.name = auction.name;
      this.startDate = new Date(auction.startDate);
      this.endDate = new Date(auction.endDate);
    });
  }

  get startDateString(): string {
    return this.startDate ? this.formatDateTimeLocal(this.startDate) : '';
  }
  set startDateString(val: string) {
    this.startDate = val ? new Date(val) : this.startDate;
  }

  get endDateString(): string {
    return this.endDate ? this.formatDateTimeLocal(this.endDate) : '';
  }
  set endDateString(val: string) {
    this.endDate = val ? new Date(val) : this.endDate;
  }

  private formatDateTimeLocal(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}