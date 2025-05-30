import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-email-confirmation-page',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './email-confirmation-page.component.html',
  styleUrl: './email-confirmation-page.component.scss'
})
export class EmailConfirmationPageComponent {

  token: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private http: HttpClient, private router: Router) { }

  onConfirm() {
    // Zde by měl být reálný požadavek na backend pro ověření tokenu
    // Ukázková logika:
   this.router.navigate(['/']);
  }

  onResendEmail() {
    console.log("neco");
    
  } 
}
