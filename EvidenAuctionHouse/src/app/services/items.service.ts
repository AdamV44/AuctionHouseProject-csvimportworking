import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { AuctionItem } from '../../models/auctionItem';
import { BidsService } from './bids.service';
import { HttpClient } from '@angular/common/http';
import { settings } from '../settings.config';

@Injectable({
  providedIn: 'root'
})
export class ItemsService {

  constructor(public bidsService: BidsService, private http: HttpClient) { }

  public createItem(item: AuctionItem): Observable<AuctionItem> {
  return this.http.post<AuctionItem>(settings.apiRoute + '/AuctionItems/create', item);
  
  }

  public createMultipleItems(items: AuctionItem[]): Observable<AuctionItem[]> {
    console.log("loguju items");
    
    console.log(items);

    console.log(JSON.stringify(items, null, 2));
    
    
    return this.http.post<AuctionItem[]>(settings.apiRoute + '/AuctionItems/create-multiple', items)
  }

  public getItems(): Observable<AuctionItem[]> {
    return this.http.get<AuctionItem[]>(settings.apiRoute + '/AuctionItems/get')
  }
  public getUnlistedItems(): Observable<AuctionItem[]> {
    return this.http.get<AuctionItem[]>(settings.apiRoute + '/AuctionItems/get-unlisted')
  }
  public getItemById(itemId: string): Observable<AuctionItem> {
    return this.http.get<AuctionItem>(settings.apiRoute + '/AuctionItems/get/' + itemId)
  }
  public getItemPrice(itemId: string): Observable<number> {
    return this.http.get<number>(settings.apiRoute + '/AuctionItems/get/price/' + itemId)
  }
  public getItemSerialNumber(itemId: string): Observable<string> {
    return this.http.get<string>(settings.apiRoute + '/AuctionItems/get/serial-number/' + itemId)
  }
  public removeItemById(itemId: string): Observable<string> {
    console.log('🌐 API CALL - removeItemById');
    console.log('🌐 itemId:', itemId);
    console.log('🌐 URL:', settings.apiRoute + '/AuctionItems/delete/' + itemId);
    console.log('🌐 Full URL about to call:', settings.apiRoute + '/AuctionItems/delete/' + itemId);
    
    return this.http.delete<string>(settings.apiRoute + '/AuctionItems/delete/' + itemId);
  }
  public removeMultipleItemsById(itemIds: string[]): Observable<string[]> {
    console.log('🌐 API CALL - removeMultipleItemsById');
    console.log('🌐 itemIds:', itemIds);
    console.log('🌐 URL:', settings.apiRoute + '/AuctionItems/delete-multiple/');
    console.log('🌐 Payload:', JSON.stringify(itemIds));
    
    return this.http.post<string[]>(settings.apiRoute + '/AuctionItems/delete-multiple/', itemIds)
  }

