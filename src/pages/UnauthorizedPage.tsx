import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="Không có quyền truy cập"
      subTitle="Tài khoản của bạn không thuộc vai trò được phép xem trang này."
      extra={
        <Button type="primary" onClick={() => navigate('/inbox')}>
          Về Inbox
        </Button>
      }
    />
  );
}