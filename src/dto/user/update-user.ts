import { ApiProperty } from "@nestjs/swagger";

export class UpdateUser {
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
