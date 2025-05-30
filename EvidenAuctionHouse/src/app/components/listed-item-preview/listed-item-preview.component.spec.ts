import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListedItemPreviewComponent } from './listed-item-preview.component';

describe('ListedItemPreviewComponent', () => {
  let component: ListedItemPreviewComponent;
  let fixture: ComponentFixture<ListedItemPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListedItemPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListedItemPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
