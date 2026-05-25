import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAuctionDialogComponent } from './delete-auction-dialog.component';

describe('DeleteAuctionDialogComponent', () => {
  let component: DeleteAuctionDialogComponent;
  let fixture: ComponentFixture<DeleteAuctionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteAuctionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteAuctionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
