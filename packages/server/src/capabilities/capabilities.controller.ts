import { Controller, Get } from '@nestjs/common';
import type { CapabilitiesResponse } from './capabilities.types';

@Controller()
export class CapabilitiesController {
  @Get('capabilities')
  getCapabilities(): CapabilitiesResponse {
    return {
      nativeGeometry: false,
      sqlite: true,
      sse: true
    };
  }
}
