import { Company } from '../../../db/models/Company';
import { Ticket, TicketCategory, TicketStatus, TicketType } from '../../../db/models/Ticket';
import { User, UserRole } from '../../../db/models/User';

export class SeedRunner {
  static async seedCompanies() {
    console.log('Seeding companies...');

    const companies = [
      { id: 1, name: 'ACME Corporation' },
      { id: 2, name: 'TechStart Inc' },
      { id: 3, name: 'Global Solutions Ltd' },
      { id: 4, name: 'Innovation Hub Co' },
      { id: 5, name: 'Future Ventures LLC' },
    ];

    for (const companyData of companies) {
      await Company.upsert(companyData);
    }

    console.log(`Created ${companies.length} companies`);
  }

  static async seedUsers() {
    console.log('Seeding users...');

    const users = [
      { id: 1, name: 'John Smith', role: UserRole.accountant, companyId: 1 },
      { id: 2, name: 'Sarah Wilson', role: UserRole.corporateSecretary, companyId: 1 },
      { id: 3, name: 'Michael Johnson', role: UserRole.director, companyId: 1 },

      { id: 4, name: 'Emily Chen', role: UserRole.accountant, companyId: 2 },
      { id: 5, name: 'David Rodriguez', role: UserRole.director, companyId: 2 },

      { id: 6, name: 'Lisa Anderson', role: UserRole.corporateSecretary, companyId: 3 },
      { id: 7, name: 'Robert Brown', role: UserRole.accountant, companyId: 3 },
      { id: 8, name: 'Jennifer Davis', role: UserRole.director, companyId: 3 },

      { id: 9, name: 'Mark Thompson', role: UserRole.accountant, companyId: 4 },
      { id: 10, name: 'Jessica Miller', role: UserRole.accountant, companyId: 4 },
      { id: 11, name: 'Alex Turner', role: UserRole.director, companyId: 4 },

      { id: 12, name: 'Rachel Green', role: UserRole.director, companyId: 5 },
    ];

    for (const userData of users) {
      await User.upsert(userData);
    }

    console.log(`Created ${users.length} users`);
  }

  static async seedTickets() {
    const tickets = [
      {
        id: 1,
        type: TicketType.managementReport,
        status: TicketStatus.open,
        category: TicketCategory.accounting,
        companyId: 1,
        assigneeId: 1,
      },
      {
        id: 2,
        type: TicketType.registrationAddressChange,
        status: TicketStatus.resolved,
        category: TicketCategory.corporate,
        companyId: 1,
        assigneeId: 2,
      },

      {
        id: 3,
        type: TicketType.managementReport,
        status: TicketStatus.open,
        category: TicketCategory.accounting,
        companyId: 2,
        assigneeId: 4,
      },

      {
        id: 4,
        type: TicketType.registrationAddressChange,
        status: TicketStatus.open,
        category: TicketCategory.corporate,
        companyId: 3,
        assigneeId: 6,
      },
      {
        id: 5,
        type: TicketType.managementReport,
        status: TicketStatus.resolved,
        category: TicketCategory.accounting,
        companyId: 3,
        assigneeId: 7,
      },
      {
        id: 6,
        type: TicketType.managementReport,
        status: TicketStatus.open,
        category: TicketCategory.accounting,
        companyId: 4,
        assigneeId: 10,
      },
    ];

    for (const ticketData of tickets) {
      await Ticket.upsert(ticketData);
    }

    console.log(`Created ${tickets.length} tickets`);
  }

  static async seedAll() {
    console.log('Starting database seeding...');

    try {
      await this.seedCompanies();
      await this.seedUsers();
      await this.seedTickets();

      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Seeding failed:', error);
      throw error;
    }
  }

  static async clearAll() {
    console.log('Clearing all data...');

    try {
      await Ticket.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
      await Company.destroy({ where: {}, force: true });

      console.log('All data cleared successfully!');
    } catch (error) {
      console.error('Clear failed:', error);
      throw error;
    }
  }
}
