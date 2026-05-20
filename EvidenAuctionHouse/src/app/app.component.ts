import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthenticationService } from './services/authentication.service';
import { NgIf } from '@angular/common';
import { User } from '../models/user';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  userName: string = '';
  isAdmin: boolean = false;

  constructor(public router: Router, private authService: AuthenticationService) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user: User | null) => {
      if (user) {
        this.userName = user.name;
        this.isAdmin = user.isAdmin;
      } else {
        this.userName = '';
        this.isAdmin = false;
      }
    });
  }

  onLogout() {
    this.authService.logout();
    this.userName = '';
    this.isAdmin = false;
    this.router.navigate(['/']);
  }
}
