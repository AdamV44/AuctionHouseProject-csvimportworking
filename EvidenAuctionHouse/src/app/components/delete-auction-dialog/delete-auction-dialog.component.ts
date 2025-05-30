import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogComponent, ConfirmationResult } from '../confirmation-dialog/confirmation-dialog.component';

export interface DeleteAuctionResult {
  action: 'confirm' | 'cancel';
  auctionId?: string;
}

@Component({
  selector: 'app-delete-auction-dialog',
  standalone: true,
  imports: [CommonModule, ConfirmationDialogComponent],
  template: `
    <!-- Preview Dialog -->
    <div 
      *ngIf="isVisible" 
      class="delete-overlay"
      (click)="onCancel()">
      
      <div class="delete-dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <div class="header-content">
            <div class="dialog-icon">
              <i class="fas fa-gavel text-warning"></i>
            </div>
            <h3 class="dialog-title">Smazat aukci</h3>
          </div>
          <button class="close-btn" (click)="onCancel()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="dialog-body">
          <div class="auction-preview">
            <div class="auction-icon">
              <i class="fas fa-gavel"></i>
            </div>
            <div class="auction-details">
              <h4 class="auction-name">{{ auctionName }}</h4>
              <p class="auction-id">ID: {{ auctionId }}</p>
              <p class="auction-dates">
                <strong>Datum:</strong> {{ auctionStartDate | date:'dd.MM.yyyy' }} - {{ auctionEndDate | date:'dd.MM.yyyy' }}
              </p>
            </div>
          </div>
          
          <div class="warning-message">
            <div class="warning-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="warning-text">
              <strong>Varování:</strong> Tato akce je nevratná. 
              Aukce a všechny související příhozy budou trvale smazány.
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button 
            class="btn btn-secondary" 
            (click)="onCancel()">
            <i class="fas fa-arrow-left"></i>
            Zrušit
          </button>
          
          <button 
            class="btn btn-danger"
            (click)="onConfirm()">
            <i class="fas fa-trash-alt"></i>
            Smazat aukci
          </button>
        </div>
      </div>
    </div>

    <!-- Final Confirmation Dialog -->
    <app-confirmation-dialog
        [isVisible]="showConfirmation"
        [title]="'Potvrzení smazání aukce'"
        [message]="confirmationMessage"
        [confirmText]="'Ano, smazat definitívně'"
        [cancelText]="'Ne, zrušit'"
        [confirmButtonClass]="'btn-danger'"
        [iconType]="'danger'"
        (result)="onConfirmationResult($event)">
    </app-confirmation-dialog>
  `,
  styleUrls: ['../delete-item-dialog/delete-item-dialog.component.scss'] // Použije stejné styly
})
export class DeleteAuctionDialogComponent {
  @Input() isVisible: boolean = false;
  @Input() auctionName: string = '';
  @Input() auctionId: string = '';
  @Input() auctionStartDate: string = '';
  @Input() auctionEndDate: string = '';

  @Output() result = new EventEmitter<DeleteAuctionResult>();

  showConfirmation: boolean = false;

  onConfirm(): void {
    this.showConfirmation = true;
  }

  onCancel(): void {
    this.result.emit({ action: 'cancel' });
    this.close();
  }

  onConfirmationResult(result: ConfirmationResult): void {
    this.showConfirmation = false;
    if (result === ConfirmationResult.CONFIRM) {
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