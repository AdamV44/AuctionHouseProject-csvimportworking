import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../../models/user';
import { RegistrationInformation } from '../../../models/registrationInformation';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  confPassword: string = '';

  registerError: boolean = false;

  constructor(private router: Router, private authService: AuthenticationService) {}

  public onRegister() {
    if (!this.checkFields()) {
      this.registerError = true;
      return;
    }

    let info: RegistrationInformation = new RegistrationInformation();
    info.email = this.email;
    info.name = this.name;
    info.password = this.password;

    this.authService.submitRegistration(info).subscribe(result => {
      console.log(result);
      this.router.navigate(['/email-confirmation'])
      
    })

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
