import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export function ApiSwaggerResponse<T>(
  status: number,
  message: string,
  data?: Type<T> | [Type<T>],
  example?: T | T[],
): MethodDecorator {
  const baseSchema = {
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: message },
    },
  };

  if (data) {
    const isArray = Array.isArray(data);
    const dataType = isArray ? data[0] : data;

    return applyDecorators(
      ApiExtraModels(dataType),
      ApiResponse({
        status,
        schema: {
          ...baseSchema,
          properties: {
            ...baseSchema.properties,
            data: {
              ...(isArray
                ? { type: 'array', items: { $ref: getSchemaPath(dataType) } }
                : { $ref: getSchemaPath(dataType) }),
              example: example || undefined,
            },
          },
        },
      }),
    );
  } else {
    return ApiResponse({
      status,
      schema: baseSchema,
    });
  }
}
