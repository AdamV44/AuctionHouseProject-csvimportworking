import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../services/authentication.service';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-contract-sign-page',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './contract-sign-page.component.html',
  styleUrls: ['./contract-sign-page.component.scss']
})
export class ContractSignPageComponent implements OnInit {
  contractId: string | null = null;
  token: string | null = null;
  previewUrl: string | null = null;
  loading = false;
  message: string | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient, private auth: AuthenticationService, private router: Router) { }

  ngOnInit(): void {
    this.contractId = this.route.snapshot.paramMap.get('id');
    this.token = this.route.snapshot.queryParamMap.get('t');
    if (this.contractId) {
      const t = this.token ? `?t=${encodeURIComponent(this.token)}` : '';
      this.previewUrl = `/api/Contracts/${this.contractId}/document${t}`;
    }
  }

  confirmAndSign() {
    if (!this.contractId) return;
    this.loading = true;
    const t = this.token ? `?t=${encodeURIComponent(this.token)}` : '';
    // call light-sign endpoint which validates token and marks contract signed
    this.http.post(`/api/Contracts/${this.contractId}/light-sign/${this.token}`, {})
      .subscribe({
        next: (resp: any) => {
          this.loading = false;
          this.message = 'Contract signed successfully.';
        },
        error: (err) => {
          this.loading = false;
          this.message = 'Failed to sign contract: ' + (err?.error || err?.statusText || 'unknown');
        }
      });
  }

}
