import { useState } from 'react';
import { Button, List, Progress, Space, Upload, message } from 'antd';
import { DeleteOutlined, PaperClipOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { uploadAttachment } from '../services/attachmentsService';
import type { TicketAttachment } from '../types';

interface AttachmentUploadProps {
  ticketId: string | null;
  /** Tạo ticket nếu chưa tồn tại (để có folder đính kèm) */
  onEnsureTicket: () => Promise<string>;
  getToken: () => Promise<string | null>;
  attachments: TicketAttachment[];
  onUploaded: (att: TicketAttachment) => void;
  onRemove?: (att: TicketAttachment) => void;
}

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg,.gif,.txt';

/** Nút "Add file" rõ ràng + danh sách file đã đính kèm. Tự tạo ticket khi cần. */
export default function AttachmentUpload({
  ticketId,
  onEnsureTicket,
  getToken,
  attachments,
  onUploaded,
  onRemove,
}: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);
    try {
      const token = await getToken();
      if (!token) throw new Error('Chưa xác thực');
      const id = ticketId ?? (await onEnsureTicket()); // tạo ticket lần đầu
      const step = 100 / files.length;
      let done = 0;
      for (const file of files) {
        const att = await uploadAttachment(token, id, file, (p) =>
          setProgress(Math.round(done + p / files.length)),
        );
        onUploaded(att);
        done += step;
        setProgress(Math.round(done));
      }
      message.success(`Đã đính kèm ${files.length} file`);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    multiple: true,
    accept: ACCEPT,
    showUploadList: false,
    beforeUpload: () => false,
    onChange: (info) => {
      const files = info.fileList.map((f) => f.originFileObj).filter(Boolean) as File[];
      void handleFiles(files);
    },
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 8 }}>
        <Upload {...uploadProps} disabled={uploading}>
          <Button type="dashed" icon={<PlusOutlined />} loading={uploading}>
            {ticketId ? 'Add file' : 'Add file (tạo ticket)'}
          </Button>
        </Upload>
        {uploading && <Progress percent={progress} size="small" style={{ width: 180 }} />}
      </Space>

      {attachments.length > 0 && (
        <List
          size="small"
          dataSource={attachments}
          renderItem={(att) => (
            <List.Item
              actions={
                onRemove
                  ? [
                      <Button
                        key="del"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onRemove(att)}
                      />,
                    ]
                  : []
              }
            >
              <List.Item.Meta
                avatar={<PaperClipOutlined />}
                title={att.name}
                description={`${(att.size / 1024).toFixed(1)} KB`}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}