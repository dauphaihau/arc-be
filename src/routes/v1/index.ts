import { Router } from 'express';
import authRoute from './auth.route';
import docsRoute from './docs.route';
import shopRoute from './shop.route';
import uploadRoute from './upload.route';
import cartRoute from './cart.route';
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
    path: '/shops',
    route: shopRoute,
  },
  {
    path: '/upload',
    route: uploadRoute,
  },
  {
    path: '/cart',
    route: cartRoute,
  },
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/products',
    route: productRoute,
  },
  {
    path: '/categories',
    route: categoryRoute,
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
