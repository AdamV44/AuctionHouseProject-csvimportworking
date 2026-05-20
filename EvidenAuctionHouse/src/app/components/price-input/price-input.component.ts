import { Component, EventEmitter, Output, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UtilityService } from '../../services/utility.service';
import { BidsService } from '../../services/bids.service';
import { AuthenticationService } from '../../services/authentication.service';
import { catchError, of } from 'rxjs';
import { ConfirmationDialogComponent, ConfirmationResult } from '../confirmation-dialog/confirmation-dialog.component';
import { PriceInputDialogComponent, PriceInputResult } from '../price-input-dialog/price-input-dialog.component';

@Component({
  selector: 'app-price-input',
  standalone: true,
  imports: [ConfirmationDialogComponent, PriceInputDialogComponent, FormsModule],
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
  @Input() minimumBid: number = 1;

  @Output() bidSuccess = new EventEmitter<void>();

  @ViewChild('confirmationDialog') confirmationDialog: ConfirmationDialogComponent;

  // Stavy pro oba dialogy
  showPriceInputDialog: boolean = false;
  
  selectedBidAmount: number = 0;
  confirmationMessage: string = '';

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
      this.confirmationMessage = `Opravdu chcete přihodit ${this.selectedBidAmount} Kč? Nová cena bude ${this.itemPrice + this.selectedBidAmount} Kč.`;
      this.confirmationDialog.show();
    }
    // Pokud cancel, nic se neděje
  }

  // Krok 3: Zpracuj výsledek potvrzení
  onConfirmationResult(confirmed: boolean) {
    if (confirmed) {
      this.processBid();
    } else {
      // Reset hodnot
      this.selectedBidAmount = 0;
    }
    this.confirmationDialog.hide();
  }

  // Krok 4: Proveď bid
  private processBid(): void {
    const newTotalPrice = this.itemPrice + this.selectedBidAmount;
    console.log('Processing bid with values:', {
      auctionItemId: this.auctionItemId,
      bidAmount: this.selectedBidAmount,
      currentPrice: this.itemPrice,
      newTotalPrice: newTotalPrice
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
          } else {
            errorMessage += error.error.message || 'Neznámá chyba.';
          }
          alert(errorMessage);

        } else {
          alert('Došlo k neočekávané chybě. Zkuste to prosím znovu.');
        }
        
        return of(null); // Vrací null, aby se přerušil řetězec
      })
    )
    .subscribe(response => {
      if (response) {
        console.log('Bid successful:', response);
        alert('Příhoz byl úspěšně zaznamenán!');
        this.bidSuccess.emit(); // Emituje událost
      }
      // Reset hodnot
      this.selectedBidAmount = 0;
    });
  }

  get newTotalPrice(): number {
    return this.itemPrice + this.selectedBidAmount;
  }
}
