import { Component, EventEmitter, Output } from '@angular/core';
import { confirmationResult } from '../../../models/confirmationResult';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss'
})
export class ConfirmationComponent {
  @Output() result = new EventEmitter<confirmationResult>();

  onCancel() {
    this.result.emit(confirmationResult.Cancel);
  }
  onConfirm() {
    this.result.emit(confirmationResult.OK);
  }
}