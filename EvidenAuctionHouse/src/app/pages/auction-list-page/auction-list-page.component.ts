import { Component } from '@angular/core';
import { AuctionTableComponent } from '../../components/auction-table/auction-table.component';
import { AuctionsService } from '../../services/auctions.service';
import { Auction } from '../../../models/auction';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthenticationService } from '../../services/authentication.service';
import { FirstLoginRulesModalComponent } from '../../components/first-login-rules-modal/first-login-rules-modal.component';
import { UserService } from '../../services/user.service';
import { HttpClient } from '@angular/common/http';
import { settings } from '../../settings.config';

@Component({
  selector: 'app-auction-list-page',
  imports: [AuctionTableComponent, NgIf, RouterLink, FirstLoginRulesModalComponent],
  templateUrl: './auction-list-page.component.html',
  styleUrl: './auction-list-page.component.scss'
})
export class AuctionListPageComponent {

  showRulesModal: boolean = false;
  ruleBody: string = '';
  ruleTitle: string = '';

  constructor(
    public auctionsService: AuctionsService, 
    public router: Router,
    public authService: AuthenticationService,
  private userService: UserService,
  private http: HttpClient
  ) {
      this.reload();
      // after reload, check rules acceptance for logged-in user
      this.checkRulesAcceptance();
      // also run check whenever authenticated user updates (fix race on navigation)
      try {
        this.authService.user$.subscribe(u => {
          console.debug('[rules] user$ update', u);
          if (u) this.checkRulesAcceptance();
        });
      } catch (e) {
        // ignore if subscription fails
      }
    }

  loaded: boolean = false
  
  auctionPreviewsOnPage: Auction[];
  

  public reload() {
    if (this.authService.isAdmin()) {
        // Admin should see only active auctions here; finished auctions are in reports
        this.auctionsService.getActiveAuctions().subscribe(data => {
          this.auctionPreviewsOnPage = data;
          this.loaded = true;
        })
    }
    else {
      this.auctionsService.getActiveAuctions().subscribe(data => {
        this.auctionPreviewsOnPage = data;
        this.loaded = true;
      })
    }
  }

  checkRulesAcceptance() {
    // Only check for authenticated users
    console.debug('[rules] checkRulesAcceptance start', { isAuthenticated: this.authService.isAuthenticated(), token: this.authService.getToken(), storedUser: this.authService.getUser() });
    if (!this.authService.isAuthenticated()) {
      console.debug('[rules] user not authenticated yet, skipping');
      return;
    }

    // fetch authoritative profile and rules then decide
  this.userService.getMe().subscribe({
      next: (u) => {
    console.debug('[rules] got profile', u);
        // fetch rules from API using HttpClient (ensures interceptor adds Authorization header)
        this.http.get<any>(settings.apiRoute + '/rules/current', { withCredentials: true }).subscribe({
          next: (j) => {
      console.debug('[rules] got rules', j);
            const rulesVersion = j?.version || null;
            if (!u.acceptedRules || u.acceptedRulesVersion !== rulesVersion) {
              this.ruleBody = j?.body || '';
              this.ruleTitle = j?.title || '';
              this.showRulesModal = true;
            }
          },
          error: () => {
            // if rules cannot be fetched, optionally show modal if user hasn't accepted (fallback)
            if (!u.acceptedRules) {
              this.ruleBody = '';
              this.ruleTitle = '';
              this.showRulesModal = true;
            }
          }
        });
      },
      error: () => { /* ignore */ }
    })
  }

  onRulesAccepted() {
    // After modal accept, refresh authoritative profile and update auth state
    this.userService.getMe().subscribe({
      next: (full) => {
        try {
          // update authentication service stored user so other parts of app know user accepted rules
          (this.authService as any).updateUser(full);
        } catch (e) {
          // fallback: write to local storage
          localStorage.setItem('user', JSON.stringify(full));
        }
        this.showRulesModal = false;
        this.reload();
      },
      error: () => {
        // If refresh fails, still hide modal to avoid blocking; user will get prompts later
        this.showRulesModal = false;
        this.reload();
      }
    });
  }

  onRulesRejected() {
    this.showRulesModal = false;
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
