import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CsvDataService } from '../../services/csvData.service';
import { AuctionItem } from '../../../models/auctionItem';
import * as Papa from 'papaparse';
import { FormsModule } from '@angular/forms';
import { GroupsService } from '../../services/groups.service';
import { AuctionItemGroup } from '../../../models/auctionItemGroup';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-csv-import-page',
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './csv-import-page.component.html',
  styleUrl: './csv-import-page.component.scss'
})
export class CsvImportPageComponent {
  isDragOver = false;
  groups: AuctionItemGroup[] = [];
  selectedGroup: AuctionItemGroup;
  loaded: boolean = false;

  constructor(
    private router: Router, 
    private csvDataService: CsvDataService,
    private groupsService: GroupsService
  ) {
    this.groupsService.getGroups().subscribe(groups => {
      this.groups = groups;
      this.selectedGroup = groups[0];
      this.loaded = true;
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.handleFile(file);
  }

  handleFile(file: File) {
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const csvData: string = e.target.result;
      this.parseCSV(csvData);
    };
    reader.readAsText(file);
  }

  parseCSV(csvData: string) {


    console.log(this.selectedGroup);
    
    const result = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });

    const items: any[] = [];

    for (const row of result.data as any[]) {
      try {
        // Vezmi všechny klíče kromě Name a StartingPrice jako additionalParams
        const { Name, StartingPrice, ...rest } = row;
        const additionalParams: Record<string, string> = {};
        for (const [key, value] of Object.entries(rest)) {
          if (value && String(value).trim() !== '') {
            additionalParams[key] = String(value);
          }
        }

        // Pokud máš vlastní třídu AuctionItem, uprav konstruktor podle potřeby
        const item = {
          name: Name,
          StartingPrice: Number(StartingPrice),
          groupId: "1",
          additionalParams
        };
        console.log("itemok takym jest", item);
        

        items.push(item);
      } catch (e) {
        console.error('Chyba při parsování řádku:', row, e);
      }
    }

    this.csvDataService.setData(items);
    this.router.navigate(['/csv-preview']);
  }

}