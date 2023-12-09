import { version } from '../../package.json';
import { env } from '@/config';

export const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Arc Ecommerce API Docs',
    version,
    license: {
      name: 'Contact to developer',
      url: 'mailto:hautran.job@outlook.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.port}/v1`,
    },
  ],
};
