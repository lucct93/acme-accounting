import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock directory existence check
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  describe('accounts', () => {
    it('should process accounts data asynchronously', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['test.csv']);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('2023-01-01,Account1,,100,0\n2023-01-02,Account2,,50,25');
      
      await service.accounts();
      
      expect(fs.promises.readdir).toHaveBeenCalled();
      expect(fs.promises.readFile).toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalled();
      
      expect(service.state('accounts')).toContain('finished in');
    });
    
    it('should handle errors properly', async () => {
      (fs.promises.readdir as jest.Mock).mockRejectedValue(new Error('Test error'));
      await expect(service.accounts()).rejects.toThrow('Test error');
      expect(service.state('accounts')).toContain('failed');
    });
  });
  
  describe('generateAll', () => {
    it('should process all reports in parallel', async () => {
      jest.spyOn(service, 'accounts').mockResolvedValue(true);
      jest.spyOn(service, 'yearly').mockResolvedValue(true);
      jest.spyOn(service, 'fs').mockResolvedValue(true);
      
      await service.generateAll();
      
      // Verify all methods were called
      expect(service.accounts).toHaveBeenCalled();
      expect(service.yearly).toHaveBeenCalled();
      expect(service.fs).toHaveBeenCalled();
    });
  });
});
