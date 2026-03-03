// ============================================================
// Configuración de Swagger / OpenAPI
// Documentación interactiva de la API del Simulador de Crédito.
// Disponible en /api/docs
// ============================================================

import type { JsonObject } from 'swagger-ui-express';

/**
 * Definición OpenAPI 3.0 para la API del Simulador de Crédito UPB.
 * Se usa como fuente de verdad para swagger-ui-express.
 */
export const swaggerDocument: JsonObject = {
  openapi: '3.0.3',
  info: {
    title: 'Simulador de Crédito UPB - API',
    description:
      'API RESTful para el Simulador de Crédito Educativo de la Universidad Pontificia Bolivariana. ' +
      'Permite autenticación LDAP, simulación de créditos con diferentes estrategias de amortización ' +
      'y administración de parámetros financieros.',
    version: '1.0.0',
    contact: {
      name: 'Equipo de Desarrollo UPB',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Servidor de desarrollo',
    },
  ],
  tags: [
    { name: 'Health', description: 'Verificación del estado del servicio' },
    { name: 'Auth', description: 'Autenticación y autorización (LDAP/JWT)' },
    { name: 'Simulator', description: 'Simulación de créditos educativos' },
    { name: 'Admin', description: 'Administración de parámetros financieros' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verificación de salud del servicio',
        description:
          'Retorna el estado del servidor y la marca de tiempo actual.',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Servicio activo',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok',
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                      example: '2026-02-22T12:00:00.000Z',
                    },
                  },
                  required: ['status', 'timestamp'],
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        description:
          'Autentica un usuario mediante credenciales LDAP/Active Directory y retorna un token JWT.',
        operationId: 'login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                    example: 'jperez',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    example: '********',
                  },
                },
                required: ['username', 'password'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Autenticación exitosa',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        identificationNumber: { type: 'string' },
                        role: { type: 'string' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                      required: [
                        'id',
                        'email',
                        'firstName',
                        'lastName',
                        'identificationNumber',
                        'role',
                        'isActive',
                        'createdAt',
                        'updatedAt',
                      ],
                    },
                    token: { type: 'string' },
                  },
                  required: ['user', 'token'],
                },
              },
            },
          },
          '400': {
            description: 'Campos requeridos faltantes',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Credenciales inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obtener usuario autenticado',
        description:
          'Retorna los datos del usuario autenticado (sin contraseña). Requiere un token JWT válido en el header Authorization.',
        operationId: 'getCurrentUser',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Usuario autenticado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        documentType: { type: 'string', enum: ['CC', 'TI'], nullable: true },
                        identificationNumber: { type: 'string' },
                        phone: { type: 'string', nullable: true },
                        role: { type: 'string', enum: ['STUDENT', 'ADMIN'] },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                      required: [
                        'id',
                        'email',
                        'firstName',
                        'lastName',
                        'identificationNumber',
                        'role',
                        'isActive',
                        'createdAt',
                        'updatedAt',
                      ],
                    },
                  },
                  required: ['user'],
                },
              },
            },
          },
          '401': {
            description: 'Token inválido, expirado o no proporcionado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Usuario no encontrado en la base de datos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/simulator/simulate': {
      post: {
        tags: ['Simulator'],
        summary: 'Simular un crédito educativo',
        description:
          'Calcula la tabla de amortización de un crédito según los parámetros proporcionados.',
        operationId: 'simulateCredit',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  amount: { type: 'number', example: 10000000 },
                  annualRate: { type: 'number', example: 12.5 },
                  termMonths: { type: 'integer', example: 36 },
                  amortizationType: {
                    type: 'string',
                    enum: ['FRENCH', 'GERMAN', 'AMERICAN'],
                    example: 'FRENCH',
                  },
                },
                required: [
                  'userId',
                  'amount',
                  'annualRate',
                  'termMonths',
                  'amortizationType',
                ],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Simulación exitosa',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    credit: { $ref: '#/components/schemas/Credit' },
                    schedule: { $ref: '#/components/schemas/AmortizationSchedule' },
                  },
                  required: ['credit', 'schedule'],
                },
              },
            },
          },
          '401': {
            description: 'No autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Estadísticas de administración',
        description:
          'Retorna estadísticas generales del sistema (cantidad de usuarios, simulaciones, etc.). ' +
          'Requiere autenticación y rol ADMIN.',
        operationId: 'getAdminStats',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Estadísticas obtenidas exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Estadísticas de administración' },
                    data: {
                      type: 'object',
                      properties: {
                        usersCount: { type: 'integer', example: 10 },
                        simulationsCount: { type: 'integer', example: 45 },
                      },
                      required: ['usersCount', 'simulationsCount'],
                    },
                  },
                  required: ['success', 'message', 'data'],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/401Unauthorized' },
          '403': { $ref: '#/components/responses/403Forbidden' },
        },
      },
    },
    '/admin/parameters': {
      get: {
        tags: ['Admin'],
        summary: 'Listar parámetros financieros',
        description:
          'Obtiene todos los parámetros financieros activos del sistema.',
        operationId: 'getParameters',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de parámetros financieros',
          },
          '401': {
            description: 'No autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/admin/parameters/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Actualizar un parámetro financiero',
        description: 'Actualiza el valor de un parámetro financiero existente.',
        operationId: 'updateParameter',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  value: { type: 'number', example: 15.5 },
                },
                required: ['value'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Parámetro actualizado',
          },
          '401': {
            description: 'No autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    responses: {
      '401Unauthorized': {
        description:
          'No autenticado — Token JWT ausente, inválido o expirado, o cuenta desactivada.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { success: false, error: { statusCode: 401, message: 'Token de autenticación requerido' } },
          },
        },
      },
      '403Forbidden': {
        description:
          'Prohibido — El usuario está autenticado pero su rol no tiene permiso para este recurso.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { success: false, error: { statusCode: 403, message: 'Acceso denegado. Se requiere uno de los roles: ADMIN' } },
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido del endpoint de login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Mensaje descriptivo del error',
              },
              statusCode: {
                type: 'integer',
                description: 'Código de estado HTTP',
              },
              stack: {
                type: 'string',
                description: 'Stack trace (solo en desarrollo)',
              },
            },
            required: ['message', 'statusCode'],
          },
        },
        required: ['success', 'error'],
      },
      Credit: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          amount: { type: 'number', example: 10000000 },
          annualRate: { type: 'number', example: 0.125 },
          termMonths: { type: 'integer', example: 36 },
          amortizationType: {
            type: 'string',
            enum: ['FRENCH'],
            example: 'FRENCH',
          },
          monthlyPayment: { type: 'number', example: 334819.45 },
          totalInterest: { type: 'number', example: 2053500.2 },
          totalPayment: { type: 'number', example: 12053500.2 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'userId',
          'amount',
          'annualRate',
          'termMonths',
          'amortizationType',
          'monthlyPayment',
          'totalInterest',
          'totalPayment',
          'createdAt',
          'updatedAt',
        ],
      },
      AmortizationSchedule: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            period: { type: 'integer', example: 1 },
            payment: { type: 'number', example: 334819.45 },
            interest: { type: 'number', example: 104166.67 },
            principal: { type: 'number', example: 230652.78 },
            balance: { type: 'number', example: 9769347.22 },
          },
          required: ['period', 'payment', 'interest', 'principal', 'balance'],
        },
      },
    },
  },
};
