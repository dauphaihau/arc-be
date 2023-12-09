import mongoose, { ClientSession } from 'mongoose';

export const transactionWrapper = async (callback: (session: ClientSession) => unknown) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await callback(session);
    await session.commitTransaction();
    await session.endSession();
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};
