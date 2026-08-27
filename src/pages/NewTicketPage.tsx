import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Form, Input, Row, Select, Space, Typography, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/useAuth';
import { createTicket } from '../services/ticketsService';
import { uploadAttachment } from '../services/attachmentsService';
import { CATEGORY_LIST, PRIORITY_LIST } from '../constants';
import type { TicketAttachment, TicketPriority, Ticket } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import AttachmentUpload from '../components/AttachmentUpload';

interface FormValues {
  title: string;
  priority: TicketPriority;
  category: string;
}

interface TicketTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
}

const TEMPLATES: TicketTemplate[] = [
  {
    id: 'hardware-issue',
    name: 'Lỗi phần cứng',
    title: '[Phần cứng] ',
    description: '<p><strong>Mô tả lỗi:</strong></p><ul><li>Thiết bị: </li><li>Triệu chứng: </li><li>Thời gian xảy ra: </li></ul><p><strong>Đã thử khắc phục:</strong></p><ul><li></ul>',
    priority: 'High',
    category: 'Hardware',
  },
  {
    id: 'software-install',
    name: 'Yêu cầu cài phần mềm',
    title: '[Phần mềm] Yêu cầu cài đặt ',
    description: '<p><strong>Tên phần mềm:</strong></p><p><strong>Phiên bản:</strong></p><p><strong>Lý do cần thiết:</strong></p><p><strong>Số lượng máy cần cài:</strong></p>',
    priority: 'Medium',
    category: 'Software',
  },
  {
    id: 'account-access',
    name: 'Yêu cầu cấp quyền/Tài khoản',
    title: '[Tài khoản] ',
    description: '<p><strong>Loại yêu cầu:</strong> Cấp mới / Mở khóa / Cấp quyền thêm</p><p><strong>Hệ thống/Ứng dụng:</strong></p><p><strong>Quyền cần cấp:</strong></p><p><strong>Người duyệt (nếu có):</strong></p>',
    priority: 'Medium',
    category: 'Account',
  },
  {
    id: 'network-issue',
    name: 'Sự cố mạng/Internet',
    title: '[Mạng] ',
    description: '<p><strong>Vị trí:</strong> Tầng / Phòng</p><p><strong>Triệu chứng:</strong> Mất mạng / Chậm / Rút mạng</p><p><strong>Thiết bị ảnh hưởng:</strong> Laptop / Desktop / Điện thoại</p><p><strong>Thời gian bắt đầu:</strong></p>',
    priority: 'High',
    category: 'Network',
  },
];

/** Đọc file thành data URL để hiển thị ảnh ngay trong editor
 *  (webUrl từ SharePoint/demo chỉ là trang xem/đường dẫn giả, không render trực tiếp được) */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.readAsDataURL(file);
  });
}

