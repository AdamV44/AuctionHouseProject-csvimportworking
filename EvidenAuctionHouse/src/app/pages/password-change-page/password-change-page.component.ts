import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ChangePasswordDTO } from '../../../models/changePasswordDTO';
import { User } from '../../../models/user';
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-password-change-page',
  imports: [FormsModule, NgIf],
  templateUrl: './password-change-page.component.html',
  styleUrl: './password-change-page.component.scss'
})
export class PasswordChangePageComponent {
  oldPassword: string = '';
  newPassword: string = '';
  confPassword: string = '';

  changePasswordError: boolean = false;
  errorMessage: string = '';
  changePasswordSuccess: boolean = false;

  constructor(
    private userService: UserService, 
    private authService: AuthenticationService, 
    private router: Router
  ) {}

  onChangePassword() {
    this.changePasswordError = false;
    this.changePasswordSuccess = false;
    this.errorMessage = '';

    if (this.newPassword !== this.confPassword) {
      this.changePasswordError = true;
      this.errorMessage = 'Nová hesla se neshodují.';
      return;
    }
    if (!this.oldPassword || !this.newPassword) {
      this.changePasswordError = true;
      this.errorMessage = 'Všechna pole jsou povinná.';
      return;
    }

    const user: User = this.authService.getUser() as User;
    let info: ChangePasswordDTO = new ChangePasswordDTO();

    info.userId = user.id,
    info.oldPassword = this.oldPassword,
    info.newPassword = this.newPassword
  
    this.userService.changePassword(info).subscribe({
      next: (result) => {
        if (result == null) {
          this.changePasswordError = true;
          this.errorMessage = 'Změna hesla se nezdařila. Zkontrolujte své aktuální heslo.';
          return;
        }
        this.changePasswordSuccess = true;
        setTimeout(() => this.router.navigate(['/user-info']), 2000);
      },
      error: (err) => {
        console.error(err);
        this.changePasswordError = true;
        this.errorMessage = 'Došlo k chybě na serveru. Zkuste to prosím později.';
      }
    });
  }
}
