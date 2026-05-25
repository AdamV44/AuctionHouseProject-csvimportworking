import { Component, ViewChild } from '@angular/core';
import { AuctionAddItemsComponent } from '../../components/auction-add-items/auction-add-items.component';
import { AuctionItem } from '../../../models/auctionItem';
import { NgIf, NgFor } from '@angular/common';
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
  imports: [AuctionAddItemsComponent, NgIf, NgFor, ConfirmationDialogComponent, FormsModule],
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
  loaded: boolean = true;
  dateError: string = '';

  public onAddItemsClick() {
    this.auctionItemspopupVisible = true;
  }

  public onAddedItems(selectedItems: AuctionItem[]) {
    this.selectedItemIds = selectedItems.map(item => item.id);
    this.auctionItemspopupVisible = false;
  }

  public removeSelectedItem(id: string) {
    this.selectedItemIds = this.selectedItemIds.filter(i => i !== id);
  }

  public promptCreateAuction() {
    if (!this.name || !this.startDate || !this.endDate) {
      console.error("Název a data jsou povinná.");
      return;
    }
    // Validate working days (Czech holidays + weekends)
    this.dateError = '';
    if (!this.isWorkingDay(this.startDate)) {
      this.dateError = 'Počáteční datum musí být pracovní den (není víkend ani svátek).';
      return;
    }

    if (!this.isWorkingDay(this.endDate)) {
      this.dateError = 'Koncové datum musí být pracovní den (není víkend ani svátek).';
      return;
    }

    if (this.endDate < this.startDate) {
      this.dateError = 'Koncové datum musí být po počátečním datu.';
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
    a.id = "";
    a.name = this.name;
    a.startDate = this.startDate;
    a.endDate = this.endDate;
    this.auctionsService.createAuction(a, this.selectedItemIds).subscribe({
      next: (result) => {
        console.log('Auction created', result);
        this.router.navigate(['/auctions']).then(() => this.utility.reloadPage());
      },
      error: (err) => {
        console.error('Failed to create auction', err);
        this.dateError = 'Chyba při vytváření aukce: ' + (err?.error?.message || err?.message || JSON.stringify(err));
      }
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

  // Returns true if the date is a working day in Czechia (Mon-Fri and not a public holiday)
  isWorkingDay(d: Date): boolean {
    if (!d) return false;
    const day = d.getDay();
    // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) return false;

    const y = d.getFullYear();
    const mmdd = (m: number, day: number) => `${m}-${day}`;

    // Fixed-date holidays (month-day)
    const fixed = new Set([
      mmdd(1,1),   // New Year
      mmdd(5,1),   // Labour Day
      mmdd(5,8),   // Liberation Day
      mmdd(7,5),   // Saints Cyril and Methodius
      mmdd(7,6),   // Jan Hus
      mmdd(9,28),  // Czech Statehood
      mmdd(10,28), // Independent Czechoslovak State Day
      mmdd(11,17), // Struggle for Freedom and Democracy
      mmdd(12,24), // Christmas Eve
      mmdd(12,25), // Christmas Day
      mmdd(12,26)  // Saint Stephen's Day
    ]);

    const dateKey = mmdd(d.getMonth()+1, d.getDate());
    if (fixed.has(dateKey)) return false;

    // Movable holidays: Easter Monday
    const easter = this.calculateEasterDate(y);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    if (this.sameDate(easterMonday, d)) return false;

    return true;
  }

  private sameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  // Meeus/Jones algorithm to compute Easter Sunday for year y (Gregorian)
  private calculateEasterDate(y: number): Date {
    const a = y % 19;
    const b = Math.floor(y / 100);
    const c = y % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }
}