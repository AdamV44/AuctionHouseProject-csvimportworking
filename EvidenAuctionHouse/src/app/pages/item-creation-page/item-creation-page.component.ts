import { Component } from '@angular/core';
import { ConfirmationComponent } from '../../components/confirmation/confirmation.component';
import { confirmationResult } from '../../../models/confirmationResult';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService } from '../../services/file.service';
import { ItemsService } from '../../services/items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuctionItem } from '../../../models/auctionItem';
import { forkJoin, map, switchMap } from 'rxjs';
import { UtilityService } from '../../services/utility.service';

@Component({
  selector: 'app-item-creation-page',
  imports: [ConfirmationComponent, NgFor, FormsModule, NgIf],
  templateUrl: './item-creation-page.component.html',
  styleUrls: ['./item-creation-page.component.scss']
})
export class ItemCreationPageComponent {

  constructor(
    public fileService: FileService, 
    private itemsService: ItemsService,
    private router: Router,
    private route: ActivatedRoute,
    private utility: UtilityService
  ) {
    this.refresh();
  }

  loaded: boolean = true;

  // user entered information
  loadedFiles: File[] = [];
  previewUrls: string[] = [];
  additionalParameters: string = '';
  state: string = 'new';
  itemName: string;
  startingPrice: number;
  serialNumber: string;
  //

  public refresh() {
    this.loaded = true;
  }

  private computePreviews() {
    // revoke old urls
    for (const url of this.previewUrls) {
      try { URL.revokeObjectURL(url); } catch { }
    }
    this.previewUrls = this.loadedFiles.map(f => URL.createObjectURL(f));
  }

  public onConfirmation(result: confirmationResult) {
  // hide confirmation dialog when result is returned
  this.showConfirmationDialog = false;

  if (result === confirmationResult.OK) {

      // před vytvořením položky - doporučená validace
      if (!this.itemName || !this.serialNumber || !this.startingPrice) {
        console.error('Chybí název, sériové číslo nebo cena');
        return;
      }

      // Build AuctionItem with freeform additionalParameters string
      const item: AuctionItem = new AuctionItem({
        id: "0",
        name: this.itemName,
        startingPrice: this.startingPrice,
        additionalParameters: this.additionalParameters,
        auctionId: "",
        serialNumber: this.serialNumber,
        picturesPaths: []
      });
      // attach state separately to avoid changing many call sites
      item.state = this.state;

      this.itemsService.createItem(item).subscribe(result => {
        console.log(result);

        this.fileService.uploadPictures(this.loadedFiles, result.id).subscribe(res => {
          console.log(res);
        });
      });

    } else if (result === confirmationResult.Cancel) {
      // handle cancel if needed
    }

    this.router.navigate(['/items']).then(() => {
      this.utility.reloadPage();
    });
  }

  // controls whether the embedded confirmation dialog is visible
  showConfirmationDialog: boolean = false;

  openConfirmation() {
    // recompute previews before showing dialog
    this.computePreviews();
    this.showConfirmationDialog = true;
  }

  cancelCreation() {
    // navigate back without creating
    this.router.navigate(['/items']).then(() => this.utility.reloadPage());
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    const target = event.target as HTMLElement;
    target.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    const target = event.target as HTMLElement;
    target.classList.remove('drag-over');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const target = event.target as HTMLElement;
    target.classList.remove('drag-over');

    if (event.dataTransfer?.files) {
      const files: File[] = Array.from(event.dataTransfer.files);
      for (const file of files) {
        if (!this.fileService.isPicture(file)) {
          console.log('File is not a picture:', file.name);
          return;
        }
        if (this.fileService.containsFile(file, this.loadedFiles)) {
          console.log('File already loaded:', file.name);
          return;
        }
        this.loadedFiles.push(file);
      }
      console.log('Dropped files:', files);
  // compute previews for confirmation
  this.computePreviews();
    }
  }

  validateInputs(): boolean {
    if (!this.itemName || !this.serialNumber || !this.startingPrice) {
      // ukázková chybová hláška nebo nastavení errors pro confirmation
      console.error('Chybí název, sériové číslo nebo cena');
      return false;
    }
    return true;
  }
}
