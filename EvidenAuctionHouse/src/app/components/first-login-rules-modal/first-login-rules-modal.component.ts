import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { HttpClient } from '@angular/common/http';
import { settings } from '../../settings.config';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-first-login-rules-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './first-login-rules-modal.component.html',
  styleUrls: ['./first-login-rules-modal.component.scss']
})
export class FirstLoginRulesModalComponent implements OnChanges {
  @Input() visible: boolean = true;
  @Input() ruleBody: string = '';
  @Output() accepted = new EventEmitter<void>();
  @Output() rejected = new EventEmitter<void>();

  acceptedFlag = false;
  checked: boolean = false;
  @Input() ruleTitle: string = '';
  public previewHtml: SafeHtml | null = null;
  // ruleBody is provided via @Input or fetched from API if empty

  constructor(private userService: UserService, private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.updateBodyScroll();
    // if ruleBody or ruleTitle changed from parent, refresh preview
    if (changes['ruleBody'] || changes['ruleTitle']) {
      this.updatePreview();
    }
  }

  ngOnDestroy(): void {
    // ensure body scroll restored
    document.body.style.overflow = '';
  }

  private updateBodyScroll() {
    try {
      document.body.style.overflow = this.visible ? 'hidden' : '';
    } catch {
      // noop in environments without DOM
    }
  }

  ngOnInit(): void {
    // try to fetch rules from API and display inline only if not passed in
    if (!this.ruleBody) {
      this.fetchRules();
    }
  }

  fetchRules() {
    this.http.get<any>(settings.apiRoute + '/rules/current', { withCredentials: true }).subscribe({
      next: (j) => {
        if (j) {
          this.ruleTitle = j.title || '';
          this.ruleBody = j.body || '';
          this.updatePreview();
        }
      },
      error: () => {
        // ignore
      }
    });
  }

  onAccept() {
    this.userService.acceptRules().subscribe({
      next: () => {
        this.accepted.emit();
      },
      error: () => {
        // optionally show an error toast
      }
    })
  }

  onReject() {
    this.rejected.emit();
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
