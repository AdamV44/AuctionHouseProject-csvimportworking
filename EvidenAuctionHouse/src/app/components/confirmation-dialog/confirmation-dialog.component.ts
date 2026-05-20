import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

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
  @Input() title: string = 'Potvrzení akce';
  @Input() message: string = 'Opravdu chcete provést tuto akci?';
  @Input() confirmText: string = 'Potvrdit';
  @Input() cancelText: string = 'Zrušit';
  @Input() confirmButtonClass: string = 'btn-danger'; // 'btn-primary', 'btn-danger', 'btn-warning'
  @Input() showIcon: boolean = true;
  @Input() iconType: 'warning' | 'question' | 'danger' = 'warning';

  @Output() confirmed = new EventEmitter<boolean>();

  public isVisible: boolean = false;

  show() {
    this.isVisible = true;
  }

  hide() {
    this.isVisible = false;
  }

  onCancel(): void {
    this.hide();
    this.confirmed.emit(false);
  }

  onConfirm(): void {
    this.hide();
    this.confirmed.emit(true);
  }

  onOverlayClick(event: MouseEvent): void {
    // Check if the click is on the overlay itself, not the dialog content
    if ((event.target as HTMLElement).classList.contains('confirmation-overlay')) {
      this.onCancel();
    }
  }
}