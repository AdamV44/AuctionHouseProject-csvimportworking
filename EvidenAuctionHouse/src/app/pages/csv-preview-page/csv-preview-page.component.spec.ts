import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsvPreviewPageComponent } from './csv-preview-page.component';

describe('CsvPreviewPageComponent', () => {
  let component: CsvPreviewPageComponent;
  let fixture: ComponentFixture<CsvPreviewPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsvPreviewPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CsvPreviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
