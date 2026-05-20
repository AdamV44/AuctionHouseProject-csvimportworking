import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { Credentials } from '../../../models/credentials';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  email: string = '';
  password: string = '';
  loginData: Credentials;
  loginError: boolean = false; // Přidáno pro zobrazení chyby
  loginErrorMessage: string = '';

  constructor(private router: Router, private authService: AuthenticationService) {}

  onLogin() {
    this.loginError = false;
    this.loginErrorMessage = '';

    // Kontrola prázdných polí
    if (!this.email.trim() || !this.password.trim()) {
      this.loginError = true;
      this.loginErrorMessage = 'Prázdná políčka nebo chybné údaje.';
      return;
    }
    
    let c: Credentials = new Credentials();
    c.email = this.email;
    c.password = this.password;
    this.authService.login(c).subscribe({
      next: response => {
        this.loginError = false;
        this.router.navigate(['/auctions']);
      },
      error: (err) => {
        this.loginError = true; 

        if (typeof err.error === 'string') {
          this.loginErrorMessage = err.error;
        } else if (err.status === 0) {
          this.loginErrorMessage = 'Backend server není dostupný (síťová chyba).';
        } else if (err.error && err.error.message) {
          this.loginErrorMessage = err.error.message;
        } else {
          this.loginErrorMessage = 'Něco se pokazilo. Zkontrolujte své údaje.';
        }
        
        window.alert(`Chyba přihlášení: ${this.loginErrorMessage}`);
      }
    });
  }
}
