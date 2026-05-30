import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-contracts-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-contracts-list.component.html',
  styleUrls: ['./admin-contracts-list.component.scss']
})
export class AdminContractsListComponent implements OnInit {
  contracts: any[] = [];
  uploading = false;
  message: string | null = null;
  // When running the dev server without a proxy, use the backend base URL so
  // the dev server doesn't return index.html for /api calls.
  apiBase: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // detect local dev server and prefer direct backend URL to avoid HTML index responses
    try {
      const host = window.location.hostname;
      const port = window.location.port;
      if ((host === 'localhost' || host === '127.0.0.1') && port === '4200') {
        this.apiBase = 'http://localhost:5005';
      }
    } catch (e) {
      // ignore when running server-side or tests
    }
    this.load();
  }

  load() {
    const url = this.apiBase ? `${this.apiBase}/api/Contracts` : '/api/Contracts';
    this.http.get<any[]>(url).subscribe(r => this.contracts = r, err => {
      console.error('Failed to load contracts', err);
      this.message = 'Failed to load contracts';
    });
  }

  onFileChange(event: any, contractId: string) {
    const file: File = event.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file, file.name);
  this.uploading = true;
  const url = this.apiBase ? `${this.apiBase}/api/Contracts/${contractId}/upload-signed` : `/api/Contracts/${contractId}/upload-signed`;
  this.http.post(url, fd).subscribe({
      next: () => { this.uploading = false; this.message = 'Uploaded'; this.load(); },
      error: (e) => { this.uploading = false; this.message = 'Upload failed'; }
    });
  }
}
