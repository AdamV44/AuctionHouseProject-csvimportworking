import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';

export enum ConfirmationResult {
  CONFIRM = 'confirm',
  CANCEL = 'cancel'
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  // Komponenta se zobrazí pouze když isVisible = true
  @Input() isVisible: boolean = false;
  @Input() title: string = 'Potvrzení akce';
  @Input() message: string = 'Opravdu chcete provést tuto akci?';
  @Input() confirmText: string = 'Potvrdit';
  @Input() cancelText: string = 'Zrušit';
  @Input() confirmButtonClass: string = 'btn-danger'; // 'btn-primary', 'btn-danger', 'btn-warning'
  @Input() showIcon: boolean = true;
  @Input() iconType: 'warning' | 'question' | 'danger' = 'warning';

  @Output() result = new EventEmitter<ConfirmationResult>();

  onCancel(): void {
    console.log('ConfirmationDialog: User clicked CANCEL');
    this.result.emit(ConfirmationResult.CANCEL); // Pošle "cancel"
    this.close(); // Skryje dialog
  }

  onConfirm(): void {
    console.log('ConfirmationDialog: User clicked CONFIRM');
    this.result.emit(ConfirmationResult.CONFIRM); // Pošle "confirm" 
    this.close(); // Skryje dialog
  }

  private close(): void {
    console.log('ConfirmationDialog: Closing dialog');
    this.isVisible = false;
  }

  // Zavřít při kliknutí na overlay
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      // Kliknutí na pozadí (ne na dialog)
      this.onCancel();
    }
  }

  // Zavřít při stisknutí Escape
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  // Použití:
  showDialog() {
    this.isVisible = true; // Dialog se zobrazí
  }
}