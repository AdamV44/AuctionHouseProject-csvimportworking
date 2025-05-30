import { Component, input, Input } from '@angular/core';
import { ConfirmationComponent } from '../../components/confirmation/confirmation.component';
import { confirmationResult } from '../../../models/confirmationResult';
import { NgFor, NgIf } from '@angular/common';
import { AuctionItemGroup } from '../../../models/auctionItemGroup';
import { GroupsService } from '../../services/groups.service';
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
  styleUrl: './item-creation-page.component.scss'
})
export class ItemCreationPageComponent {

  constructor(
    public groupsService: GroupsService, 
    public fileService: FileService, 
    private itemsService: ItemsService,
    private router: Router,
    private route: ActivatedRoute,
    private utility: UtilityService
  ) {
    this.refresh()
  }
  loaded: boolean = false

  groups: AuctionItemGroup[] = [];
  selectedGroup: AuctionItemGroup;


  //user entered information
  loadedFiles: File[] = [];
  paramValues: { [key: string]: string } = {};
  itemName: string
  startingPrice: number
  //

  public refresh() {

    this.groupsService.getGroups().subscribe(groups => {
      this.groups = groups;
      this.selectedGroup = groups[0];
      this.loaded = true
      
    });
  }
  //
  public onConfirmation(result: confirmationResult) {
    if (result === confirmationResult.OK) {
      
      const item: AuctionItem = new AuctionItem(
        "0",
        this.itemName,
        this.selectedGroup.id,
        Number(this.startingPrice),
        new Map<string, string>(Object.entries(this.paramValues)),
      );
      
      this.itemsService.createItem(item).subscribe(result => {
        console.log(result);
        
        this.fileService.uploadPictures(this.loadedFiles, result.id).subscribe(res => {
          console.log(res);
        })
      })
      
    }
    else if (result === confirmationResult.Cancel) {
      
    }
    this.router.navigate(['/items']).then(() => {
      this.utility.reloadPage();
    });
  }




  onSelectionChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.groupsService.getGroupByName(selectedValue).subscribe(group => {
      this.selectedGroup = group;
    });
  };

  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Zabraňuje výchozímu chování
    const target = event.target as HTMLElement;
    target.classList.add('drag-over'); // Přidá třídu pro vizuální efekt
  }

  onDragLeave(event: DragEvent): void {
    const target = event.target as HTMLElement;
    target.classList.remove('drag-over'); // Odebere třídu
  }

  onDrop(event: DragEvent): void {
    event.preventDefault(); // Zabraňuje výchozímu chování
    const target = event.target as HTMLElement;
    target.classList.remove('drag-over'); // Odebere třídu

    if (event.dataTransfer?.files) {
      var files: File[] = Array.from(event.dataTransfer.files);
      for (const file of files) {
        if (!this.fileService.isPicture(file)) {
          console.log('File is not a picture:', file.name); // Zpracování souboru
          return;
        }
        if (this.fileService.containsFile(file, this.loadedFiles)) {
          console.log('File already loaded:', file.name); // Zpracování souboru
          return;
        }
        this.loadedFiles.push(file); // Přidá soubor do pole
      }
      console.log('Dropped files:', files); // Zpracování souborů
    }
  }
}
