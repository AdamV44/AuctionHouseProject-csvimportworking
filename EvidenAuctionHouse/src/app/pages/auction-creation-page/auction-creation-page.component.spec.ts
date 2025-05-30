import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionCreationPageComponent } from './auction-creation-page.component';

describe('AuctionCreationPageComponent', () => {
  let component: AuctionCreationPageComponent;
  let fixture: ComponentFixture<AuctionCreationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuctionCreationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionCreationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
