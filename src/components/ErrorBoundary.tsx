import type { ReactNode } from 'react';
import { Component } from 'react';
import { Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: 40, textAlign: 'center', background: '#fff' }}>
          <Alert
            type="error"
            message="Đã xảy ra lỗi"
            description={this.state.error?.message || 'Lỗi không xác định'}
            showIcon
            style={{ maxWidth: 600, margin: '0 auto' }}
          />
          <div style={{ marginTop: 16 }}>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ marginTop: 16, textAlign: 'left', background: '#f5f5f5', padding: 16, overflow: 'auto' }}>
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}