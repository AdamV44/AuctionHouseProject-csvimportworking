import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { settings } from '../settings.config';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  public getConfig(): Observable<{ allowAdminExport: boolean }> {
    return this.http.get<{ allowAdminExport: boolean }>(settings.apiRoute + '/Admin/config');
  }
}
