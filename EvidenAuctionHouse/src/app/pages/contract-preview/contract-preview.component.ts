import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-contract-preview',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './contract-preview.component.html',
  styleUrls: ['./contract-preview.component.scss']
})
export class ContractPreviewComponent implements OnInit {
  contractId: string | null = null;
  token: string | null = null;
  documentUrl: string | null = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.contractId = this.route.snapshot.paramMap.get('id');
    this.token = this.route.snapshot.queryParamMap.get('t');
    if (this.contractId) {
      const t = this.token ? `?t=${encodeURIComponent(this.token)}` : '';
      // point to API document endpoint which will validate token or require auth
      this.documentUrl = `/api/Contracts/${this.contractId}/document${t}`;
    }
  }

}