  public parseAuctionItem(obj: any): AuctionItem {
    const {
      id,
      name,
      picturesPaths,
      auctionId,
      startingPrice,
      serialNumber,
      ...rest // other properties collected as simple object
    } = obj;

    // Convert any remaining properties into a single JSON string
    const additionalParamsString = Object.keys(rest).length ? JSON.stringify(rest) : '';

    const item = new AuctionItem({
      id,
      name,
      startingPrice,
      additionalParameters: additionalParamsString,
      auctionId,
      serialNumber,
      picturesPaths
    });

    // preserve state if present
    if ((rest as any).state) {
      item.state = (rest as any).state;
    }

    // ensure picturesPaths is preserved if provided
    item.picturesPaths = picturesPaths ?? [];

    return item;
  }


//   public createItem(item: AuctionItem) : void {
//     this.items.push(item)
//   }

//   public getItems(): Observable<AuctionItem[]> {
//     return of(this.items);
//   }
//   public getItemById(itemId: number) : Observable<AuctionItem> {
//     return of(this.items.filter(item => item.id === itemId)[0]);
//   }

//   public getItemPrice(itemStartingPrice: number, itemId: number): Observable<number> {
//   return this.bidsService.getBidsByItemId(itemId).pipe(
//     // sečte všechny příhozy k počáteční ceně
//     map(bids => bids.reduce((price, bid) => price + bid.amountAdded, itemStartingPrice))
//   );
// }

//   public removeItemById(itemId: number): void {
//     this.items = this.items.filter(item => item.id !== itemId);
//   }





//   items: AuctionItem[] = [
//     {
//       id: 1,
//       name: 'Item 1',
//       picturesPaths: [
//         'logo.png',
//         'favicon.ico',
//         'bucket.jfif'
//       ],
//       isListed: true,
//       isSold: false,
//       startingPrice: 20000,
//       additionalParams: new Map([
//         ['material', 'Hodnota1'], 
//         ['rozmer', 'Hodnota2'], 
//         ['barva', 'Hodnota3'],
//         ['styl', 'Hodnota4'],
//         ['vaha', 'Hodnota5']
//       ])
//     },
//     {
//       id: 2,
//       name: 'Iteffffffffffffffffffffffffm 2',
//       picturesPaths: [
//         'https://via.placeholder.com/150'
//       ],
//       isListed: true,
//       isSold: false,
//       startingPrice: 10000,
//       additionalParams: new Map([['Param1', 'Hodnota1'], ['Param2', 'Hodnota2']])
//     },
//     {
//       id: 3,
//       name: 'Item 3',
//       picturesPaths: [
//         'https://via.placeholder.com/150'
//       ],
//       isListed: true,
//       isSold: false,
//       startingPrice: 25000,
//       additionalParams: new Map([['Param1', 'Hodnota1'], ['Param2', 'Hodnota2']])
//     },
//     {
//   id: 4,
//   name: 'Item 4',
//   picturesPaths: [
//     'https://via.placeholder.com/150'
//   ],
//   isListed: true,
//   isSold: false,
//   startingPrice: 15000,
//   additionalParams: new Map([['CPU', 'Intel i5'], ['RAM', '8GB']])
// },
// {
//   id: 5,
//   name: 'Item 5',
//   picturesPaths: [
//     'https://via.placeholder.com/150'
//   ],
//   isListed: false,
//   isSold: false,
//   startingPrice: 18000,
//   additionalParams: new Map([['CPU', 'AMD Ryzen 5'], ['RAM', '16GB']])
// },
// {
//   id: 6,
//   name: 'Item 6',
//   picturesPaths: [
//     'https://via.placeholder.com/150'
//   ],
//   isListed: true,
//   isSold: false,
//   startingPrice: 22000,
//   additionalParams: new Map([['CPU', 'Intel i7'], ['RAM', '32GB']])
// },
// {
//   id: 7,
//   name: 'Item 7',
//   picturesPaths: [
//     'https://via.placeholder.com/150'
//   ],
//   isListed: false,
//   isSold: false,
//   startingPrice: 12000,
//   additionalParams: new Map([['CPU', 'AMD Ryzen 3'], ['RAM', '4GB']])
// },
// {
//   id: 8,
//   name: 'Item 8',
//   picturesPaths: [
//     'https://via.placeholder.com/150'
//   ],
//   isListed: true,
//   isSold: true,
//   startingPrice: 30000,
//   additionalParams: new Map([['CPU', 'Intel Xeon'], ['RAM', '64GB']])
// },
// {
//   id: 9,
//   name: 'Item 9',
//   picturesPaths: [
//     'https://via.placeholder.com/150'
//   ],
//   isListed: false,
//   isSold: false,
//   startingPrice: 9000,
//   additionalParams: new Map([['CPU', 'Intel Pentium'], ['RAM', '2GB']])
// },
// {
//   id: 10,
//   name: 'Item 10',
//   picturesPaths: [
//     'https://via.placeholder.com/150'
//   ],
//   isListed: true,
//   isSold: false,
//   startingPrice: 27000,
//   additionalParams: new Map([['CPU', 'AMD Ryzen 7'], ['RAM', '16GB']])
// },
// {
//   id: 11,
//   name: 'Item 11',
//   picturesPaths: [
//     'https://via.placeholder.com/150'
//   ],
//   isListed: false,
//   isSold: false,
//   startingPrice: 11000,
//   additionalParams: new Map([['CPU', 'Intel i3'], ['RAM', '8GB']])
// },
// {
//   id: 12,
//   name: 'Item 12',
//   picturesPaths: [
//     'https://via.placeholder.com/150'
//   ],
//   isListed: true,
//   isSold: false,
//   startingPrice: 35000,
//   additionalParams: new Map([['CPU', 'Apple M1'], ['RAM', '16GB']])
// },
// {
//   id: 13,
//   name: 'Item 13',
//   picturesPaths: [
//     'https://via.placeholder.com/150'
//   ],
//   isListed: false,
//   isSold: false,
//   startingPrice: 16000,
//   additionalParams: new Map([['CPU', 'AMD Athlon'], ['RAM', '4GB']])
//   ]
}
