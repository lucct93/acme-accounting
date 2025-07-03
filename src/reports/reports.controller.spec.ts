import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;
  let generateAllSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockReportsService = {
      state: jest.fn(),
      generateAll: jest.fn().mockResolvedValue(true),
      accounts: jest.fn(),
      yearly: jest.fn(),
      fs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
    generateAllSpy = jest.spyOn(service, 'generateAll');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('report', () => {
    it('should return the current state of all reports', () => {
      // Mock the state method to return different values for different reports
      jest
        .spyOn(service, 'state')
        .mockReturnValueOnce('finished in 1.23s')
        .mockReturnValueOnce('processing')
        .mockReturnValueOnce('idle');

      const result = controller.report();

      expect(result).toEqual({
        'accounts.csv': 'finished in 1.23s',
        'yearly.csv': 'processing',
        'fs.csv': 'idle',
      });
      expect(jest.spyOn(service, 'state')).toHaveBeenCalledTimes(3);
    });
  });

  describe('generate', () => {
    it('should start report generation asynchronously and return immediately', () => {
      const result = controller.generate();

      expect(result).toEqual({
        message: 'finished',
      });
    });

    it('should handle errors gracefully', () => {
      generateAllSpy.mockRejectedValue(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation((): void => {});

      const result = controller.generate();

      expect(result).toEqual({
        message: 'finished',
      });
    });
  });
});
