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
                    token: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        username: { type: 'string' },
                        role: { type: 'string' },
                      },
                    },
                  },
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
          error: {
            type: 'string',
            description: 'Mensaje descriptivo del error',
          },
          stack: {
            type: 'string',
            description: 'Stack trace (solo en desarrollo)',
          },
        },
        required: ['error'],
      },
    },
  },
};
