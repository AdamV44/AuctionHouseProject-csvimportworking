import { settings } from "../settings.config";
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ItemGroupsService {
  constructor(private http: HttpClient) {}

  reloadItemGroups() {
    return this.http.post(`${settings.apiRoute}/ItemGroups/reload`, {});
  }
}
