import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../../models/user';
import { RegistrationInformation } from '../../../models/registrationInformation';
import { AuthenticationService } from '../../services/authentication.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  confPassword: string = '';

  registerError: boolean = false;
  registerErrorMessage: string = ''; // Přidáno pro zobrazení zprávy
  errorMessage: string = '';

  constructor(private router: Router, private authService: AuthenticationService) {}

  public onRegister() {
    this.registerError = false;
    this.registerErrorMessage = '';

    if (!this.checkFields()) {
      this.registerError = true;
      this.registerErrorMessage = 'Prosím, zkontrolujte zadané údaje. Zkontrolujte prázdná políčka a shodu hesel.';
      return;
    }

    let info: RegistrationInformation = new RegistrationInformation();
    info.email = this.email;
    info.name = this.name;
    info.password = this.password;

    this.authService.submitRegistration(info).subscribe({
      next: (result) => {
        console.log(result);
        this.router.navigate(['/email-confirmation']);
      },
      error: (err) => {
        this.registerError = true;
        
        // Lepší parsování chyb z backendu (vyhneme se [object XMLHttpRequestProgressEvent])
        if (typeof err.error === 'string') {
          this.registerErrorMessage = err.error;
        } else if (err.status === 0) {
          this.registerErrorMessage = 'Backend server není dostupný (síťová chyba).';
        } else if (err.error && err.error.message) {
          this.registerErrorMessage = err.error.message;
        } else {
          this.registerErrorMessage = 'Něco se pokazilo, email je už pravděpodobně registrován.';
        }
        
        // Zobrazí window alert pop up jak jsi žádal:
        window.alert(`Chyba registrace: ${this.registerErrorMessage}`);
      }
    });

  }

  private checkFields(): boolean {
    if (!this.name.trim() || !this.email.trim() || !this.password.trim() || !this.confPassword.trim()) {
      return false;
    }
    if (this.password !== this.confPassword) {
      return false;
    }
    return true
  }

}
