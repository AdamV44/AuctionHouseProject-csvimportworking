import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuctionItem } from '../../models/auctionItem';
import { Auction } from '../../models/auction';
import { HttpClient } from '@angular/common/http';
import { settings } from '../settings.config';
import { AuctionCreateDTO } from '../../models/auctionCreateDTO';

@Injectable({
  providedIn: 'root'
})
export class AuctionsService {

    constructor(private http: HttpClient) { }

    public getAuctions(): Observable<Auction[]> {
      return this.http.get<Auction[]>(settings.apiRoute + '/Auctions/get')
    }
    public getActiveAuctions(): Observable<Auction[]> { 
      return this.http.get<Auction[]>(settings.apiRoute + '/Auctions/get-active');
    }
    public getAuctionById(auctionsId: string): Observable<Auction> {
      return this.http.get<Auction>(settings.apiRoute + '/Auctions/get/' + auctionsId)
    }
    public createAuction(a: Auction, auctionItemsIds: string[]): Observable<string> {
      return this.http.post<string>(settings.apiRoute + '/Auctions/create', new AuctionCreateDTO(a, auctionItemsIds))
    }
    public editAuction(newAuction: Auction, auctionItemsIds: string[], auctionId: string): Observable<string> {
      return this.http.post<string>(settings.apiRoute + '/Auctions/edit/' + auctionId, new AuctionCreateDTO(newAuction, auctionItemsIds))
    }
    public removeAuction(auctionId: string): Observable<string> {
      return this.http.delete<string>(settings.apiRoute + '/Auctions/delete/' + auctionId)
    }
    public getItemsForAuctionById(auctionId: string): Observable<AuctionItem[]> {
      return this.http.get<AuctionItem[]>(settings.apiRoute + '/Auctions/get-items/' + auctionId)
    }

    public getAuctionReport(auctionId: string) {
      return this.http.get<any>(settings.apiRoute + '/Auctions/report/' + auctionId);
    }

  // sensitive report endpoint removed from client: server enforces admin checks; UI is admin-only

    public finalizeAuction(auctionId: string) {
      return this.http.post<any>(settings.apiRoute + '/Auctions/finalize/' + auctionId, {});
    }

    public reportExists(auctionId: string) {
      return this.http.get<{ exists: boolean }>(settings.apiRoute + '/Auctions/report-exists/' + auctionId);
    }
    // public getAuctions(): Observable<Auction[]> {
    //   return of(this.auctions)
    // }

    // public getAuctionById(auctionId: number): Observable<Auction> {
    //   return of(this.auctions.filter(auction => auction.id === auctionId)[0])
    // }    

    // public createAuction(a: Auction) {
    //   this.auctions.push(a)
    // }
    // public editAuction(newAuction: Auction, auctionId: number) {
    //   const index = this.auctions.findIndex(auction => auction.id === auctionId);
    //   if (index !== -1) {
    //     this.auctions[index] = newAuction;
    //   }
    // }
    
    // public removeAuction(auctionId: number) {
    //   this.auctions = this.auctions.filter(auction => auction.id !== auctionId);
    // }

    // auctions: Auction[] = [
    //   {
    //     id: 1,
    //     name: 'Auction 1',
    //     startDate: new Date('2023-10-01'),
    //     endDate: new Date('2023-10-10'),
    //     auctionItemsIds: [1, 2, 3]
    //   },
    //   {
    //     id: 2,
    //     name: 'Auction 2',
    //     startDate: new Date('2023-10-05'),
    //     endDate: new Date('2023-10-15'),
    //     auctionItemsIds: [4, 5, 6, 7, 8]
    //   },
    //   {
    //     id: 3,
    //     name: 'Auction 3',
    //     startDate: new Date('2023-10-08'),
    //     endDate: new Date('2023-10-20'),
    //     auctionItemsIds: [9, 10]
    //   }
    // ]
}
