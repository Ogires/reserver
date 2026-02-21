import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResendEmailService } from './ResendEmailService';

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null });

vi.mock('resend', () => {
  return {
    Resend: class {
      emails = { send: sendMock };
    }
  };
});

describe('ResendEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call Resend SDK with correct parameters when key is provided', async () => {
    process.env.RESEND_FROM_EMAIL = 'Test Sender <test@test.com>';
    const service = new ResendEmailService('dummy-key');
    await service.sendEmail('test@example.com', 'Test Subject', '<p>Test</p>');

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      from: 'Test Sender <test@test.com>',
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test</p>'
    });
    delete process.env.RESEND_FROM_EMAIL;
  });

  it('should run in mock mode when no API key is provided, without throwing', async () => {
    const service = new ResendEmailService(); // No key
    await expect(service.sendEmail('test@example.com', 'Test Subject', '<p>Test</p>')).resolves.not.toThrow();
    
    // sendMock should not have been called because there was no key
    expect(sendMock).not.toHaveBeenCalled();
  });
});
