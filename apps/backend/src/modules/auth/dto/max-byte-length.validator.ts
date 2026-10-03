import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

// bcrypt считает длину пароля в байтах UTF-8, а не в символах — MaxLength(72)
// пропустил бы многобайтовый пароль (например, эмодзи), который bcrypt
// молча обрежет на границе 72 байт при хэшировании.
@ValidatorConstraint({ name: 'maxByteLength' })
class MaxByteLengthConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [maxBytes] = args.constraints as [number]
    return typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= maxBytes
  }

  defaultMessage(args: ValidationArguments): string {
    const [maxBytes] = args.constraints as [number]
    return `${args.property} превышает максимальную длину в ${maxBytes} байт (UTF-8)`
  }
}

export function MaxByteLength(maxBytes: number, options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [maxBytes],
      validator: MaxByteLengthConstraint,
    })
  }
}
