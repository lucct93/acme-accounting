import { Body, Controller, Get, Post } from '@nestjs/common';
import { newTicketDto, TicketDto, TicketsService } from './tickets.service';

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async findAll() {
    return await this.ticketsService.findAll();
  }

  @Post()
  async create(@Body() newTicketDto: newTicketDto): Promise<TicketDto> {
    return await this.ticketsService.create(newTicketDto);
  }
}
