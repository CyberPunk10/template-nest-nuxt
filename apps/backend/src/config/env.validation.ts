import Joi from 'joi'

export const envValidationSchema = Joi.object({
  PORT: Joi.number().integer().min(1).max(65535).default(3001),
  CORS_ORIGIN: Joi.string().uri().required(),
})
