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
import { TicketsController } from './tickets.controller';

describe('TicketsController', () => {
  let controller: TicketsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      imports: [DbModule],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();

    const res = await controller.findAll();
    console.log(res);
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

        const ticket = await controller.create({
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

        const ticket = await controller.create({
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
          controller.create({
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

        const ticket = await controller.create({
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
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Multiple users with role corporateSecretary. Cannot create a ticket`,
          ),
        );
      });

      it('if there is no secretary, throw', async () => {
        const company = await Company.create({ name: 'test' });

        await expect(
          controller.create({
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

        // Create first ticket successfully
        await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        // Attempt to create duplicate should throw
        await expect(
          controller.create({
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

        const firstTicket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        await Ticket.update(
          { status: TicketStatus.resolved },
          { where: { id: firstTicket.id } },
        );

        const secondTicket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(secondTicket.category).toBe(TicketCategory.corporate);
        expect(secondTicket.assigneeId).toBe(user.id);
        expect(secondTicket.status).toBe(TicketStatus.open);
      });

      it('should not affect managementReport ticket creation when registrationAddressChange exists', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Corporate Secretary',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });
        const accountant = await User.create({
          name: 'Accountant',
          role: UserRole.accountant,
          companyId: company.id,
        });
        await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        const managementTicket = await controller.create({
          companyId: company.id,
          type: TicketType.managementReport,
        });

        expect(managementTicket.category).toBe(TicketCategory.accounting);
        expect(managementTicket.assigneeId).toBe(accountant.id);
        expect(managementTicket.status).toBe(TicketStatus.open);
      });

      it('should fallback to Director when no Corporate Secretary exists', async () => {
        const company = await Company.create({ name: 'test' });
        const director = await User.create({
          name: 'Test Director',
          role: UserRole.director,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.assigneeId).toBe(director.id);
        expect(ticket.type).toBe(TicketType.registrationAddressChange);
        expect(ticket.category).toBe(TicketCategory.corporate);
      });

      it('should throw if multiple Directors exist in fallback scenario', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Director 1',
          role: UserRole.director,
          companyId: company.id,
        });
        await User.create({
          name: 'Director 2',
          role: UserRole.director,
          companyId: company.id,
        });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `No user with role ${UserRole.corporateSecretary} and Multiple users with role ${UserRole.director}. Cannot create a ticket`,
          ),
        );
      });

      it('should throw if no Corporate Secretary or Director exists', async () => {
        const company = await Company.create({ name: 'test' });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new ConflictException(
            `Cannot find user with role ${UserRole.corporateSecretary} to create a ticket`,
          ),
        );
      });
    });
  });

  describe('Director role', () => {
    it('should be able to create a user with Director role', async () => {
      const company = await Company.create({ name: 'test' });
      const director = await User.create({
        name: 'Test Director',
        role: UserRole.director,
        companyId: company.id,
      });

      expect(director.role).toBe(UserRole.director);
      expect(director.name).toBe('Test Director');
      expect(director.companyId).toBe(company.id);
    });
  });

  describe('Strike-off tickets', () => {
    it('should create a strikeOff ticket with Director assignment', async () => {
      const company = await Company.create({ name: 'test' });
      const director = await User.create({
        name: 'Test Director',
        role: UserRole.director,
        companyId: company.id,
      });

      const ticket = await controller.create({
        companyId: company.id,
        type: TicketType.strikeOff,
      });

      expect(ticket.type).toBe(TicketType.strikeOff);
      expect(ticket.category).toBe(TicketCategory.management);
      expect(ticket.assigneeId).toBe(director.id);
      expect(ticket.status).toBe(TicketStatus.open);
    });

    it('should throw error when multiple directors exist for strikeOff ticket', async () => {
      const company = await Company.create({ name: 'test' });
      await User.create({
        name: 'Director 1',
        role: UserRole.director,
        companyId: company.id,
      });
      await User.create({
        name: 'Director 2',
        role: UserRole.director,
        companyId: company.id,
      });

      await expect(
        controller.create({
          companyId: company.id,
          type: TicketType.strikeOff,
        }),
      ).rejects.toEqual(
        new ConflictException(
          `Multiple users with role ${UserRole.director}. Cannot create a ticket`,
        ),
      );
    });

    it('should throw error when no director exists for strikeOff ticket', async () => {
      const company = await Company.create({ name: 'test' });

      await expect(
        controller.create({
          companyId: company.id,
          type: TicketType.strikeOff,
        }),
      ).rejects.toEqual(
        new ConflictException(
          `Cannot find user with role ${UserRole.director} to create a ticket`,
        ),
      );
    });

    it('should resolve all other active tickets when a strikeOff ticket is created', async () => {
      const company = await Company.create({ name: 'test' });
      const secretary = await User.create({
        name: 'Test Secretary',
        role: UserRole.corporateSecretary,
        companyId: company.id,
      });
      const accountant = await User.create({
        name: 'Test Accountant',
        role: UserRole.accountant,
        companyId: company.id,
      });

      const regAddressTicket = await Ticket.create({
        type: TicketType.registrationAddressChange,
        companyId: company.id,
        assigneeId: secretary.id,
        category: TicketCategory.corporate,
        status: TicketStatus.open,
      });

      const mgmtReportTicket = await Ticket.create({
        type: TicketType.managementReport,
        companyId: company.id,
        assigneeId: accountant.id,
        category: TicketCategory.accounting,
        status: TicketStatus.open,
      });

      await controller.create({
        companyId: company.id,
        type: TicketType.strikeOff,
      });

      const updatedRegAddressTicket = await Ticket.findByPk(
        regAddressTicket.id,
      );
      const updatedMgmtReportTicket = await Ticket.findByPk(
        mgmtReportTicket.id,
      );

      expect(updatedRegAddressTicket).not.toBeNull();
      expect(updatedMgmtReportTicket).not.toBeNull();
      expect(updatedRegAddressTicket?.status).toBe(TicketStatus.resolved);
      expect(updatedMgmtReportTicket?.status).toBe(TicketStatus.resolved);
    });

    it('should not affect already resolved tickets when a strikeOff ticket is created', async () => {
      const company = await Company.create({ name: 'test' });
      const secretary = await User.create({
        name: 'Test Secretary',
        role: UserRole.corporateSecretary,
        companyId: company.id,
      });

      // Create already resolved ticket
      const resolvedTicket = await Ticket.create({
        type: TicketType.registrationAddressChange,
        companyId: company.id,
        assigneeId: secretary.id,
        category: TicketCategory.corporate,
        status: TicketStatus.resolved,
      });

      await controller.create({
        companyId: company.id,
        type: TicketType.strikeOff,
      });

      const updatedResolvedTicket = await Ticket.findByPk(resolvedTicket.id);
      expect(updatedResolvedTicket).not.toBeNull();
      expect(updatedResolvedTicket?.status).toBe(TicketStatus.resolved);
    });

    it('should not resolve tickets from other companies', async () => {
      const company1 = await Company.create({ name: 'company1' });
      const company2 = await Company.create({ name: 'company2' });

      const secretary2 = await User.create({
        name: 'Secretary 2',
        role: UserRole.corporateSecretary,
        companyId: company2.id,
      });

      const company2Ticket = await Ticket.create({
        type: TicketType.registrationAddressChange,
        companyId: company2.id,
        assigneeId: secretary2.id,
        category: TicketCategory.corporate,
        status: TicketStatus.open,
      });

      await controller.create({
        companyId: company1.id,
        type: TicketType.strikeOff,
      });

      // Verify company2's ticket is still open
      const updatedCompany2Ticket = await Ticket.findByPk(company2Ticket.id);
      expect(updatedCompany2Ticket).not.toBeNull();
      expect(updatedCompany2Ticket?.status).toBe(TicketStatus.open);
    });
  });
});
