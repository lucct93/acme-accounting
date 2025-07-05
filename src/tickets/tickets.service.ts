import { ConflictException, Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { Company } from '../../db/models/Company';
import { Ticket, TicketCategory, TicketStatus, TicketType } from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';

export interface newTicketDto {
  type: TicketType;
  companyId: number;
}

export interface TicketDto {
  id: number;
  type: TicketType;
  companyId: number;
  assigneeId: number;
  status: TicketStatus;
  category: TicketCategory;
}

@Injectable()
export class TicketsService {
  async findAll() {
    return await Ticket.findAll({ include: [Company, User] });
  }

  async create(newTicketDto: newTicketDto) {
    const { type, companyId } = newTicketDto;

    if (type === TicketType.registrationAddressChange) {
      const count = await Ticket.count({
        where: {
          type: TicketType.registrationAddressChange,
          companyId,
          status: {
            [Op.ne]: TicketStatus.resolved,
          },
        },
      });
      if (count > 0) {
        throw new ConflictException('Duplicated Ticket');
      }
    }

    let category: TicketCategory;
    switch (type) {
      case TicketType.managementReport:
        category = TicketCategory.accounting;
        break;
      case TicketType.strikeOff:
        category = TicketCategory.management;
        break;
      default:
        category = TicketCategory.corporate;
        break;
    }

    let userRole: UserRole;
    switch (type) {
      case TicketType.managementReport:
        userRole = UserRole.accountant;
        break;
      case TicketType.strikeOff:
        userRole = UserRole.director;
        break;
      default:
        userRole = UserRole.corporateSecretary;
        break;
    }

    let assignees = await User.findAll({
      where: { companyId, role: userRole },
      order: [['createdAt', 'DESC']],
    });

    if (!assignees.length) {
      // We have a rule that, if we cannot find a corporate secretary, assign it to the `Director` for registrationAddressChange type
      // If there are multiple directors, throw an error.
      if (type === TicketType.registrationAddressChange) {
        const directors = await User.findAll({
          where: { companyId, role: UserRole.director },
        });
        if (directors.length > 1) {
          throw new ConflictException(
            `No user with role ${userRole} and Multiple users with role ${UserRole.director}. Cannot create a ticket`,
          );
        }

        if (directors.length === 1) {
          assignees = directors;
        } else {
          throw new ConflictException(`Cannot find user with role ${userRole} to create a ticket`);
        }
      } else {
        throw new ConflictException(`Cannot find user with role ${userRole} to create a ticket`);
      }
    }

    if (assignees.length > 1) {
      // For accountant role, take the most recent (last) one
      // For corporateSecretary and director roles, throw an error
      if (userRole === UserRole.corporateSecretary || userRole === UserRole.director) {
        throw new ConflictException(`Multiple users with role ${userRole}. Cannot create a ticket`);
      }
    }

    const assignee = assignees[0];

    const ticket = await Ticket.create({
      companyId,
      assigneeId: assignee.id,
      category,
      type,
      status: TicketStatus.open,
    });
    // strikeOff is a specific ticket. If this kind of ticket created, should resolve all other tickets
    if (type === TicketType.strikeOff) {
      await Ticket.update(
        {
          status: TicketStatus.resolved,
        },
        {
          where: {
            companyId,
            id: { [Op.ne]: ticket.id },
          },
        },
      );
    }

    const ticketDto: TicketDto = {
      id: ticket.id,
      type: ticket.type,
      assigneeId: ticket.assigneeId,
      status: ticket.status,
      category: ticket.category,
      companyId: ticket.companyId,
    };

    return ticketDto;
  }
}
