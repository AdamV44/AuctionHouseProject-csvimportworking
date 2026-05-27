import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { settings } from '../../settings.config';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-view-rules-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-rules-page.component.html',
  styleUrls: ['./view-rules-page.component.scss']
})
export class ViewRulesPageComponent implements OnInit {
  ruleTitle = '';
  ruleBody = '';
  previewHtml: SafeHtml | null = null;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.http.get<any>(settings.apiRoute + '/rules/current', { withCredentials: true }).subscribe({
      next: (j) => {
        if (j) {
          // debug log to help verify the API payload contains body
          try { console.log('GET /rules/current ->', j); } catch {}
          this.ruleTitle = j.title || '';
          this.ruleBody = j.body || '';
          this.updatePreview();
        }
      },
      error: () => {}
    });
  }

  private mdToHtml(md: string): string {
    if (!md) return '';
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    md = md.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${esc(code)}</code></pre>`);
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

  private updatePreview() {
    const html = this.mdToHtml(this.ruleBody || '');
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

}
