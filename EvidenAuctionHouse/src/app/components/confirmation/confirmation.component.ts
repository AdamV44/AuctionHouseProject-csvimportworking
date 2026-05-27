import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { confirmationResult } from '../../../models/confirmationResult';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor],
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationComponent {
  @Output() result = new EventEmitter<confirmationResult>();
  @Input() title?: string;
  @Input() message?: string;
  // optional list of preview image URLs (object URLs or data URIs)
  @Input() previewUrls?: string[];
  @Input() errors?: string[];
  // When true, render inline without the fixed backdrop so underlying UI remains interactive.
  @Input() noBackdrop: boolean = false;

  onCancel() {
    this.result.emit(confirmationResult.Cancel);
  }
  onConfirm() {
    this.result.emit(confirmationResult.OK);
  }
}