import { NotFoundException } from '@nestjs/common';
import { DeviceIssuesService } from './device-issues.service';
import { DeviceIssueStatus } from '../../entities/device-issue.entity';

const setup = (issue?: any, device: any = { id: 'd1' }) => {
  const issuesRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(issue ?? null),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => x),
  };
  const devicesRepo = { findOne: jest.fn().mockResolvedValue(device) };
  const service = new DeviceIssuesService(issuesRepo as any, devicesRepo as any);
  return { service, issuesRepo, devicesRepo };
};

describe('DeviceIssuesService.findAllForStaff', () => {
  it('lấy tất cả báo lỗi (mọi thiết bị), có kèm thông tin thiết bị và người báo, mới nhất trước', async () => {
    const { service, issuesRepo } = setup();
    await service.findAllForStaff();
    expect(issuesRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: ['device', 'reportedBy'],
        order: { createdAt: 'DESC' },
      }),
    );
  });

  it('lọc theo status khi được truyền', async () => {
    const { service, issuesRepo } = setup();
    await service.findAllForStaff(DeviceIssueStatus.OPEN);
    expect(issuesRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: DeviceIssueStatus.OPEN } }),
    );
  });

  it('không lọc khi không truyền status', async () => {
    const { service, issuesRepo } = setup();
    await service.findAllForStaff();
    const call = issuesRepo.find.mock.calls[0][0];
    expect(call.where).toBeUndefined();
  });
});

describe('DeviceIssuesService.updateStatus', () => {
  it('cập nhật đúng trạng thái mới', async () => {
    const { service, issuesRepo } = setup({ id: 'i1', status: DeviceIssueStatus.OPEN });
    const result = await service.updateStatus('i1', DeviceIssueStatus.RESOLVED);
    expect(result.status).toBe(DeviceIssueStatus.RESOLVED);
    expect(issuesRepo.save).toHaveBeenCalled();
  });

  it('báo lỗi không tồn tại: 404', async () => {
    const { service } = setup(null);
    await expect(service.updateStatus('missing', DeviceIssueStatus.RESOLVED)).rejects.toThrow(NotFoundException);
  });
});
