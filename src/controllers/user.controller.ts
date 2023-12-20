import { catchAsync } from '@/utils';

const me = catchAsync(async (req, res) => {
  res.send({ user: req.user });
});

export const userController = {
  me,
};
