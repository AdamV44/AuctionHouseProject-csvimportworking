import { NgIf } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UtilityService } from '../../services/utility.service';
import { BidsService } from '../../services/bids.service';
import { AuthenticationService } from '../../services/authentication.service';
import { catchError, of } from 'rxjs';
import { ConfirmationDialogComponent, ConfirmationResult } from '../confirmation-dialog/confirmation-dialog.component';
import { PriceInputDialogComponent, PriceInputResult } from '../price-input-dialog/price-input-dialog.component';

@Component({
  selector: 'app-price-input',
  imports: [NgIf, ConfirmationDialogComponent, PriceInputDialogComponent, FormsModule],
  templateUrl: './price-input.component.html',
  styleUrl: './price-input.component.scss'
})
export class PriceInputComponent {
  constructor(
    private utility: UtilityService, 
    private bidsService: BidsService,
    private authService: AuthenticationService
  ) {}  
  
  @Input() auctionItemId: string
  @Input() itemPrice: number
  @Input() startingPrice: number

  @Output() result = new EventEmitter<number>();

  // Stavy pro oba dialogy
  showPriceInputDialog: boolean = false;  // ✅ Pro první dialog
  showConfirmationDialog: boolean = false; // ✅ Pro druhý dialog
  
  selectedBidAmount: number = 0;

  // Krok 1: Zobraz dialog pro zadání ceny
  public showPopup() {
    console.log('Opening price input dialog...');
    
    if (!this.auctionItemId) {
      console.error("no auctionItemId specified");
      alert('Chyba: Není specifikováno ID položky.');
      return;
    }
    
    // Zobraz první dialog - zadání ceny
    this.showPriceInputDialog = true;   
  }

  // Krok 2: Zpracuj výsledek zadání ceny
  onPriceInputResult(result: PriceInputResult) {
    console.log('Price input result:', result);
    this.showPriceInputDialog = false;
    
    if (result.action === 'confirm' && result.value) {
      // Uložíme zadanou částku a zobrazíme konfirmační dialog
      this.selectedBidAmount = result.value;
      console.log('Proceeding to confirmation with amount:', this.selectedBidAmount);
      this.showConfirmationDialog = true;
    }
    // Pokud cancel, nic se neděje
  }

  // Krok 3: Zpracuj výsledek potvrzení
  onConfirmationResult(result: ConfirmationResult) {
    console.log('Confirmation result:', result);
    this.showConfirmationDialog = false;
    
    if (result === ConfirmationResult.CONFIRM) {
      console.log('User confirmed - proceeding with bid...');
      this.processBid();
    } else {
      console.log('User cancelled bid');
      // Reset hodnot
      this.selectedBidAmount = 0;
    }
  }

  // Krok 4: Proveď bid
  private processBid(): void {
    console.log('Processing bid with values:', {
      auctionItemId: this.auctionItemId,
      bidAmount: this.selectedBidAmount, // Pouze příhoz
      currentPrice: this.itemPrice,
      newTotalPrice: this.newTotalPrice
    });

    // Backend očekává příhoz, ne celkovou cenu
    this.bidsService.createBid(this.auctionItemId, this.selectedBidAmount, this.itemPrice)
    .pipe(
      catchError(error => {
        console.error('Bid error:', error);
        
        if (error.status === 409) {
          alert('Cena položky se mezitím změnila. Stránka bude obnovena pro zobrazení aktuální ceny.');
          this.utility.reloadPage();
        } else if (error.status === 400) {
          let errorMessage = 'Chyba při přihazování:\n';
          
          if (error.error?.errors) {
            Object.keys(error.error.errors).forEach(key => {
              errorMessage += `${key}: ${error.error.errors[key].join(', ')}\n`;
            });
          } else if (error.error) {
            errorMessage += error.error;
          } else {
            errorMessage += 'Neplatný příhoz';
          }
          
          alert(errorMessage);
        } else {
          alert('Nastala chyba při přihazování. Zkuste to znovu.');
        }
        return of(null);
      })
    )
    .subscribe(result => {
      if (result) {
        console.log('Bid successful:', result);
        this.result.emit(this.selectedBidAmount);
        this.utility.reloadPage();
      }
    });
  }

  get minimumBid(): number {
    // Minimální příhoz (ne celková cena!)
    return 50; // Např. minimální příhoz 50 Kč
  }

  get newTotalPrice(): number {
    // Vypočítej novou celkovou cenu
    return this.itemPrice + this.selectedBidAmount;
  }

  get confirmationMessage(): string {
    return `Opravdu chcete přihodit ${this.selectedBidAmount} Kč?

Aktuální cena: ${this.itemPrice} Kč
Váš příhoz: +${this.selectedBidAmount} Kč
Nová celková cena: ${this.newTotalPrice} Kč`;
  }
}
