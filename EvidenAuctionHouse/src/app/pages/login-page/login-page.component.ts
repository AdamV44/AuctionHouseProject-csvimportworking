import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { Credentials } from '../../../models/credentials';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  email: string = '';
  password: string = '';
  loginData: Credentials;
  loginError: boolean = false; // Přidáno pro zobrazení chyby

  constructor(private router: Router, private authService: AuthenticationService) {}

  onLogin() {
    // Kontrola prázdných polí
    if (!this.email.trim() || !this.password.trim()) {
      this.loginError = true;
      return;
    }
    
    let c: Credentials = new Credentials();
    c.email = this.email;
    c.password = this.password;
    this.authService.login(c).subscribe({
      next: response => {
        localStorage.setItem('token', response.token);
        this.loginError = false;
        this.router.navigate(['/auctions']); // Přesměrování po úspěšném přihlášení
      },
      error: () => {
        this.loginError = true; // Zůstane na login stránce a zobrazí chybu
      }
    });
  }
}
