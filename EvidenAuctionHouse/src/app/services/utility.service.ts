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

}
