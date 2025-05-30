import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailLandingPageComponent } from './email-landing-page.component';

describe('EmailLandingPageComponent', () => {
  let component: EmailLandingPageComponent;
  let fixture: ComponentFixture<EmailLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailLandingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
