import { Router } from 'express';
import authRoute from './auth.route';
import docsRoute from './docs.route';
import shopsRoute from './shops.route';
import uploadRoute from './upload.route';
import userRoute from './user.route';
import productRoute from './product.route';
import categoryRoute from './category.route';
import { env } from '@/config';

const router = Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/shops',
    route: shopsRoute,
  },
  {
    path: '/products',
    route: productRoute,
  },
  {
    path: '/categories',
    route: categoryRoute,
  },
  // {
  //   path: '/cart',
  //   route: cartRoute,
  // },
  {
    path: '/upload',
    route: uploadRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (env.node === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
