import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { PrismaService } from './common/prisma.service.js'
import { AuditService } from './common/audit.service.js'
import { AllExceptionsFilter } from './common/errors.js'
import { SerializeInterceptor } from './common/serialize.js'
import { AuthGuard } from './auth/auth.guard.js'
import { AuthService } from './auth/auth.service.js'
import { AuthController } from './auth/auth.controller.js'
import { UsersController } from './users/users.controller.js'
import { RolesController } from './users/roles.controller.js'
import { catalogControllers } from './catalog/catalog.controllers.js'
import { StockService } from './stock/stock.service.js'
import { StockController } from './stock/stock.controller.js'
import { FinanceService } from './finance/finance.service.js'
import { MoneyController, PurchaseOrdersController, SaleOrdersController } from './finance/finance.controllers.js'
import { NotificationsService } from './requests/notifications.service.js'
import { RequestsService } from './requests/requests.service.js'
import { RequestsController } from './requests/requests.controller.js'
import { DocumentsController } from './documents/documents.controller.js'
import { SystemController } from './system/system.controller.js'

@Module({
  imports: [JwtModule.register({})],
  controllers: [
    AuthController, UsersController, RolesController, ...catalogControllers, StockController,
    SaleOrdersController, PurchaseOrdersController, MoneyController, RequestsController, DocumentsController, SystemController,
  ],
  providers: [
    PrismaService, AuditService, AuthService, StockService, FinanceService, NotificationsService, RequestsService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: SerializeInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
