import { Component } from '@angular/core';
import { CsvDataService } from '../../services/csvData.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ItemsService } from '../../services/items.service';

@Component({
  selector: 'app-csv-preview-page',
  imports: [CommonModule],
  templateUrl: './csv-preview-page.component.html',
  styleUrl: './csv-preview-page.component.scss'
})
export class CsvPreviewPageComponent {
  data: any[] = [];
  keys: string[] = [];
  additionalKeys: string[] = [];

  constructor(
    private csvDataService: CsvDataService,
    private router: Router,
    private itemsService: ItemsService
  ) {

    this.data = this.csvDataService.getData();
    if (this.data.length) {
      // base columns we show and send
      this.keys = ['name', 'startingPrice'];
      // Zjisti všechny klíče z additionalParams
      const allAdditional = this.data
        .map(item => {
          const ap = item.additionalParameters ?? item.additionalParams;
          if (ap) {
            try {
              const parsed = JSON.parse(ap);
              return Object.keys(parsed);
            } catch (e) {
              return [];
            }
          }
          return [];
        })
        .flat();
      this.additionalKeys = Array.from(
        new Set(
          allAdditional.filter((k): k is string => typeof k === 'string')
        )
      );
    } else {
      this.router.navigate(['/csv-import']);
    }
  }

  onSubmit() {
    
    const parsedItems = this.data.map(item => {
      const { additionalParameters, additionalParams, startingPrice,  ...rest } = item;
      // merge additionalParameters JSON string into rest as top-level fields
      let merged = { ...rest };
      const apString = additionalParameters ?? additionalParams ?? '';
      if (apString) {
        try {
          const parsed = JSON.parse(apString);
          merged = { ...merged, ...parsed };
        } catch (e) {
          // if parse fails, ignore
        }
      }
      return {
        id: '0', // placeholder id - server will assign
        ...merged,
  name: item.name,
  startingPrice: Math.round(Number(startingPrice ?? item.StartingPrice ?? 0)),
        auctionId: '',
        picturesPaths: [],
        additionalParameters: apString
      };
    });

    console.log('Submitting parsed items to API:', parsedItems);
    this.itemsService.createMultipleItems(parsedItems).subscribe(result => {
      console.log('Create multiple result:', result);
      this.router.navigate(['/items']);
    }, err => {
      console.error('Error creating multiple items:', err);
    });
  }

}
