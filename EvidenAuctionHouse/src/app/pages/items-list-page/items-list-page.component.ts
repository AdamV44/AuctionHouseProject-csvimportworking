import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { ItemsService } from '../../services/items.service';
import { ItemsListComponent } from '../../components/items-list/items-list.component';
import { AuctionItem } from '../../../models/auctionItem';

@Component({
  selector: 'app-items-list-page',
  standalone: true,
  imports: [CommonModule, ItemsListComponent],
  templateUrl: './items-list-page.component.html',
  styleUrl: './items-list-page.component.scss'
})
export class ItemsListPageComponent implements OnInit {
  loaded: boolean = false;
  itemsOnPage: AuctionItem[] = [];
  selectedItems: AuctionItem[] = [];

  constructor(
    public authService: AuthenticationService,
    public router: Router,
    private itemsService: ItemsService
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  private loadItems(): void {
    this.itemsService.getItems().subscribe({
      next: (items: AuctionItem[]) => {
        this.itemsOnPage = items;
        this.loaded = true;
      },
      error: (error: any) => {
        console.error('Error loading items:', error);
        this.loaded = true;
      }
    });
  }

  getSelected(selectedItems: AuctionItem[]): void {
    this.selectedItems = selectedItems;
  }

  onDelete(): void {
    if (this.selectedItems.length === 0) {
      alert('Vyberte prosím položky ke smazání.');
      return;
    }

    if (confirm(`Opravdu chcete smazat ${this.selectedItems.length} položek?`)) {
      this.itemsService.removeMultipleItemsById(
        this.selectedItems.map((item) => item.id)
      ).subscribe({
        next: (result) => {
          console.log('✅ Delete success:', result);
          window.location.reload();
        },
        error: (error) => {
          console.error('❌ Delete error:', error);
          alert('Chyba při mazání položek');
        }
      });
    }
  }

  onCSV(): void {
    this.router.navigate(['/csv-import']);
  }
}
