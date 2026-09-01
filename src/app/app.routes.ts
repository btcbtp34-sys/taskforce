import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CustomerListComponent } from './features/customers/customer-list.component';
import { CustomerDetailComponent } from './features/customers/customer-detail.component';
import { DataImportComponent } from './features/data-import/data-import.component';
import { AnalyticsComponent } from './features/analytics/analytics.component';
import { OpportunitiesComponent } from './features/opportunities/opportunities.component';
import { BusinessCaseComponent } from './features/business-case/business-case.component';
import { WorkspaceComponent } from './features/workspace/workspace.component';
import { ReportsComponent } from './features/reports/reports.component';
import { ArchitectureMapComponent } from './features/architecture-map/architecture-map.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'customers', component: CustomerListComponent },
  { path: 'customers/:id', component: CustomerDetailComponent },
  { path: 'architecture-map', component: ArchitectureMapComponent },
  { path: 'data-import', component: DataImportComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'opportunities', component: OpportunitiesComponent },
  { path: 'business-case', component: BusinessCaseComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'workspace', redirectTo: 'dashboard' },
  { path: 'presentation', redirectTo: 'reports' },
  { path: 'ai-assistant', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
