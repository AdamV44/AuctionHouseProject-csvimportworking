import { Component, Input, input } from '@angular/core';
import { AuctionItem } from '../../../models/auctionItem';
import { OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ItemsService } from '../../services/items.service';
import { forkJoin, of, switchMap } from 'rxjs';
import { CommonModule, CurrencyPipe, KeyValuePipe, NgFor, NgIf } from '@angular/common';
import { PriceInputComponent } from '../../components/price-input/price-input.component';
import { BidsService } from '../../services/bids.service';
import { UserService } from '../../services/user.service';
import { FileService } from '../../services/file.service';
@Component({
  selector: 'app-item-detail-page',
  imports: [NgFor, KeyValuePipe, NgIf, PriceInputComponent, CurrencyPipe, CommonModule],
  templateUrl: './item-detail-page.component.html',
  styleUrl: './item-detail-page.component.scss'
})
export class ItemDetailPageComponent {

  item: AuctionItem
  itemPrice: number
  highestBidderName: string
  imgsUrls: string[] = []
  bids: Array<{ bidderInitial: string; amount: number; createdAt?: string }> = []
  constructor(
    public route: ActivatedRoute,
    public itemsService: ItemsService,
    public bidsService: BidsService,
    public userService: UserService,
    public fileService: FileService,
  ) {

  }
  ngOnInit() {
    this.refresh();

    
  }
  loaded: boolean = false

  public refresh(): void {
    const itemId = this.route.snapshot.params['id'];

    forkJoin({
      item: this.itemsService.getItemById(itemId),
      price: this.itemsService.getItemPrice(itemId),
      highestBidder: this.bidsService.getLatestBidderForItem(itemId),
      pictures: this.fileService.getItemPictures(itemId),
      allBids: this.bidsService.getBidsForItem(itemId)
    
    }).subscribe(result => {
      this.item = this.itemsService.parseAuctionItem(result.item);
      this.itemPrice = result.price;
      this.highestBidderName = result.highestBidder ? result.highestBidder.name : "Žádný příhoz";
      this.imgsUrls = result.pictures.map(img => `data:${img.contentType};base64,${img.base64Data}`)
      
      // Process bids - resolve bidder names and use AmountAdded
      if (result.allBids && Array.isArray(result.allBids) && result.allBids.length > 0) {
        const userObservables = result.allBids.map((bid: any) => {
          const userId = bid.userId || bid.UserId || bid.user || null;
          if (!userId) return of(null);
          return this.userService.getUserById(userId).pipe(
            // map to user name or null
            // keep observable signature
          );
        });

        // forkJoin to resolve all user lookups (preserves order)
        forkJoin(userObservables).subscribe((users: any[]) => {
          this.bids = result.allBids.map((bid: any, idx: number) => {
            const user = users[idx];
            const name = user?.name || user?.Name || null;
            const initial = name ? name.charAt(0).toUpperCase() : (bid.bidderName ? bid.bidderName.charAt(0).toUpperCase() : '?');
            const amount = bid.amountAdded ?? bid.AmountAdded ?? bid.amount ?? 0;
            const createdAt = bid.createdAt ?? bid.CreatedAt ?? bid.CreatedAtUtc ?? null;
            return { bidderInitial: initial, amount, createdAt };
          });
        }, err => {
          // if user lookups fail, fall back to local data
          this.bids = result.allBids.map((bid: any) => ({
            bidderInitial: bid.bidderName ? bid.bidderName.charAt(0).toUpperCase() : '?',
            amount: bid.amountAdded ?? bid.AmountAdded ?? bid.amount ?? 0,
            createdAt: bid.createdAt ?? bid.CreatedAt ?? null
          }));
        });
      } else {
        this.bids = [];
      }
      
      this.loaded = true;

    })
}

  // Format additionalParameters for display: remove surrounding { } and wrapping quotes
  formatAdditionalParameters(raw: string | null | undefined): string {
    if (!raw) return '';
    let s = String(raw).trim();

    // Unescape common escaped quotes
    s = s.replace(/\\"/g, '"');

    // Strip surrounding quotes/braces repeatedly
    for (let i = 0; i < 3; i++) {
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1).trim();
        continue;
      }
      if (s.startsWith('{') && s.endsWith('}')) {
        s = s.slice(1, -1).trim();
        continue;
      }
      break;
    }

    // If it's JSON, try to parse and extract the useful part
    try {
      const obj: any = JSON.parse(s);
      if (obj && typeof obj === 'object') {
        // prioritize inner 'additionalParams' field
        if (obj.additionalParams) {
          s = String(obj.additionalParams);
        } else {
          // convert remaining object entries to key=value pairs, skip groupId
          const parts = Object.entries(obj)
            .filter(([k]) => k !== 'groupId')
            .map(([k, v]) => `${k}=${v}`);
          s = parts.join('; ');
        }
      }
    } catch (e) {
      // Not valid JSON - attempt to pull additionalParams via regex
      const m = s.match(/additionalParams\s*[":=]\s*"([^"]*)"/i);
      if (m && m[1]) {
        s = m[1];
      }
    }

    // Normalize key=value pairs: trim keys and values, preserve single-word values
    const kvParts = s
      .split(';')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => {
        const [k, ...rest] = p.split('=');
        if (!rest.length) return p; // no '=' found
        const v = rest.join('=').trim();
        return `${k.trim()}=${v}`;
      });

    return kvParts.join('; ');
  }

  currentImageIndex = 0;

  prevImage() {
    if (this.item && this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage() {
    if (this.item) {
      this.currentImageIndex = (this.currentImageIndex + 1)% this.imgsUrls.length;
    }
    console.log(this.item);
    
  }

  
}
