import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import { AllExceptionsFilter } from './exceptions/all-exceptions.filter';
import { DatabaseExceptionFilter } from './exceptions/database-exception.filter';
import { HttpExceptionFilter } from './exceptions/http-exception.filter';
import { ValidationExceptionFilter } from './exceptions/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.setGlobalPrefix('api/');

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI, // Use URI-based versioning
  });

  // Global Filters
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new AllExceptionsFilter(),
    new ValidationExceptionFilter(),
    new DatabaseExceptionFilter(),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('SaaS Subscription Billing')
    .setDescription(
      'A billing app for a SaaS platform that supports multiple subscription tiers and handles recurring billing.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();
