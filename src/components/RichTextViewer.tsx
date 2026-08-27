import DOMPurify from 'dompurify';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from 'antd';
import 'antd/es/modal/style';

/** Render HTML an toàn (sanitize bằng DOMPurify) + lightbox cho ảnh */
export default function RichTextViewer({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const sanitized = useMemo(() => DOMPurify.sanitize(html ?? ''), [html]);

  // Gắn click handler cho các ảnh sau khi render
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const images = container.querySelectorAll('img');
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLImageElement;
      if (target.tagName === 'IMG' && target.src) {
        setPreviewSrc(target.src);
      }
    };
    images.forEach(img => img.addEventListener('click', handler));
    return () => images.forEach(img => img.removeEventListener('click', handler));
  }, [sanitized]);

  return (
    <>
      <div className="rich-content" ref={containerRef} dangerouslySetInnerHTML={{ __html: sanitized }} />
      <Modal
        open={!!previewSrc}
        onCancel={() => setPreviewSrc(null)}
        footer={null}
        centered
        closeIcon
      >
        <img
          src={previewSrc!}
          alt="Preview"
          style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 4 }}
        />
      </Modal>
    </>
  );
}