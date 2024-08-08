import { faker } from '@faker-js/faker';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

import app from '../../src/app';
import { setupTestDB } from '../utils/setupTestDB';
import { MARKETPLACE_CONFIG } from '@/config/enums/marketplace';
import { IUserDoc } from '@/interfaces/models/user';
import { User } from '@/models';

setupTestDB();

describe('Auth routes', () => {
  describe('POST /v1/auth/register', () => {
    let newUser: Partial<IUserDoc>;
    beforeEach(() => {
      newUser = {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: 'passworD1.',
        market_preferences: {
          region: MARKETPLACE_CONFIG.BASE_REGION,
          language: MARKETPLACE_CONFIG.BASE_LANGUAGE,
          currency: MARKETPLACE_CONFIG.BASE_CURRENCY,
        },
      };
    });

    test('should return 201 and successfully register user if request data-seed is ok', async () => {
      const res = await request(app).post('/v1/auth/register')
        .send(newUser)
        .expect(StatusCodes.CREATED);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).toEqual({
        id: expect.anything(),
        name: newUser.name,
        email: newUser.email,
        is_email_verified: false,
        market_preferences: newUser.market_preferences,
      });

      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser?.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({
        name: newUser.name,
        email: newUser.email,
      });

      expect(res.headers).toHaveProperty('set-cookie');
      expect(res.headers['set-cookie']).toHaveLength(2);
    });

    test('should return 400 error if email is invalid', async () => {
      newUser.email = 'invalidEmail';
      await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(StatusCodes.BAD_REQUEST);
    });

    // test('should return 400 error if email is already used', async () => {
    //   await insertUsers([userOne]);
    //   newUser.email = userOne.email;
    //
    //   console.log('new-user', newUser);
    //   await request(app)
    //     .post('/v1/auth/register')
    //     .send(newUser)
    //     .expect(StatusCodes.BAD_REQUEST);
    // });

    test('should return 400 error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';

      await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(StatusCodes.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      newUser.password = 'password';
      await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(StatusCodes.BAD_REQUEST);
    });
  });
});
