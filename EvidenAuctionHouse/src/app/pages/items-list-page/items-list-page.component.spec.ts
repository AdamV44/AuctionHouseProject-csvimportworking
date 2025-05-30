import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsListPageComponent } from './items-list-page.component';

describe('ItemsListPageComponent', () => {
  let component: ItemsListPageComponent;
  let fixture: ComponentFixture<ItemsListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemsListPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemsListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
