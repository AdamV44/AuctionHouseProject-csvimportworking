import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PriceInputResult {
  action: 'confirm' | 'cancel';
  value?: number;
}

@Component({
  selector: 'app-price-input-dialog', // Změna názvu selektoru
  standalone: true,
  imports: [NgIf, FormsModule], // Odstraněny problematické importy
  templateUrl: './price-input-dialog.component.html',
  styleUrl: './price-input-dialog.component.scss'
})
export class PriceInputDialogComponent { // Změna názvu komponenty
  @Input() isVisible: boolean = false;
  @Input() title: string = 'Zadejte částku příhozu';
  @Input() currentPrice: number = 0;
  @Input() minimumBid: number = 0;

  @Output() result = new EventEmitter<PriceInputResult>();

  inputValue: number = 0;
  errorMessage: string = '';

  onConfirm(): void {
    // Validace
    if (!this.inputValue || this.inputValue <= 0) {
      this.errorMessage = 'Zadejte platnou částku';
      return;
    }

    if (this.inputValue < this.minimumBid) {
      this.errorMessage = `Minimální příhoz je ${this.minimumBid} Kč`;
      return;
    }

    // Pokud validace prošla
    this.errorMessage = '';
    this.result.emit({ action: 'confirm', value: this.inputValue });
    this.close();
  }

  onCancel(): void {
    this.result.emit({ action: 'cancel' });
    this.close();
  }

  private close(): void {
    this.isVisible = false;
    this.inputValue = 0;
    this.errorMessage = '';
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    } else if (event.key === 'Enter') {
      this.onConfirm();
    }
  }
}