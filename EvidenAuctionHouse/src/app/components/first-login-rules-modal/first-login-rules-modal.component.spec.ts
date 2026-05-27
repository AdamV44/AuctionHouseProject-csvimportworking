import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FirstLoginRulesModalComponent } from './first-login-rules-modal.component';
import { UserService } from '../../services/user.service';
import { settings } from '../../settings.config';
import { of } from 'rxjs';

describe('FirstLoginRulesModalComponent', () => {
	let fixture: ComponentFixture<FirstLoginRulesModalComponent>;
	let component: FirstLoginRulesModalComponent;
	let httpMock: HttpTestingController;

	const userServiceStub = {
		acceptRules: jasmine.createSpy('acceptRules').and.returnValue(of(null))
	} as unknown as Partial<UserService>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FirstLoginRulesModalComponent, HttpClientTestingModule],
			providers: [
				{ provide: UserService, useValue: userServiceStub }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(FirstLoginRulesModalComponent);
		component = fixture.componentInstance;
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('fetches rules from API when ruleBody input is empty and updates preview', () => {
		// ensure initial input is empty
		component.ruleBody = '';
		fixture.detectChanges(); // triggers ngOnInit

		const req = httpMock.expectOne(settings.apiRoute + '/rules/current');
		expect(req.request.method).toBe('GET');

		const mock = { id: '1', version: '1.0', title: 'T', body: '# Hello\n**bold**' };
		req.flush(mock);

		// After flush, component should have updated ruleBody and previewHtml
		expect(component.ruleBody).toBe(mock.body);
		expect(component.ruleTitle).toBe(mock.title);
		expect(component.previewHtml).toBeTruthy();
	});

	it('does not call API when ruleBody is provided as input', () => {
		component.ruleBody = 'Provided body';
		fixture.detectChanges();

		// Should not make any outstanding requests
		httpMock.expectNone(settings.apiRoute + '/rules/current');
		expect(component.ruleBody).toBe('Provided body');
	});

	it('onAccept calls userService.acceptRules and emits accepted event', (done) => {
		// subscribe to accepted output
		component.accepted.subscribe(() => {
			// ensure userService.acceptRules was called
			expect(userServiceStub.acceptRules).toHaveBeenCalled();
			done();
		});

		component.onAccept();
	});

});

