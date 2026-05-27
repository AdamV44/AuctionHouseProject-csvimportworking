import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { settings } from '../../settings.config';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-rules-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-rules-page.component.html',
  styleUrls: ['./admin-rules-page.component.scss']
})
export class AdminRulesPageComponent implements OnInit {
  public raw: string = '';
  public title: string = '';
  public version: string = '';
  public loading: boolean = false;
  public saving: boolean = false;
  public previewHtml: SafeHtml | null = null;
  public showConfirm: boolean = false;
  public pendingVersion: string | null = null;
  // expose current metadata for template convenience
  public get current() { return { title: this.title, version: this.version }; }

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    // get raw markdown
    this.http.get<any>(settings.apiRoute + '/admin/rules/raw', { withCredentials: true }).subscribe({
      next: (res) => {
  this.raw = res?.body || '';
  this.updatePreview();
  this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    // get meta from public endpoint
    this.http.get<any>(settings.apiRoute + '/rules/current').subscribe({
      next: (r) => { this.title = r?.title || ''; this.version = r?.version || ''; },
      error: () => {}
    });
  }

  saveRaw() {
    this.saving = true;
    this.http.put<any>(settings.apiRoute + '/admin/rules/raw', { raw: this.raw }, { withCredentials: true }).subscribe({
      next: () => { this.saving = false; this.load(); },
      error: () => { this.saving = false; }
    });
  }

  saveMeta() {
    this.saving = true;
    this.http.put<any>(settings.apiRoute + '/admin/rules/meta', { title: this.title, version: this.version }, { withCredentials: true }).subscribe({
      next: () => { this.saving = false; },
      error: () => { this.saving = false; }
    });
  }

  // Save raw and meta as a new version: bump version then save both
  // show confirmation modal (preview + new version) before saving
  saveNewVersion() {
    this.pendingVersion = this.bumpVersion(this.version);
    this.updatePreview();
    this.showConfirm = true;
  }

  // user confirmed — perform actual save
  performSaveNewVersion() {
    if (!this.pendingVersion) return;
    this.saving = true;
    const newVersion = this.pendingVersion;
    // first write raw
    this.http.put<any>(settings.apiRoute + '/admin/rules/raw', { raw: this.raw }, { withCredentials: true }).subscribe({
      next: () => {
        // then update meta with bumped version
        this.http.put<any>(settings.apiRoute + '/admin/rules/meta', { title: this.title, version: newVersion }, { withCredentials: true }).subscribe({
          next: () => { this.saving = false; this.version = newVersion; this.showConfirm = false; this.pendingVersion = null; this.load(); },
          error: () => { this.saving = false; this.showConfirm = false; this.pendingVersion = null; }
        });
      },
      error: () => { this.saving = false; this.showConfirm = false; this.pendingVersion = null; }
    });
  }

  cancelConfirm() {
    this.showConfirm = false;
    this.pendingVersion = null;
  }

  bumpVersion(v: string): string {
    if (!v) return 'v1.0';
    // try to parse 'vMajor.Minor' or numeric like '1.0'
    let cleaned = v.trim();
    if (cleaned.startsWith('v') || cleaned.startsWith('V')) cleaned = cleaned.substring(1);
    const parts = cleaned.split('.').map(p => parseInt(p || '0'));
    if (parts.length === 0) return 'v1.0';
    if (parts.length === 1) {
      return `v${parts[0] + 1}.0`;
    }
    // increment minor
    parts[1] = (parts[1] || 0) + 1;
    return `v${parts[0]}.${parts[1]}`;
  }

  onRawChange(v: string) {
    this.raw = v;
    this.updatePreview();
  }

  updatePreview() {
    const html = this.mdToHtml(this.raw || '');
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  mdToHtml(md: string): string {
    if (!md) return '';
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // code blocks
    md = md.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${esc(code)}</code></pre>`);
    // headings
    md = md.split('\n').map(line => {
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const level = Math.min(6, h[1].length);
        return `<h${level}>${h[2]}</h${level}>`;
      }
      return line;
    }).join('\n');
    md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    md = md.replace(/\*(.+?)\*/g, '<em>$1</em>');
    md = md.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>');
    const parts = md.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 0);
    const html = parts.map(p => {
      if (/^<(h[1-6]|pre|ul|ol|li|blockquote)/.test(p)) return p;
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');
    return html;
  }

}
