import type { RequestHandler } from 'express';
import { EmployeeNotFoundError } from '../errors';
import type { EmployeePage, EmployeeService, EmployeeWithCurrency } from '../services/employee.service';
import type { EmployeeListParams, EmployeeRequest } from '../validation/employee.schemas';

type IdParams = { id: string };
type NoParams = Record<string, string>;
type ValidatedQuery<Query> = { query: Query };

// An id that can't exist, such as "abc", is simply an employee we don't have
function parseEmployeeId(raw: string): number {
  const id = Number(raw);
  if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(id)) {
    throw new EmployeeNotFoundError(raw);
  }
  return id;
}

export function createEmployeeController(service: EmployeeService) {
  const list: RequestHandler<NoParams, EmployeePage, unknown, unknown, ValidatedQuery<EmployeeListParams>> = async (
    _req,
    res,
  ) => {
    res.status(200).json(await service.list(res.locals.query));
  };

  const create: RequestHandler<NoParams, EmployeeWithCurrency, EmployeeRequest> = async (req, res) => {
    res.status(201).json(await service.create(req.body));
  };

  const getById: RequestHandler<IdParams, EmployeeWithCurrency> = async (req, res) => {
    res.status(200).json(await service.getById(parseEmployeeId(req.params.id)));
  };

  const update: RequestHandler<IdParams, EmployeeWithCurrency, EmployeeRequest> = async (req, res) => {
    res.status(200).json(await service.update(parseEmployeeId(req.params.id), req.body));
  };

  const remove: RequestHandler<IdParams> = async (req, res) => {
    await service.delete(parseEmployeeId(req.params.id));
    res.status(204).end();
  };

  return { list, create, getById, update, remove };
}

export type EmployeeController = ReturnType<typeof createEmployeeController>;
