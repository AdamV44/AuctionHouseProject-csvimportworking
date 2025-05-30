import { Injectable } from '@angular/core';
import { AuctionItem } from '../../models/auctionItem';

@Injectable({
  providedIn: 'root'
})
export class CsvDataService {

  private data: AuctionItem[] = [];

  setData(data: AuctionItem[]) {
    this.data = data;
  }

  getData(): AuctionItem[] {
    return this.data;
  }

  saveData(data: any[]) {
    localStorage.setItem('csvData', JSON.stringify(data));
    // Pro kontrolu:
    console.log('Data uložena do localStorage:', data);
  }
}
