import { Injectable, numberAttribute } from '@angular/core';
import { Bid } from '../../models/bid';
import { dateTimestampProvider } from 'rxjs/internal/scheduler/dateTimestampProvider';
import { Observable, of, map } from 'rxjs'; // Přidej map
import { HttpClient } from '@angular/common/http';
import { settings } from '../settings.config';
import { getSafePropertyAccessString } from '@angular/compiler';
import { User } from '../../models/user';
import { BidCreationDTO } from '../../models/bidCreationDTO';

@Injectable({
  providedIn: 'root'
})
export class BidsService {
  bidService: any;

  constructor(private http: HttpClient) { }


  // public createBid(b: BidCreationDTO): Observable<string> {
  //   return this.http.post<string>(settings.apiRoute + '/Bids/create', b)
  // }
  public getBids(): Observable<Bid[]> {
    return this.http.get<Bid[]>(settings.apiRoute + '/Bids/get')
  }
  public getBidsByItemId(itemId: string): Observable<Bid[]> {
    return this.http.get<Bid[]>(settings.apiRoute + '/Bids/get/' + itemId)
  }
  public getLatestBidByItemId(itemId: string): Observable<Bid | undefined> {
    const lastBid: Observable<Bid> = this.http.get<Bid>(settings.apiRoute + '/Bids/get-latest/' + itemId)
    if (!lastBid) {
      return of(undefined)
    }
    return lastBid
  }
  public getLatestBidderForItem(itemId: string): Observable<User> {
    return this.http.get<User>(settings.apiRoute + '/Bids/get-latest-bidder/' + itemId)
  }

  // public createBid(b: Bid): void {
  //   this.bids.push(b)
  // }

  // public getBids(): Observable<Bid[]> {
  //   return of(this.bids);
  // }

  // public getBidsByItemId(itemId: number): Observable<Bid[]> {
  //   return of(this.bids.filter(bid => bid.auctionItemId === itemId))
  // }
  
  // public getLatestBidByItemId(itemId: number): Observable<Bid | undefined> {
  //   const bids = this.bids.filter(bid => bid.auctionItemId === itemId);
  //   if (bids.length === 0) {
  //     return of(undefined);
  //   }
  //   return of(bids.reduce((latest, current) =>
  //     !latest || current.date > latest.date ? current : latest
  //   ));
  // }


  // bids: Bid[] = [
  // {
  //   id: 1,
  //   auctionId: 1,
  //   auctionItemId: 1,
  //   userId: 1,
  //   amountAdded: 1500,
  //   date: new Date('2024-05-02T14:30:00')
  // },
  // {
  //   id: 2,
  //   auctionId: 1,
  //   auctionItemId: 2,
  //   userId: 2,
  //   amountAdded: 2000,
  //   date: new Date('2024-05-03T09:15:00')
  // },
  // {
  //   id: 3,
  //   auctionId: 2,
  //   auctionItemId: 1,
  //   userId: 1,
  //   amountAdded: 1750,
  //   date: new Date('2024-07-16T11:45:00')
  // },
  
  // ];

  // Angular komponentě pro přihazování
  createBid(auctionItemId: string, bidAmount: number, currentDisplayedPrice: number) {
    const bidData = {
      Bid: {
        Id: "0", // Některé API vyžadují Id i když se ignoruje
        AuctionItemId: auctionItemId,
        UserId: "", // Nech prázdné - backend ho doplní z tokenu
        AmountAdded: bidAmount,
        CreatedAt: new Date().toISOString() // Datum ve správném formátu
      },
      ItemPerceivedPrice: currentDisplayedPrice
    };
    
    console.log('Sending bid data to backend:', bidData);
    
    return this.http.post(`${settings.apiRoute}/Bids/create`, bidData);
  }

  // Metoda pro výpočet aktuální ceny položky
  public getCurrentItemPrice(itemId: string, startingPrice: number): Observable<number> {
    return this.getBidsByItemId(itemId).pipe(
      map(bids => {
        return bids.reduce((total, bid) => total + bid.amountAdded, startingPrice);
      })
    );
  }
}
