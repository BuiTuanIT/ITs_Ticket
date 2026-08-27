import { useEffect, useState } from 'react';
import { Button, List, Modal, Tooltip, message } from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileZipOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { listAttachments } from '../services/attachmentsService';
import { isDemo } from '../services/demo';
import type { TicketAttachment } from '../types';

interface AttachmentListProps {
  ticketId: string;
  token: string;
}

/** Cache object URL của ảnh đã xem để lần sau mở nhanh, không tải lại */
const blobCache = new Map<string, string>();

function FileIcon({ name, contentType }: { name: string; contentType: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) || contentType.startsWith('image/'))
    return <FileImageOutlined style={{ color: '#fa8c16' }} />;
  if (contentType === 'application/pdf' || ext === 'pdf')
    return <FilePdfOutlined style={{ color: '#f5222d' }} />;
  if (['zip', 'rar', '7z'].includes(ext)) return <FileZipOutlined style={{ color: '#722ed1' }} />;
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return <FileExcelOutlined style={{ color: '#52c41a' }} />;
  if (['doc', 'docx', 'txt', 'md'].includes(ext))
    return <FileTextOutlined style={{ color: '#1677ff' }} />;
  return <FileOutlined />;
}

function isImageAttachment(att: TicketAttachment): boolean {
  const ext = att.name.split('.').pop()?.toLowerCase() ?? '';
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) || att.contentType.startsWith('image/');
}

function isPdf(att: TicketAttachment): boolean {
  return att.contentType === 'application/pdf' || att.name.toLowerCase().endsWith('.pdf');
}

/** Danh sách file đính kèm của ticket + nút Xem (ảnh/PDF/Office) / Tải xuống */
export default function AttachmentList({ ticketId, token }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ name: string; src: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listAttachments(token, ticketId);
      setAttachments(list);
    } catch (e) {
      message.warning(`Không tải được file: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId && token) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, token]);

  const download = (att: TicketAttachment) => {
    // Mở URL có Authorization qua token (dùng fetch blob để hỗ trợ tải)
    void fetch(att.webUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = att.name;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => message.error('Tải file thất bại'));
  };

  const view = async (att: TicketAttachment) => {
    // Demo: webUrl là đường dẫn giả → bỏ qua fetch (tránh chờ network timeout) để mở ngay lập tức
    if (isDemo) {
      if (isImageAttachment(att)) {
        const svg = `data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="100%" height="100%" fill="#e6f4ff"/><text x="50%" y="48%" font-size="15" fill="#1677ff" text-anchor="middle">Xem trước ảnh</text><text x="50%" y="58%" font-size="12" fill="#666" text-anchor="middle">${att.name}</text></svg>`,
        )}`;
        setPreview({ name: att.name, src: svg });
      } else if (isPdf(att)) {
        const svg = `data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="100%" height="100%" fill="#fff1f0"/><text x="50%" y="48%" font-size="15" fill="#f5222d" text-anchor="middle">PDF: ${att.name}</text><text x="50%" y="58%" font-size="12" fill="#666" text-anchor="middle">Bản demo không có nội dung file</text></svg>`,
        )}`;
        setPreview({ name: att.name, src: svg });
      } else {
        window.open(att.webUrl, '_blank');
      }
      return;
    }

    // Thật: PDF/Office/text → mở thẳng webUrl, SharePoint render nhanh (không cần tải full file)
    if (!isImageAttachment(att)) {
      window.open(att.webUrl, '_blank');
      return;
    }

    // Ảnh → hiện ngay trong modal; cache blob để lần xem sau không phải tải lại
    const cached = blobCache.get(att.webUrl);
    if (cached) {
      setPreview({ name: att.name, src: cached });
      return;
    }
    try {
      const r = await fetch(att.webUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const url = URL.createObjectURL(await r.blob());
      blobCache.set(att.webUrl, url);
      setPreview({ name: att.name, src: url });
    } catch {
      message.error('Không thể xem trước ảnh');
    }
  };

  return (
    <>
      <List
        loading={loading}
        size="small"
        dataSource={attachments}
        locale={{ emptyText: 'Chưa có file đính kèm' }}
        renderItem={(att) => (
          <List.Item
            actions={[
              <Tooltip key="view" title="Xem file">
                <Button type="text" icon={<EyeOutlined />} onClick={() => void view(att)} />
              </Tooltip>,
              <Tooltip key="dl" title="Tải xuống">
                <Button type="text" icon={<DownloadOutlined />} onClick={() => download(att)} />
              </Tooltip>,
            ]}
          >
            <List.Item.Meta
              avatar={<FileIcon name={att.name} contentType={att.contentType} />}
              title={att.name}
              description={`${(att.size / 1024).toFixed(1)} KB`}
            />
          </List.Item>
        )}
      />
      <Modal
        open={!!preview}
        title={preview?.name ?? ''}
        footer={null}
        width={720}
        onCancel={() => setPreview(null)}
      >
        <img alt="xem truoc" src={preview?.src} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
      </Modal>
    </>
  );
}
