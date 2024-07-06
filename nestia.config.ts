import { INestiaConfig } from '@nestia/sdk';

const config: INestiaConfig = {
  input: 'src/**/*.controller.ts',
  output: 'docs/swagger.json',
  swagger: {
    output: 'docs/swagger.json',
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Server',
      },
    ],
    info: {
      title: 'E-Commerce API',
      version: '1.0.0',
      description: 'API for managing e-commerce operations',
    },
  },
};

export default config;
