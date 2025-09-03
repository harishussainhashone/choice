import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReviewDto {
  @ApiProperty({ description: 'Approve the review', example: true })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiProperty({ description: 'Reject the review', example: false })
  @IsOptional()
  @IsBoolean()
  isRejected?: boolean;

  @ApiProperty({ description: 'Reason for rejection (if rejected)', example: 'Inappropriate content', required: false })
  @IsOptional()
  @IsString()
  @MinLength(5)
  rejectionReason?: string;
}
