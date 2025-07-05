import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Company } from '../../db/models/Company';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';
import { DbModule } from '../db.module';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [TicketsService],
      imports: [DbModule],
    }).compile();

    service = moduleRef.get<TicketsService>(TicketsService);
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all tickets with company and user data', async () => {
      const company = await Company.create({ name: 'test' });
      await User.create({
        name: 'Test User',
        role: UserRole.accountant,
        companyId: company.id,
      });

      await service.create({
        companyId: company.id,
        type: TicketType.managementReport,
      });

      const tickets = await service.findAll();
      expect(tickets).toBeDefined();
      expect(tickets.length).toBeGreaterThan(0);
    });
  });

  describe('create', () => {
    describe('managementReport', () => {
      it('creates managementReport ticket', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.accountant,
          companyId: company.id,
        });

        const ticket = await service.create({
          companyId: company.id,
          type: TicketType.managementReport,
        });

        expect(ticket.category).toBe(TicketCategory.accounting);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there are multiple accountants, assign the last one', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test User',
          role: UserRole.accountant,
          companyId: company.id,
        });
        const user2 = await User.create({
          name: 'Test User',
          role: UserRole.accountant,
          companyId: company.id,
        });

        const ticket = await service.create({
          companyId: company.id,
          type: TicketType.managementReport,
        });

        expect(ticket.category).toBe(TicketCategory.accounting);
        expect(ticket.assigneeId).toBe(user2.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there is no accountant, throw', async () => {
        const company = await Company.create({ name: 'test' });

        await expect(
          service.create({
            companyId: company.id,
            type: TicketType.managementReport,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Cannot find user with role accountant to create a ticket`,
          ),
        );
      });
    });

    describe('registrationAddressChange', () => {
      it('creates registrationAddressChange ticket', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        const ticket = await service.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.category).toBe(TicketCategory.corporate);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there are multiple secretaries, throw', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });
        await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        await expect(
          service.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Multiple users with role corporateSecretary. Cannot create a ticket`,
          ),
        );
      });

      it('if there is no secretary, assign to director if single director exists', async () => {
        const company = await Company.create({ name: 'test' });
        const director = await User.create({
          name: 'Test Director',
          role: UserRole.director,
          companyId: company.id,
        });

        const ticket = await service.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.category).toBe(TicketCategory.corporate);
        expect(ticket.assigneeId).toBe(director.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there is no secretary and multiple directors, throw', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test Director 1',
          role: UserRole.director,
          companyId: company.id,
        });
        await User.create({
          name: 'Test Director 2',
          role: UserRole.director,
          companyId: company.id,
        });

        await expect(
          service.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `No user with role corporateSecretary and Multiple users with role director. Cannot create a ticket`,
          ),
        );
      });

      it('if there is no secretary and no director, throw', async () => {
        const company = await Company.create({ name: 'test' });

        await expect(
          service.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Cannot find user with role corporateSecretary to create a ticket`,
          ),
        );
      });

      it('should prevent duplicate registrationAddressChange tickets for the same company', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        await service.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        await expect(
          service.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(new ConflictException('Duplicated Ticket'));
      });

      it('should allow registrationAddressChange ticket creation after previous is resolved', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        const firstTicket = await service.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        await Ticket.update(
          { status: TicketStatus.resolved },
          { where: { id: firstTicket.id } },
        );

        const secondTicket = await service.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(secondTicket.category).toBe(TicketCategory.corporate);
        expect(secondTicket.assigneeId).toBe(user.id);
        expect(secondTicket.status).toBe(TicketStatus.open);
      });
    });

    describe('strikeOff', () => {
      it('creates strikeOff ticket', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.director,
          companyId: company.id,
        });

        const ticket = await service.create({
          companyId: company.id,
          type: TicketType.strikeOff,
        });

        expect(ticket.category).toBe(TicketCategory.management);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there are multiple directors, throw', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test Director 1',
          role: UserRole.director,
          companyId: company.id,
        });
        await User.create({
          name: 'Test Director 2',
          role: UserRole.director,
          companyId: company.id,
        });

        await expect(
          service.create({
            companyId: company.id,
            type: TicketType.strikeOff,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Multiple users with role director. Cannot create a ticket`,
          ),
        );
      });

      it('if there is no director, throw', async () => {
        const company = await Company.create({ name: 'test' });

        await expect(
          service.create({
            companyId: company.id,
            type: TicketType.strikeOff,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Cannot find user with role director to create a ticket`,
          ),
        );
      });

      it('should resolve all other tickets when strikeOff is created', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test Director',
          role: UserRole.director,
          companyId: company.id,
        });
        await User.create({
          name: 'Test Secretary',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        const otherTicket1 = await service.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        const strikeOffTicket = await service.create({
          companyId: company.id,
          type: TicketType.strikeOff,
        });

        expect(strikeOffTicket.status).toBe(TicketStatus.open);

        const updatedOtherTicket = await Ticket.findByPk(otherTicket1.id);
        expect(updatedOtherTicket).not.toBeNull();
        expect(updatedOtherTicket!.status).toBe(TicketStatus.resolved);
      });
    });

    describe('other ticket types', () => {
      it('should assign to corporateSecretary by default', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        const ticket = await service.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.category).toBe(TicketCategory.corporate);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });
    });
  });
});
