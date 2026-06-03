import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:4200').replace(/\/$/, '');
  app.enableCors({
    origin: (requestOrigin: string | undefined, callback: (err: Error | null, origin?: string | boolean) => void) => {
      if (!requestOrigin || requestOrigin.replace(/\/$/, '') === frontendUrl) {
        callback(null, frontendUrl);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`WarrantyVault API running on port ${port}`);
}
bootstrap();
