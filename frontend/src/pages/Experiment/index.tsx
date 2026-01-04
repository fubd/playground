import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Table,
  Button,
  Upload,
  Space,
  Modal,
  message,
  Tooltip,
  Tag
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileZipOutlined,
  FileOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { FileInfo } from '../../api/file.js';
import { fileApi } from '../../api/file.js';

const { Title } = Typography;

const Storage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await fileApi.listFiles() as unknown as FileInfo[];
      setFiles(data);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      message.error('获取文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      await fileApi.uploadFile(file as File);
      message.success(`${file.name} 上传成功`);
      onSuccess?.(null);
      fetchFiles();
    } catch (err: any) {
      message.error(`${file.name} 上传失败`);
      onError?.(err as Error);
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个资源吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await fileApi.deleteFile(id);
          message.success('删除成功');
          fetchFiles();
        } catch (err) {
          console.error('Delete error:', err);
          message.error('删除失败');
        }
      },
    });
  };

  const handleCopyLink = (file: FileInfo) => {
    const url = `${window.location.origin}/uploads/${file.filename}`;
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const handleDownload = (file: FileInfo) => {
    const link = document.createElement('a');
    link.href = `/uploads/${file.filename}`;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (file: FileInfo) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImageOutlined style={{ color: '#52c41a' }} />;
    if (mimeType.startsWith('video/')) return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
    if (mimeType.includes('pdf')) return <FilePdfOutlined style={{ color: '#f5222d' }} />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileZipOutlined style={{ color: '#faad14' }} />;
    if (mimeType.includes('text/')) return <FileTextOutlined style={{ color: '#8c8c8c' }} />;
    return <FileOutlined style={{ color: '#8c8c8c' }} />;
  };

  const columns: ColumnsType<FileInfo> = [
    {
      title: '文件名',
      dataIndex: 'originalName',
      key: 'originalName',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.mimeType)}
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'mimeType',
      key: 'mimeType',
      render: (mime) => <Tag color="blue">{mime || '未知'}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size) => formatSize(size),
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="预览">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Tooltip title="复制链接">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopyLink(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const renderPreview = () => {
    if (!previewFile) return null;
    const { mimeType, filename, originalName } = previewFile;
    const url = `/uploads/${filename}`;

    if (mimeType.startsWith('image/')) {
      return <img src={url} alt={originalName} style={{ width: '100%' }} />;
    }
    if (mimeType.startsWith('video/')) {
      return (
        <video controls style={{ width: '100%' }}>
          <source src={url} type={mimeType} />
          您的浏览器不支持视频播放。
        </video>
      );
    }
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <FileOutlined style={{ fontSize: '64px', color: '#8c8c8c' }} />
        <p style={{ marginTop: '16px' }}>该文件类型暂不支持直接预览</p>
        <Button type="primary" onClick={() => handleDownload(previewFile)}>立即下载</Button>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>云资源管理</Title>
        <Upload
          customRequest={handleUpload}
          showUploadList={false}
          multiple
        >
          <Button type="primary" icon={<UploadOutlined />} size="large" shape="round">
            上传资源
          </Button>
        </Upload>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        bodyStyle={{ padding: '0' }}
      >
        <Table
          columns={columns}
          dataSource={files}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={previewFile?.originalName}
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        centered
        destroyOnClose
      >
        {renderPreview()}
      </Modal>
    </div>
  );
};

export default Storage;
export { Storage as Experiment };
