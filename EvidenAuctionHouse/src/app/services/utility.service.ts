import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor(private router: Router) { }

  public formatString(str: string, maxLength: number = 20): string {
    if (!str) return '';
    return str.length > maxLength ? str.slice(0, maxLength - 3) + '...' : str;
  }
  public reloadPage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/reload-dummy', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
  });
  }

  public dateToInput(date: Date): string {
    if (!date) {
      return '';
    }
    const pad = (num: number) => (num < 10 ? '0' + num : num);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
