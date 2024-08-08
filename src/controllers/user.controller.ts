import { RequestBody } from '@/interfaces/express';
import { UpdateUserBody } from '@/interfaces/models/user';
import { userService } from '@/services';
import { catchAsync, transactionWrapper } from '@/utils';

const getCurrentUser = catchAsync(async (req, res) => {
  res.send({ user: req.user });
});

const updateUser = catchAsync(async (
  req: RequestBody<UpdateUserBody>,
  res
) => {
  await transactionWrapper(async (session) => {
    const userUpdated = await userService.updateById(req.user.id, req.body, session);
    res.send({ user: userUpdated });
  });
});

export const userController = {
  getCurrentUser,
  updateUser,
};
