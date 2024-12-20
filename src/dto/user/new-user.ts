import { ApiProperty } from '@nestjs/swagger';
export class NewUser {

 @ApiProperty({
    description: 'Tên đăng nhập',
    example: 'johnDoe',
  })
  username: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: '123456',
  })
  password: string;

  @ApiProperty({
    description: 'Tên',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Họ',
    example: 'Doe',
  })
  lastName: string;
}
