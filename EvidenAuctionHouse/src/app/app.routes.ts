import { Routes } from '@angular/router';
import { ItemCreationPageComponent } from './pages/item-creation-page/item-creation-page.component';
import { AuctionListPageComponent } from './pages/auction-list-page/auction-list-page.component';
import { ItemsListPageComponent } from './pages/items-list-page/items-list-page.component';
import { AuctionListedItemsPageComponent } from './pages/auction-listed-items-page/auction-listed-items-page.component';
import { ItemDetailPageComponent } from './pages/item-detail-page/item-detail-page.component'
import { AuctionCreationPageComponent } from './pages/auction-creation-page/auction-creation-page.component';
import { DummyPageComponent } from './pages/dummy-page/dummy-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { AdminGuard, AuthGuard } from './auth.guard';
import { UserInformationPageComponent } from './pages/user-information-page/user-information-page.component';
import { PasswordChangePageComponent } from './pages/password-change-page/password-change-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { EmailLandingPageComponent } from './pages/email-landing-page/email-landing-page.component';
import { EmailConfirmationPageComponent } from './pages/email-confirmation-page/email-confirmation-page.component';
import { CsvImportPageComponent } from './pages/csv-import-page/csv-import-page.component';
import { CsvPreviewPageComponent } from './pages/csv-preview-page/csv-preview-page.component';
import { ReportPageComponent } from './pages/report-page/report-page.component';
import { AdminRulesPageComponent } from './pages/admin-rules-page/admin-rules-page.component';
import { AdminContractsListComponent } from './pages/admin-contracts-list/admin-contracts-list.component';
import { ViewRulesPageComponent } from './pages/view-rules-page/view-rules-page.component';
import { ContractPreviewComponent } from './pages/contract-preview/contract-preview.component';
import { ContractSignPageComponent } from './pages/contract-sign-page/contract-sign-page.component';
export const routes: Routes = [
    { path: '', component: LoginPageComponent},
    { path: 'registration', component: RegisterPageComponent },
    { path: 'email-landing', component: EmailLandingPageComponent },
    { path: 'email-confirmation', component: EmailConfirmationPageComponent },
    { path: 'csv-import', component: CsvImportPageComponent, canActivate: [AdminGuard] },
    { path: 'csv-preview', component: CsvPreviewPageComponent, canActivate: [AdminGuard] },
    { path: 'auctions', component: AuctionListPageComponent, canActivate: [AuthGuard] },
    { path: 'create-item', component: ItemCreationPageComponent, canActivate: [AdminGuard] },
    { path: 'items', component: ItemsListPageComponent, canActivate: [AuthGuard] },
    { path: 'auctions/:id', component: AuctionListedItemsPageComponent, canActivate: [AuthGuard] },
    { path: 'items/:id', component: ItemDetailPageComponent, canActivate: [AuthGuard] },
    { path: 'create-auction', component:  AuctionCreationPageComponent, canActivate: [AdminGuard] },
    { path: 'create-auction/:id', component:  AuctionCreationPageComponent, canActivate: [AdminGuard] },
    { path: 'reload-dummy', component: DummyPageComponent, canActivate: [AdminGuard] },
    { path: 'user', component: UserInformationPageComponent, canActivate: [AuthGuard] },
    { path: 'user-password-change', component: PasswordChangePageComponent, canActivate: [AuthGuard] },
    { path: 'reports', component: ReportPageComponent, canActivate: [AdminGuard] },
    { path: 'admin/rules', component: AdminRulesPageComponent, canActivate: [AdminGuard] },
    { path: 'admin/contracts', component: AdminContractsListComponent, canActivate: [AdminGuard] },
    { path: 'rules', component: ViewRulesPageComponent, canActivate: [AuthGuard] },
    { path: 'contracts/preview/:id', component: ContractPreviewComponent, canActivate: [AuthGuard] },
    { path: 'contracts/sign/:id', component: ContractSignPageComponent },

];
