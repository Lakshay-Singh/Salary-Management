import { Prisma, type PrismaClient } from '@prisma/client';
import { MAX_DB_INTEGER } from '../../domain/limits';
import type {
  Employee,
  EmployeeInput,
  EmployeeListQuery,
  EmployeeListResult,
  EmployeeRepository,
  PeerStats,
} from '../employee.repository';

// Exactly the fields of Employee, so timestamps never leak out of the repository
const EMPLOYEE_FIELDS = { id: true, fullName: true, jobTitle: true, countryCode: true, salary: true } as const;

export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list({
    page,
    pageSize,
    search,
    countryCode,
    jobTitle,
    sortBy,
    sortOrder = 'asc',
  }: EmployeeListQuery): Promise<EmployeeListResult> {
    // An empty filter (e.g. "?countryCode=" from a cleared dropdown) means "no filter", not "match nothing"
    const where: Prisma.EmployeeWhereInput = {
      countryCode: countryCode || undefined,
      jobTitle: jobTitle || undefined,
      fullName: search ? { contains: literalLikeText(search), mode: 'insensitive' } : undefined,
    };
    // sortBy is limited to scalar columns by EMPLOYEE_SORT_FIELDS; id always breaks ties so pages stay stable
    const orderBy = [
      ...(sortBy ? [{ [sortBy]: sortOrder } as Prisma.EmployeeOrderByWithRelationInput] : []),
      { id: 'asc' as const },
    ];

    // Repeatable read gives both queries the same snapshot, so the total always matches the rows
    const [data, total] = await this.prisma.$transaction(
      [
        this.prisma.employee.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: EMPLOYEE_FIELDS,
        }),
        this.prisma.employee.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return { data, total };
  }

  create(input: EmployeeInput): Promise<Employee> {
    return this.prisma.employee.create({ data: input, select: EMPLOYEE_FIELDS });
  }

  async findById(id: number): Promise<Employee | null> {
    if (!isStorableId(id)) return null;
    return this.prisma.employee.findUnique({ where: { id }, select: EMPLOYEE_FIELDS });
  }

  async update(id: number, input: EmployeeInput): Promise<Employee | null> {
    if (!isStorableId(id)) return null;
    try {
      return await this.prisma.employee.update({ where: { id }, data: input, select: EMPLOYEE_FIELDS });
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    if (!isStorableId(id)) return false;
    try {
      await this.prisma.employee.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) return false;
      throw error;
    }
  }

  async getPeerStats(id: number): Promise<PeerStats> {
    if (!isStorableId(id)) return { peerCount: 0, peerAverage: null };
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: { countryCode: true, jobTitle: true },
    });
    if (!employee) return { peerCount: 0, peerAverage: null };

    const { _count, _avg } = await this.prisma.employee.aggregate({
      where: { countryCode: employee.countryCode, jobTitle: employee.jobTitle, id: { not: id } },
      _count: { _all: true },
      _avg: { salary: true },
    });
    return { peerCount: _count._all, peerAverage: _avg.salary };
  }

  // groupBy runs GROUP BY in Postgres; findMany's distinct would fetch every row and de-duplicate in Node
  async getJobTitles(countryCode?: string): Promise<string[]> {
    const groups = await this.prisma.employee.groupBy({
      by: ['jobTitle'],
      where: { countryCode: countryCode || undefined },
    });
    return groups.map((group) => group.jobTitle);
  }
}

// A larger id cannot exist in an INTEGER column, and Prisma throws an unknown request error instead of finding nothing
function isStorableId(id: number): boolean {
  return id <= MAX_DB_INTEGER;
}

function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

// Prisma's `contains` becomes ILIKE without escaping, so "%" or "_" in a search would act as wildcards.
// Escape them, and the escape character itself (backslash, Postgres's default LIKE escape), to match text literally.
const LIKE_ESCAPE = String.fromCharCode(92);
const LIKE_SPECIAL = new Set([LIKE_ESCAPE, '%', '_']);

function literalLikeText(text: string): string {
  return [...text].map((char) => (LIKE_SPECIAL.has(char) ? LIKE_ESCAPE + char : char)).join('');
}
