import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuctionItemGroup } from '../../models/auctionItemGroup';
import { HttpClient } from '@angular/common/http';
import { settings } from '../settings.config';


@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  constructor(private http: HttpClient) { }

  // groups: AuctionItemGroup[] = [
  //   {
  //     name: 'notebooky',
  //     params: [ 'cpu', 'ram', 'disk' ],
  //   },
  //   {
  //     name: 'nabytek',
  //     params: [ 'material', 'rozmer', 'barva', 'styl', 'vaha' ],
  //   }
  // ]

  // public getGroups(): Observable<AuctionItemGroup[]> {
  //   return of(this.groups);
  // }

  // public getGroupByName(name: string): Observable<AuctionItemGroup> {
  //   const group = this.groups.find(group => group.name === name);
  //   if (!group) {
  //     throw new Error(`Group with name ${name} not found`);
  //   }
  //   return of(group);
  // }
  public getGroups(): Observable<AuctionItemGroup[]> {
    return this.http.get<AuctionItemGroup[]>(settings.apiRoute + '/ItemGroups/get');
  }
  public getGroupByName(name: string): Observable<AuctionItemGroup> {
    const group = this.http.get<AuctionItemGroup>(settings.apiRoute + '/ItemGroups/get/' + name)
    if (!group) {
      throw new Error(`Group with name ${name} not found`);
    }
    return group
  }

}
