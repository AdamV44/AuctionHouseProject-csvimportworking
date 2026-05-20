import { Component } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../../models/user';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-user-information-page',
  imports: [RouterLink, NgIf, CommonModule],
  templateUrl: './user-information-page.component.html',
  styleUrl: './user-information-page.component.scss'
})
export class UserInformationPageComponent {
  user: User;

  constructor(private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    this.user = this.authService.getUser() as User;;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
