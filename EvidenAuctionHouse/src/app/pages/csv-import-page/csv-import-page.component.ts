import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CsvDataService } from '../../services/csvData.service';
import * as Papa from 'papaparse';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-csv-import-page',
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './csv-import-page.component.html',
  styleUrl: './csv-import-page.component.scss'
})
export class CsvImportPageComponent {
  isDragOver = false;

  constructor(
    private router: Router, 
    private csvDataService: CsvDataService
  ) {}

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
    const result = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });

    const items: any[] = [];

    for (const row of result.data as any[]) {
      try {
        // extract Name and StartingPrice, keep everything else as additionalParams
        const { Name, StartingPrice, ...rest } = row;
        const additionalParamsObj: Record<string, string> = {};
        for (const [key, value] of Object.entries(rest)) {
          if (value && String(value).trim() !== '') {
            additionalParamsObj[key] = String(value);
          }
        }

        const item = {
          name: Name,
          startingPrice: Number(StartingPrice),
          additionalParameters: Object.keys(additionalParamsObj).length ? JSON.stringify(additionalParamsObj) : ''
        };

        items.push(item);
      } catch (e) {
        console.error('Error parsing row:', row, e);
      }
    }

    this.csvDataService.setData(items);
    this.router.navigate(['/csv-preview']);
  }
}