export default function NewTicketPage() {
  const navigate = useNavigate();
  const { email, getToken } = useAuth();
  const [form] = Form.useForm<FormValues>();
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Ticket được tạo "lười" ngay khi upload ảnh/file đầu tiên để có folder đính kèm
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const formRef = useRef(form);

  // Draft key in localStorage
  const DRAFT_KEY = `ticket_draft_${email}`;

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.title) form.setFieldsValue({ title: draft.title });
        if (draft.priority) form.setFieldsValue({ priority: draft.priority });
        if (draft.category) form.setFieldsValue({ category: draft.category });
        if (draft.description) setDescription(draft.description);
        if (draft.selectedTemplate) setSelectedTemplate(draft.selectedTemplate);
        message.info('Đã khôi phục bản nháp');
      } catch {
        // ignore
      }
    }
  }, [email, form]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = {
        title: form.getFieldValue('title'),
        priority: form.getFieldValue('priority'),
        category: form.getFieldValue('category'),
        description,
        selectedTemplate,
        timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 1000);
    return () => clearTimeout(timer);
  }, [description, form, selectedTemplate, email]);

  // Clear draft
  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  /** Template selection handler */
  const onTemplateChange = (templateId: string) => {
    const tmpl = TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;
    setSelectedTemplate(templateId);
    form.setFieldsValue({
      title: tmpl.title,
      priority: tmpl.priority,
      category: tmpl.category,
    });
    setDescription(tmpl.description);
  };

  /** Tạo ticket ngay (nếu chưa có) để phục vụ upload ảnh/file */
  const ensureTicket = async () => {
    if (ticketId) return ticketId;
    const token = await getToken();
    if (!token) throw new Error('Chưa xác thực');
    const values = formRef.current.getFieldsValue();
    const ticket = await createTicket(token, {
      title: values.title || 'Chưa có tiêu đề',
      description,
      priority: values.priority || 'Medium',
      category: (values.category as Ticket['category']) || 'Other',
    }, email);
    setTicketId(ticket.id);
    return ticket.id;
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const token = await getToken();
    if (!token) throw new Error('Chưa xác thực');
    const id = await ensureTicket();
    const att = await uploadAttachment(token, id, file);
    setAttachments((prev) => [...prev, att]);
    return readFileAsDataURL(file);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Chưa xác thực');

      // Nếu chưa tạo (không upload gì trước), tạo ticket bây giờ
      let id = ticketId;
      if (!id) {
        const ticket = await createTicket(token, {
          title: values.title,
          description,
          priority: values.priority,
          category: values.category as Ticket['category'],
        }, email);
        id = ticket.id;
        setTicketId(id);
      }
      clearDraft();
      message.success('Đã gửi ticket chờ duyệt');
      navigate(`/tickets/${id}`);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Row justify="center">
      <Col xs={24} md={18} xl={14}>
        <Card>
          <Typography.Title level={4}>Tạo ticket hỗ trợ IT</Typography.Title>
          <Typography.Paragraph type="secondary">
            Mô tả chi tiết vấn đề để quản lý và IT xử lý nhanh nhất. Bạn có thể định dạng văn bản,
            chèn link, ảnh và đính kèm file.
          </Typography.Paragraph>

          <Form form={form} layout="vertical" requiredMark="optional">
<Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
            <Input placeholder="Tóm tắt ngắn gọn vấn đề..." size="large" />
          </Form.Item>

          <Form.Item name="template" label="Mẫu ticket" tooltip="Chọn mẫu để điền nhanh tiêu đề, nội dung, ưu tiên, phân loại">
            <Select
              placeholder="Chọn mẫu ticket (tự điền tiêu đề, nội dung, ưu tiên, phân loại)"
              style={{ width: '100%' }}
              value={selectedTemplate}
              onChange={onTemplateChange}
              options={[
                { value: '', label: '— Không dùng mẫu —' },
                ...TEMPLATES.map(t => ({ value: t.id, label: t.name })),
              ]}
            />
          </Form.Item>

          <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="priority" label="Ưu tiên" rules={[{ required: true }]}>
                  <Select placeholder="Chọn mức ưu tiên" options={PRIORITY_LIST.map((p) => ({ value: p, label: p }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="category" label="Phân loại" rules={[{ required: true }]}>
                  <Select placeholder="Chọn phân loại" options={CATEGORY_LIST.map((c) => ({ value: c, label: c }))} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Nội dung" required>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                onImageUpload={handleImageUpload}
                placeholder="Mô tả chi tiết vấn đề: các bước tái hiện, thông điệp lỗi, thời điểm xảy ra..."
                minHeight={340}
              />
            </Form.Item>

            <Form.Item label="File đính kèm">
              <AttachmentUpload
                ticketId={ticketId}
                onEnsureTicket={ensureTicket}
                getToken={getToken}
                attachments={attachments}
                onUploaded={(a) => setAttachments((prev) => [...prev, a])}
              />
            </Form.Item>

            <Space style={{ marginTop: 8 }}>
              <Button type="primary" size="large" icon={<SendOutlined />} loading={submitting} onClick={() => void submit()}>
                Gửi ticket
              </Button>
              <Button size="large" onClick={() => navigate(-1)}>Hủy</Button>
            </Space>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}