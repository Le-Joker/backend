import { Test, TestingModule } from '@nestjs/testing';
import { ChantiersService } from './chantiers.service';

describe('ChantiersService', () => {
  let service: ChantiersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChantiersService],
    }).compile();

    service = module.get<ChantiersService>(ChantiersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
