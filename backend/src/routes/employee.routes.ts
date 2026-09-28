import { Router } from 'express';
import type { EmployeeController } from '../controllers/employee.controller';
import { validateBody } from '../middleware/validate';
import { employeeSchema } from '../validation/employee.schemas';

export function employeeRouter(controller: EmployeeController): Router {
  return Router()
    .post('/employees', validateBody(employeeSchema), controller.create)
    .get('/employees/:id', controller.getById)
    .put('/employees/:id', validateBody(employeeSchema), controller.update)
    .delete('/employees/:id', controller.remove);
}
