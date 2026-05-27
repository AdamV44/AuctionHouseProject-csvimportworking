import { Component } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { AuctionsService } from '../../services/auctions.service';
// AdminService removed: page is accessible only to admins so admin-config toggle is unnecessary
import { AuthenticationService } from '../../services/authentication.service';
import { Auction } from '../../../models/auction';

@Component({
	selector: 'app-report-page',
	standalone: true,
	imports: [NgFor, NgIf, DatePipe, DecimalPipe],
	templateUrl: './report-page.component.html',
	styleUrls: ['./report-page.component.scss']
})
export class ReportPageComponent {
	finishedAuctions: Auction[] = [];
	loaded = false;
	selectedAuction: Auction | null = null;
	soldItems: any[] = [];
	unsoldItems: any[] = [];
	totalRevenue: number = 0;

	loadingReport = false;
	errorMessage: string | null = null;

	constructor(private auctionsService: AuctionsService, public auth: AuthenticationService) {
		this.loadFinishedAuctions();
	}

	private loadFinishedAuctions() {
		this.loaded = false;
		this.auctionsService.getAuctions().subscribe(list => {
			const now = new Date();
			// finished = auctions whose endDate is before now
			this.finishedAuctions = (list || []).filter((a: any) => new Date(a.endDate) < now);
			// sort newest-first
			this.finishedAuctions.sort((x: any, y: any) => new Date(y.endDate).getTime() - new Date(x.endDate).getTime());
			this.loaded = true;
		}, err => {
			console.error('Failed to load auctions for reports', err);
			this.loaded = true;
			this.errorMessage = 'Nelze načíst seznam aukcí';
		});
	}

	selectAuction(a: Auction) {
		this.selectedAuction = a;
		this.errorMessage = null;
		this.soldItems = [];
		this.unsoldItems = [];
		this.totalRevenue = 0;
		if (!a) return;
		this.loadReport(a.id);
	}

	private loadReport(auctionId: string) {
		this.loadingReport = true;
		this.errorMessage = null;
		let reportObs = this.auctionsService.getAuctionReport(auctionId);
	// reports page is admin-only; always use standard report endpoint
		reportObs.subscribe((report: any) => {
			this.soldItems = report?.soldItems || report?.SoldItems || [];
			this.unsoldItems = report?.unsoldItems || report?.UnsoldItems || [];
			this.totalRevenue = report?.totalRevenue || report?.TotalRevenue || 0;
			this.loadingReport = false;
		}, err => {
			console.error('Failed to load auction report', err);
			this.errorMessage = err?.error?.message || err?.message || 'Chyba při načítání reportu';
			this.loadingReport = false;
		});
	}

	// sensitive-toggle removed from template; no handler needed

	exportCsv() {
		if (!this.selectedAuction) return;
		const rows: any[] = [];
		rows.push(['Auction', this.selectedAuction.name]);
		rows.push(['Period', `${new Date(this.selectedAuction.startDate).toLocaleDateString()} - ${new Date(this.selectedAuction.endDate).toLocaleDateString()}`]);
		rows.push(['TotalRevenue', this.totalRevenue.toString()]);
		rows.push([]);
		rows.push(['Sold items']);
		// include winner full name and email if available
		rows.push(['Id', 'Name', 'FinalPrice', 'WinnerName', 'WinnerEmail']);
		this.soldItems.forEach(s => rows.push([
			s.Id || s.id || '',
			s.Name || s.name || '',
			(s.FinalPrice ?? s.finalPrice ?? '').toString(),
			(s.WinnerFullName || s.winnerFullName || ''),
			(s.WinnerEmail || s.winnerEmail || '')
		]));
		rows.push([]);
		rows.push(['Unsold items']);
		rows.push(['Id', 'Name', 'StartingPrice']);
		this.unsoldItems.forEach(u => rows.push([u.Id || u.id || '', u.Name || u.name || '', (u.StartingPrice ?? u.startingPrice ?? '').toString()]));

		const csv = rows.map(r => r.map((c: any) => '"' + String(c ?? '') + '"').join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		const safeName = (this.selectedAuction.name || 'report').replace(/[^a-z0-9_\-]+/ig, '_');
		a.download = `${safeName}_report.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	finalize() {
		if (!this.selectedAuction) return;
		this.loadingReport = true;
		this.auctionsService.finalizeAuction(this.selectedAuction.id).subscribe(_ => {
			// reload lists and report
			this.loadFinishedAuctions();
			this.loadReport(this.selectedAuction!.id);
		}, err => {
			this.errorMessage = 'Chyba při finalizaci aukce: ' + (err?.error?.message || err?.message || 'unknown');
			this.loadingReport = false;
		});
	}

	getWinnerInitial(fullName: string) {
		if (!fullName) return '-';
		const tokens = fullName.trim().split(/\s+/);
		if (tokens.length === 0) return '-';
		const first = tokens[0];
		return first.charAt(0).toUpperCase() + '.';
	}
}
