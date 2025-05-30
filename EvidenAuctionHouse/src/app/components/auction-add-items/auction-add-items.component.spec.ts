import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionAddItemsComponent } from './auction-add-items.component';

describe('AuctionAddItemsComponent', () => {
  let component: AuctionAddItemsComponent;
  let fixture: ComponentFixture<AuctionAddItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctionAddItemsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionAddItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
