import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

export interface DeleteAuctionResult {
  action: 'confirm' | 'cancel';
  auctionId?: string;
}

@Component({
  selector: 'app-delete-auction-dialog',
  standalone: true,
  imports: [CommonModule, ConfirmationDialogComponent],
  templateUrl: './delete-auction-dialog.component.html',
  styleUrls: ['./delete-auction-dialog.component.scss']
})
export class DeleteAuctionDialogComponent {
  @Input() isVisible: boolean = false;
  @Input() auctionName: string = '';
  @Input() auctionId: string = '';
  @Input() auctionStartDate: string = '';
  @Input() auctionEndDate: string = '';

  @Output() result = new EventEmitter<DeleteAuctionResult>();

  @ViewChild('confirmationDialog') confirmationDialog?: ConfirmationDialogComponent;

  onConfirm(): void {
    this.confirmationDialog?.show();
  }

  onCancel(): void {
    this.result.emit({ action: 'cancel' });
    this.close();
  }

  // accept either a boolean or an Event payload and normalize it
  onConfirmationResult(confirmed: boolean | Event): void {
    let isConfirmed = false;
    if (typeof confirmed === 'boolean') {
      isConfirmed = confirmed;
    } else if (confirmed && typeof (confirmed as any).detail === 'boolean') {
      isConfirmed = (confirmed as any).detail;
    }

    if (isConfirmed) {
      this.result.emit({ action: 'confirm', auctionId: this.auctionId });
      this.close();
    }
  }

  private close(): void {
    this.isVisible = false;
  }

  get confirmationMessage(): string {
    return `Opravdu chcete smazat aukci "${this.auctionName}"? Tato akce je nevratná a smaže všechny související příhozy.`;
  }
}