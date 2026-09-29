import { DeviceIssueQueueController } from './device-issue-queue.controller';
import { DeviceIssueStatus } from '../../entities/device-issue.entity';

const makeController = () => {
  const service = { findAllForStaff: jest.fn().mockResolvedValue([]), updateStatus: jest.fn() };
  return { controller: new DeviceIssueQueueController(service as any), service };
};

describe('DeviceIssueQueueController', () => {
  it('GET / chuyển query status xuống service', async () => {
    const { controller, service } = makeController();
    await controller.findAll(DeviceIssueStatus.OPEN);
    expect(service.findAllForStaff).toHaveBeenCalledWith(DeviceIssueStatus.OPEN);
  });

  it('GET / không có status thì gọi service không tham số lọc', async () => {
    const { controller, service } = makeController();
    await controller.findAll(undefined);
    expect(service.findAllForStaff).toHaveBeenCalledWith(undefined);
  });

  it('PUT :issueId/status chuyển đúng id và status', async () => {
    const { controller, service } = makeController();
    await controller.updateStatus('i1', DeviceIssueStatus.RESOLVED);
    expect(service.updateStatus).toHaveBeenCalledWith('i1', DeviceIssueStatus.RESOLVED);
  });
});
