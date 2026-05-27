import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { AuctionsService } from '../../services/auctions.service';
import { UtilityService } from '../../services/utility.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeleteAuctionDialogComponent, DeleteAuctionResult } from '../delete-auction-dialog/delete-auction-dialog.component';

@Component({
  selector: 'app-auction-preview',
  standalone: true,
  imports: [CommonModule, RouterLink, DeleteAuctionDialogComponent],
  templateUrl: './auction-preview.component.html',
  styleUrls: ['./auction-preview.component.scss']
})
export class AuctionPreviewComponent {
  @Input() auction: any;

  // Pro delete dialog
  showDeleteDialog: boolean = false;

  constructor(
    private router: Router,
    public authService: AuthenticationService,
    private auctionsService: AuctionsService,
    private utility: UtilityService
  ) {}

  onEditClicked(): void {
    this.router.navigate(["create-auction", this.auction.id]);
  }

  onDeleteClicked(): void {
    // Místo přímého mazání otevřeme dialog
    this.showDeleteDialog = true;
  }

  onDeleteResult(result: DeleteAuctionResult): void {
    this.showDeleteDialog = false;
    
    if (result.action === 'confirm') {
      console.log(' Mazání aukce potvrzeno:', this.auction.name);
      // Zde použijeme existující funkční mazání
      this.performActualDelete();
    } else {
      console.log(' Mazání aukce zrušeno');
    }
  }

  // Existující funkční mazání přesunuto do separátní metody
  private performActualDelete(): void {
    console.log('Mazání aukce:', this.auction.name);
    this.auctionsService.removeAuction(this.auction.id).subscribe((result) => {
      console.log('Aukce smazána:', result);
      this.utility.reloadPage();
    });
  }
}