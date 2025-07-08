import { Module } from '@nestjs/common';
import { DbModule } from './db.module';
import { HealthcheckController } from './healthcheck/healthcheck.controller';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsService } from './tickets/tickets.service';

@Module({
  imports: [DbModule],
  controllers: [TicketsController, ReportsController, HealthcheckController],
  providers: [ReportsService, TicketsService],
})
export class AppModule {}
