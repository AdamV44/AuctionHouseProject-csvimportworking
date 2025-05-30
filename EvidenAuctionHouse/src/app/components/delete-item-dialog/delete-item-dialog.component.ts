import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogComponent, ConfirmationResult } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-delete-item-dialog',
  standalone: true,
  imports: [CommonModule, ConfirmationDialogComponent], // Add ConfirmationDialogComponent here
  templateUrl: './delete-item-dialog.component.html',
  styleUrl: './delete-item-dialog.component.scss'
})
export class DeleteItemDialogComponent {
  @Input() isVisible: boolean = false;
  @Input() itemName: string = '';
  @Input() itemId: string = '';
  @Input() itemType: 'auction' | 'item' | 'user' = 'item';
  @Input() isMultiple: boolean = false;

  @Output() result = new EventEmitter<{ action: 'confirm' | 'cancel', itemId?: string }>();

  // Add missing properties
  showConfirmation: boolean = false;

  onConfirm(): void {
    console.log('🔥 CONFIRM clicked in dialog');
    this.result.emit({ action: 'confirm', itemId: this.itemId });
  }

  onCancel(): void {
    console.log('🚫 CANCEL clicked in dialog');
    this.result.emit({ action: 'cancel' });
  }

  // Add missing method for confirmation dialog
  onConfirmationResult(result: ConfirmationResult): void {
    this.showConfirmation = false;
    if (result === ConfirmationResult.CONFIRM) {
      this.onConfirm();
    }
  }

  // Add missing getter for confirmation message
  get confirmationMessage(): string {
    if (this.isMultiple) {
      return `Opravdu chcete smazat ${this.itemName}? Tato akce je nevratná.`;
    }
    return `Opravdu chcete smazat položku "${this.itemName}"? Tato akce je nevratná.`;
  }

  get confirmationTitle(): string {
    if (this.isMultiple) {
      return `Smazat ${this.itemName}`;
    }
    switch (this.itemType) {
      case 'auction': return 'Smazat aukci';
      case 'user': return 'Smazat uživatele';
      default: return 'Smazat položku';
    }
  }

  get dangerIcon(): string {
    return 'fas fa-exclamation-triangle text-danger';
  }
}