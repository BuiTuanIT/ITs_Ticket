import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Button, Divider, Input, Modal, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  LinkOutlined,
  UnorderedListOutlined,
  StrikethroughOutlined,
  RedoOutlined,
  UndoOutlined,
  PictureOutlined,
  FontSizeOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface RichTextEditorProps {
  value: string; // HTML
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>; // trả URL ảnh
  placeholder?: string;
  minHeight?: number;
}

/** Toolbar nút định dạng */
function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <Tooltip title={title}>
      <Button
        size="small"
        type={active ? 'primary' : 'text'}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onClick()}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  onImageUpload,
  placeholder = 'Nhập nội dung...',
  minHeight = 320,
}: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  // Đồng bộ khi value thay đổi từ bên ngoài (VD khi chọn ticket khác)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '<p></p>');
    }
  }, [value, editor]);

  if (!editor) return null;

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const images = items.filter((it) => it.type.startsWith('image/'));
    if (images.length && onImageUpload) {
      e.preventDefault();
      for (const img of images) {
        const file = img.getAsFile();
        if (file) {
          const url = await onImageUpload(file);
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    }
  };

  const setLink = () => {
    const url = linkText.trim();
    if (!url) return;
    if (editor.state.selection.empty) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setLinkOpen(false);
    setLinkText('');
  };

  return (
    <div
      className="rich-editor"
      onPaste={(e) => void handlePaste(e)}
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onImageUpload) {
            void onImageUpload(file).then((url) => editor.chain().focus().setImage({ src: url }).run());
          }
          e.target.value = '';
        }}
      />

      {/* Toolbar */}
      <Space wrap style={{ padding: 8, borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
        <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <UndoOutlined />
        </ToolbarButton>
        <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <RedoOutlined />
        </ToolbarButton>

        <Divider type="vertical" />

        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldOutlined />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicOutlined />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <StrikethroughOutlined />
        </ToolbarButton>

        <Divider type="vertical" />

        <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <FontSizeOutlined />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <FontSizeOutlined />
        </ToolbarButton>

        <Divider type="vertical" />

        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <UnorderedListOutlined />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <OrderedListOutlined />
        </ToolbarButton>

        <Divider type="vertical" />

        <ToolbarButton title="Chèn link" active={editor.isActive('link')} onClick={() => setLinkOpen(true)}>
          <LinkOutlined />
        </ToolbarButton>
        <ToolbarButton title="Chèn ảnh" onClick={() => fileRef.current?.click()}>
          <PictureOutlined />
        </ToolbarButton>
      </Space>

      {/* Khung soạn thảo lớn */}
      <EditorContent
        editor={editor}
        style={{ minHeight, padding: '8px 16px', maxHeight: 600, overflowY: 'auto' }}
      />

      <Modal open={linkOpen} title="Chèn liên kết" onOk={setLink} onCancel={() => setLinkOpen(false)} okText="Chèn">
        <Input placeholder="https://..." value={linkText} onChange={(e) => setLinkText(e.target.value)} onPressEnter={setLink} />
      </Modal>
    </div>
  );
}
