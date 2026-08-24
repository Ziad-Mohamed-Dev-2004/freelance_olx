import fs from 'fs';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config/env.config';

/** Resolve route + app files for swagger-jsdoc in both dev (ts) and prod (js) */
function getSwaggerApiFiles(): string[] {
  const files: string[] = [];
  const routesDir = path.join(__dirname, '../routes');

  if (fs.existsSync(routesDir)) {
    const routeFiles = fs
      .readdirSync(routesDir)
      .filter((file) => file.endsWith('.route.ts') || file.endsWith('.route.js'))
      .sort();

    files.push(...routeFiles.map((file) => path.join(routesDir, file)));
  }

  const appJs = path.join(__dirname, '../app.js');
  const appTs = path.join(__dirname, '../app.ts');

  if (fs.existsSync(appJs)) {
    files.push(appJs);
  } else if (fs.existsSync(appTs)) {
    files.push(appTs);
  }

  return files.map((file) => file.split(path.sep).join('/'));
}

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OLX Clone – Property Rental API',
      version: '1.0.0',
      description:
        'Production-ready REST API for a property rental platform. Built with Node.js, Express, MongoDB, and TypeScript.',
      contact: {
        name: 'API Support',
        email: 'support@olxclone.com',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Current Deployment',
      },
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Local Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your access token obtained from /auth/login or /auth/register',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
            errors: {
              type: 'array',
              items: { type: 'object' },
            },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1b2c3d4e5f67890abcdef' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            phone: { type: 'string', example: '+201100341767' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'blocked', 'suspended'],
              example: 'active',
            },
            isPhoneVerified: { type: 'boolean', example: false },
            isEmailVerified: { type: 'boolean', example: false },
            isDeleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TokenPair: {
          type: 'object',
          properties: {
            access: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                expires: { type: 'string', format: 'date-time' },
              },
            },
            refresh: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                expires: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        // Category Schemas
        CategoryResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1b2c3d4e5f67890abcdef' },
            name: { type: 'string', example: 'Apartments' },
            slug: { type: 'string', example: 'apartments' },
            icon: { type: 'string', example: 'building-icon' },
            image: {
              type: 'string',
              example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            },
            parentCategory: { type: 'object', nullable: true },
            isActive: { type: 'boolean', example: true },
            isDeleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateCategoryInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Apartments' },
            icon: { type: 'string', example: 'building-icon' },
            image: {
              type: 'string',
              example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            },
            parentCategory: { type: 'string', nullable: true, example: '64a1b2c3d4e5f67890abcdef' },
            isActive: { type: 'boolean', default: true },
          },
        },
        UpdateCategoryInput: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Residential Apartments' },
            icon: { type: 'string', example: 'building-icon-v2' },
            image: { type: 'string', example: 'https://example.com/image-v2.jpg' },
            parentCategory: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
          },
        },
        PaginatedCategories: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CategoryResponse' },
            },
            total: { type: 'number', example: 50 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 5 },
          },
        },
        // City Schemas
        CityResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1b2c3d4e5f67890abcde1' },
            name: { type: 'string', example: 'Cairo' },
            slug: { type: 'string', example: 'cairo' },
            governorate: { type: 'string', example: 'Cairo Governorate' },
            latitude: { type: 'number', example: 30.0444 },
            longitude: { type: 'number', example: 31.2357 },
            isActive: { type: 'boolean', example: true },
            isDeleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateCityInput: {
          type: 'object',
          required: ['name', 'governorate'],
          properties: {
            name: { type: 'string', example: 'Cairo' },
            governorate: { type: 'string', example: 'Cairo Governorate' },
            latitude: { type: 'number', example: 30.0444 },
            longitude: { type: 'number', example: 31.2357 },
            isActive: { type: 'boolean', default: true },
          },
        },
        UpdateCityInput: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Greater Cairo' },
            governorate: { type: 'string', example: 'Cairo Governorate' },
            latitude: { type: 'number', example: 30.0444 },
            longitude: { type: 'number', example: 31.2357 },
            isActive: { type: 'boolean' },
          },
        },
        PaginatedCities: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CityResponse' },
            },
            total: { type: 'number', example: 27 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 3 },
          },
        },
        // Area Schemas
        AreaResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1b2c3d4e5f67890abcde2' },
            city: { $ref: '#/components/schemas/CityResponse' },
            name: { type: 'string', example: 'Maadi' },
            slug: { type: 'string', example: 'maadi' },
            latitude: { type: 'number', example: 29.9602 },
            longitude: { type: 'number', example: 31.2569 },
            isActive: { type: 'boolean', example: true },
            isDeleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateAreaInput: {
          type: 'object',
          required: ['city', 'name'],
          properties: {
            city: { type: 'string', example: '64a1b2c3d4e5f67890abcde1' },
            name: { type: 'string', example: 'Maadi' },
            latitude: { type: 'number', example: 29.9602 },
            longitude: { type: 'number', example: 31.2569 },
            isActive: { type: 'boolean', default: true },
          },
        },
        UpdateAreaInput: {
          type: 'object',
          properties: {
            city: { type: 'string', example: '64a1b2c3d4e5f67890abcde1' },
            name: { type: 'string', example: 'New Maadi' },
            latitude: { type: 'number', example: 29.9602 },
            longitude: { type: 'number', example: 31.2569 },
            isActive: { type: 'boolean' },
          },
        },
        PaginatedAreas: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/AreaResponse' },
            },
            total: { type: 'number', example: 150 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 15 },
          },
        },
        PropertyResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            owner: { $ref: '#/components/schemas/UserResponse' },
            title: { type: 'string', example: 'Modern apartment in Maadi' },
            description: { type: 'string' },
            price: { type: 'number', example: 15000 },
            currency: { type: 'string', example: 'EGP' },
            rentType: { type: 'string', enum: ['Daily', 'Monthly', 'Yearly'] },
            propertyType: { type: 'string', example: 'Apartment' },
            images: { type: 'array', items: { type: 'string', format: 'uri' } },
            status: {
              type: 'string',
              enum: ['Pending', 'Active', 'Rejected', 'Rented', 'Archived'],
            },
            featured: { type: 'boolean' },
            views: { type: 'number' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        CreatePropertyInput: {
          type: 'object',
          required: [
            'category',
            'city',
            'area',
            'title',
            'description',
            'price',
            'rentType',
            'propertyType',
            'bedrooms',
            'bathrooms',
            'areaSize',
            'address',
          ],
          properties: {
            category: {
              type: 'string',
              example: '64a1b2c3d4e5f67890abcdef',
              description: 'Existing active Category ObjectId',
            },
            city: {
              type: 'string',
              example: '64a1b2c3d4e5f67890abcde1',
              description: 'Existing active City ObjectId',
            },
            area: {
              type: 'string',
              example: '64a1b2c3d4e5f67890abcde2',
              description: 'Existing active Area ObjectId belonging to city',
            },
            title: { type: 'string', example: 'Modern furnished apartment in Maadi' },
            description: {
              type: 'string',
              example: 'Bright two-bedroom apartment close to transport and services.',
            },
            price: { type: 'number', example: 18000, minimum: 0 },
            currency: {
              type: 'string',
              example: 'EGP',
              minLength: 3,
              maxLength: 3,
              default: 'EGP',
            },
            rentType: { type: 'string', enum: ['Daily', 'Monthly', 'Yearly'], example: 'Monthly' },
            propertyType: { type: 'string', example: 'Apartment' },
            bedrooms: { type: 'integer', example: 2, minimum: 0 },
            bathrooms: { type: 'integer', example: 1, minimum: 0 },
            floor: { type: 'number', example: 3 },
            areaSize: { type: 'number', example: 125, minimum: 0.01 },
            furnished: { type: 'boolean', example: true },
            parking: { type: 'boolean', example: false },
            balcony: { type: 'boolean', example: true },
            elevator: { type: 'boolean', example: true },
            airConditioner: { type: 'boolean', example: true },
            internet: { type: 'boolean', example: true },
            kitchen: { type: 'boolean', example: true },
            latitude: { type: 'number', example: 29.9602, minimum: -90, maximum: 90 },
            longitude: { type: 'number', example: 31.2569, minimum: -180, maximum: 180 },
            address: { type: 'string', example: 'Road 9, Maadi, Cairo' },
            images: {
              type: 'array',
              maxItems: 10,
              items: { type: 'string', format: 'binary' },
              description:
                'Optional image files, JPEG/PNG/WEBP/GIF, max 5MB each; use repeated images fields',
            },
          },
        },
        UpdatePropertyInput: {
          allOf: [{ $ref: '#/components/schemas/CreatePropertyInput' }],
          description: 'Send only fields to change. New images replace every existing image.',
          properties: { featured: { type: 'boolean', example: false } },
        },
        PaginatedProperties: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/PropertyResponse' } },
            totalItems: { type: 'number', example: 42 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 5 },
            hasNext: { type: 'boolean', example: true },
            hasPrevious: { type: 'boolean', example: false },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'OK' },
          },
        },
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'Password123' },
            phone: { type: 'string', example: '+201100341767' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'Password123' },
          },
        },
        GoogleAuthInput: {
          type: 'object',
          properties: {
            idToken: {
              type: 'string',
              description: 'Google ID token obtained from Google Sign-In on client side',
              example: 'eyJhbGciOiJSUzI1NiIs...',
            },
            credential: {
              type: 'string',
              description: 'Google Credential string from Google One Tap / GIS button',
              example: 'eyJhbGciOiJSUzI1NiIs...',
            },
            code: {
              type: 'string',
              description: 'Google OAuth authorization code obtained from authorization code flow',
              example: '4/0AX4XfWg...',
            },
            redirectUri: {
              type: 'string',
              description: 'Optional redirect URI used when exchanging authorization code',
              example: 'postmessage',
            },
          },
        },

        RefreshTokenInput: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        ForgotPasswordInput: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
          },
        },
        ResetPasswordInput: {
          type: 'object',
          required: ['password'],
          properties: {
            password: { type: 'string', format: 'password', example: 'NewPassword123!' },
          },
        },
        ResendOtpInput: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['phone_verification', 'email_verification', 'password_reset'],
              example: 'email_verification',
            },
          },
        },
        VerifyOtpInput: {
          type: 'object',
          required: ['type', 'code'],
          properties: {
            type: {
              type: 'string',
              enum: ['phone_verification', 'email_verification', 'password_reset'],
              example: 'email_verification',
            },
            code: { type: 'string', example: '123456' },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalUsers: { type: 'integer', example: 1250 },
            totalActiveUsers: { type: 'integer', example: 1100 },
            totalBlockedUsers: { type: 'integer', example: 45 },
            totalProperties: { type: 'integer', example: 3200 },
            pendingProperties: { type: 'integer', example: 85 },
            approvedProperties: { type: 'integer', example: 2800 },
            rejectedProperties: { type: 'integer', example: 120 },
            rentedProperties: { type: 'integer', example: 150 },
            archivedProperties: { type: 'integer', example: 45 },
            totalCategories: { type: 'integer', example: 12 },
            totalCities: { type: 'integer', example: 8 },
            totalAreas: { type: 'integer', example: 45 },
            totalConversations: { type: 'integer', example: 890 },
            totalMessages: { type: 'integer', example: 12500 },
            totalReports: { type: 'integer', example: 67 },
            pendingReports: { type: 'integer', example: 15 },
            resolvedReports: { type: 'integer', example: 42 },
            totalFavorites: { type: 'integer', example: 4500 },
            todayNewUsers: { type: 'integer', example: 12 },
            todayNewProperties: { type: 'integer', example: 8 },
            todayMessages: { type: 'integer', example: 340 },
          },
        },
        ChartDataPoint: {
          type: 'object',
          properties: {
            date: { type: 'string', example: '2026-07-30' },
            count: { type: 'integer', example: 15 },
          },
        },
        PropertyViewsChartPoint: {
          type: 'object',
          properties: {
            date: { type: 'string', example: '2026-07-30' },
            views: { type: 'integer', example: 450 },
          },
        },
        AnalyticsResult: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'] },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            charts: {
              type: 'object',
              properties: {
                newUsers: { type: 'array', items: { $ref: '#/components/schemas/ChartDataPoint' } },
                newProperties: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ChartDataPoint' },
                },
                propertyViews: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PropertyViewsChartPoint' },
                },
                messages: { type: 'array', items: { $ref: '#/components/schemas/ChartDataPoint' } },
                reports: { type: 'array', items: { $ref: '#/components/schemas/ChartDataPoint' } },
                favorites: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ChartDataPoint' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'System', description: 'Health check and system endpoints' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'OTP', description: 'OTP verification endpoints' },
      { name: 'Categories', description: 'Category management endpoints' },
      { name: 'Cities', description: 'City management endpoints' },
      { name: 'Areas', description: 'Area management endpoints' },
      { name: 'Properties', description: 'Property listings and moderation endpoints' },
      { name: 'Favorites', description: 'Saved property management' },
      { name: 'Reports', description: 'User and property reporting' },
      { name: 'Blocks', description: 'Blocked-user management' },
      { name: 'Chat', description: 'Property conversations and messages' },
      { name: 'Notifications', description: 'In-app user notifications' },
      { name: 'Admin', description: 'Admin dashboard, analytics, and user management' },
      { name: 'Saved Searches', description: 'Authenticated users saved property filters' },
      { name: 'Reviews & Ratings', description: 'Property reviews and rating summaries' },
      { name: 'Contact Owner', description: 'Start a property-owner conversation' },
    ],
  },
  apis: getSwaggerApiFiles(),
};

const baseSwaggerSpec = swaggerJsdoc(options);

type SwaggerServer = {
  url: string;
  description: string;
};

function buildSwaggerServers(origin?: string): SwaggerServer[] {
  const trimmedOrigin = origin?.trim().replace(/\/+$/, '');
  const candidates: SwaggerServer[] = [
    ...(trimmedOrigin
      ? [{ url: `${trimmedOrigin}/api/v1`, description: 'Current Deployment' }]
      : []),
    { url: '/api/v1', description: 'Current Deployment' },
    { url: `http://localhost:${config.port}/api/v1`, description: 'Local Development' },
  ];

  const seen = new Set<string>();
  return candidates.filter((server) => {
    if (seen.has(server.url)) {
      return false;
    }

    seen.add(server.url);
    return true;
  });
}

export function getSwaggerSpec(origin?: string) {
  return {
    ...baseSwaggerSpec,
    servers: buildSwaggerServers(origin),
  };
}

export const swaggerSpec = getSwaggerSpec();
