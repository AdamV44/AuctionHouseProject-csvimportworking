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
  additionalParameters: string = '';
  state: string = 'new';
  itemName: string;
  startingPrice: number;
  //

  public refresh() {
    this.loaded = true;
  }

  public onConfirmation(result: confirmationResult) {
    if (result === confirmationResult.OK) {

      // Build AuctionItem with freeform additionalParameters string
      const item: AuctionItem = new AuctionItem(
        "0",
        this.itemName,
        this.startingPrice,
        this.additionalParameters,
        "",
      );
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
    }
  }
}
