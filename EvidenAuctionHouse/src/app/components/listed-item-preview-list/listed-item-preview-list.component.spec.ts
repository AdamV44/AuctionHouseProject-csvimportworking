import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListedItemPreviewListComponent } from './listed-item-preview-list.component';

describe('ListedItemPreviewListComponent', () => {
  let component: ListedItemPreviewListComponent;
  let fixture: ComponentFixture<ListedItemPreviewListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListedItemPreviewListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListedItemPreviewListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
