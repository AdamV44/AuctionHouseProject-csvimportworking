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
      this.keys = ['name', 'StartingPrice'];
      // Zjisti všechny klíče z additionalParams
      const allAdditional = this.data
        .map(item => {
          if (item.additionalParams) {
            if (typeof item.additionalParams.keys === 'function') {
              return Array.from(item.additionalParams.keys());
            } else {
              return Object.keys(item.additionalParams);
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
      const { additionalParams, StartingPrice, groupId, itemGroupId, ...rest } = item;
      return {
        id: '0', // prázdné id
        ...rest,
        name: item.name,
        startingPrice: Number(item.StartingPrice),
        itemGroupId: groupId ?? itemGroupId ?? '',
        auctionId: '',
        picturesPaths: undefined,
        ...(additionalParams || {})
      };
    });

    this.itemsService.createMultipleItems(parsedItems).subscribe(result => {
      console.log(result);
      this.router.navigate(['/items']);
    });
  }

}
