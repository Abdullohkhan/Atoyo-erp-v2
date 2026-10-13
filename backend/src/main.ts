import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module.js'

export async function createApp() {
  for (const k of ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!process.env[k]) throw new Error(`Environment variable ${k} is required (see backend/.env.example)`)
  }
  const app = await NestFactory.create(AppModule, { logger: process.env.NODE_ENV === 'test' ? false : undefined })
  app.setGlobalPrefix('api')
  app.use(helmet())
  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','), credentials: true })
  app.enableShutdownHooks()
  const config = new DocumentBuilder().setTitle('Atoyo ERP API').setVersion('2.0').addBearerAuth().build()
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, config))
  return app
}

if (process.argv[1]?.endsWith('main.js')) {
  const app = await createApp()
  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port)
  console.log(`API: http://localhost:${port}/api  ·  Swagger: http://localhost:${port}/api/docs`)
}
