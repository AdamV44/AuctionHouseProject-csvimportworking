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

  constructor(
    private userService: UserService, 
    private authService: AuthenticationService, 
    private router: Router
  ) {}

  onChangePassword() {
    if (this.newPassword !== this.confPassword) {
      this.changePasswordError = true;
      return;
    }
    const user: User = this.authService.getUser() as User;
    let info: ChangePasswordDTO = new ChangePasswordDTO();

    info.userId = user.id,
    info.oldPassword = this.oldPassword,
    info.newPassword = this.newPassword
  
    this.userService.changePassword(info).pipe(catchError(err => {
      console.error(err);
      this.changePasswordError = true;
      return [];
    })).subscribe(result => {
      if (result == null) {
        this.changePasswordError = true;
        return;
      }
      console.log(result);
      this.router.navigate(['/user'])
      
    })
  }
}
