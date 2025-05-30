import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionListedItemsPageComponent } from './auction-listed-items-page.component';

describe('AuctionListedItemsPageComponent', () => {
  let component: AuctionListedItemsPageComponent;
  let fixture: ComponentFixture<AuctionListedItemsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctionListedItemsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionListedItemsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
