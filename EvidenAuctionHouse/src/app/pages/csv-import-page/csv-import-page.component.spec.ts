import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsvImportPageComponent } from './csv-import-page.component';

describe('CsvImportPageComponent', () => {
  let component: CsvImportPageComponent;
  let fixture: ComponentFixture<CsvImportPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsvImportPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CsvImportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
