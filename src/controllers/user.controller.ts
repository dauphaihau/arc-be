import { Request } from 'express';
import { UpdateUserBody } from '@/interfaces/models/user';
import { userService } from '@/services';
import { catchAsync, transactionWrapper } from '@/utils';

const me = catchAsync(async (req, res) => {
  res.send({ user: req.user });
});

const updateUser = catchAsync(async (
  req: Request<unknown, unknown, UpdateUserBody>,
  res
) => {
  await transactionWrapper(async (session) => {
    const userUpdated = await userService.updateUserById(req.user.id, req.body, session);
    res.send({ user: userUpdated });
  });
});

export const userController = {
  me,
  updateUser,
};
