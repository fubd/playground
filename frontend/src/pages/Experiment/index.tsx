import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Typography,
  Table,
  Button,
  Upload,
  Space,
  Modal,
  message,
  Layout,
  Menu,
  Breadcrumb,
  Input,
  Dropdown,
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
  PlayCircleOutlined,
  FolderOpenOutlined,
  FolderAddOutlined,
  EllipsisOutlined,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  CloudOutlined,
  EditOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { FileInfo } from '../../api/file.js';
import { fileApi } from '../../api/file.js';

const { Title, Text } = Typography;
const { Sider, Content } = Layout;

const Storage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [roots, setRoots] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [currentPath, setCurrentPath] = useState<{ id: string | null; name: string }[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const currentFolderId = useMemo(() => currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null, [currentPath]);

  const fetchFiles = useCallback(async (parentId: string | null = null, query: string | null = null) => {
    setLoading(true);
    try {
      const data = await fileApi.listFiles(parentId, query) as unknown as FileInfo[];
      setFiles(data);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      message.error('获取文件列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoots = useCallback(async () => {
    try {
      const data = await fileApi.fetchRoots() as unknown as FileInfo[];
      setRoots(data);
      if (data.length > 0 && currentPath.length === 0) {
        setCurrentPath([{ id: data[0].id, name: data[0].originalName }]);
      }
    } catch (err) {
      console.error('Failed to fetch roots:', err);
    }
  }, [currentPath.length]);

  useEffect(() => {
    fetchRoots();
  }, [fetchRoots]);

  useEffect(() => {
    if (!searchQuery && (currentFolderId !== null || currentPath.length > 0)) {
      fetchFiles(currentFolderId);
    }
    setSelectedFile(null);
  }, [currentFolderId, fetchFiles, currentPath.length, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      if (val.trim()) {
        fetchFiles(null, val.trim());
      } else {
        fetchFiles(currentFolderId);
      }
    }, 500);
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      await fileApi.uploadFile(file as File, currentFolderId);
      message.success(`${file.name} 上传成功`);
      onSuccess?.(null);
      fetchFiles(currentFolderId, searchQuery || null);
    } catch (err: any) {
      message.error(`${file.name} 上传失败`);
      onError?.(err as Error);
    }
  };

  const handleRefresh = useCallback(async () => {
    await fetchRoots();
    await fetchFiles(currentFolderId, searchQuery || null);
  }, [fetchRoots, fetchFiles, currentFolderId, searchQuery]);

  const handleCreateFolder = async (parentId: string | null = currentFolderId) => {
    const name = `新建文件夹_${Date.now().toString().slice(-4)}`;
    try {
      await fileApi.createFolder(name, parentId);
      message.success('文件夹已创建');
      if (parentId === null) {
        await fetchRoots();
      } else {
        await fetchFiles(currentFolderId, searchQuery || null);
      }
    } catch (err) {
      message.error('创建文件夹失败');
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
          if (selectedFile?.id === id) setSelectedFile(null);
          fetchFiles(currentFolderId, searchQuery || null);
        } catch (err) {
          console.error('Delete error:', err);
          message.error('删除失败');
        }
      },
    });
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) {
      setRenameId(null);
      return;
    }
    try {
      await fileApi.renameItem(id, renameValue.trim());
      message.success('重命名成功');
      setRenameId(null);
      fetchFiles(currentFolderId, searchQuery || null);
    } catch (err) {
      message.error('重命名失败');
    }
  };

  const handleCopyLink = (file: FileInfo) => {
    const url = `${window.location.origin}/uploads/${file.filename}`;
    const copyToClipboard = (text: string) => {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(err);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    };

    copyToClipboard(url).then(() => {
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

  const navigateTo = (folder: { id: string | null; name: string }) => {
    setSearchQuery('');
    const index = currentPath.findIndex(p => p.id === folder.id);
    if (index !== -1) {
      setCurrentPath(currentPath.slice(0, index + 1));
    } else {
      setCurrentPath([...currentPath, folder]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  };

  const getFileIcon = (record: FileInfo, large: boolean = false) => {
    const style = { fontSize: large ? '64px' : '20px', color: '#1890ff' };
    if (record.type === 'folder') return <FolderOpenOutlined style={{ ...style, color: '#ffc107' }} />;

    if (record.mimeType?.startsWith('image/')) return <FileImageOutlined style={{ ...style, color: '#52c41a' }} />;
    if (record.mimeType?.startsWith('video/')) return <PlayCircleOutlined style={{ ...style, color: '#1890ff' }} />;
    if (record.mimeType?.includes('pdf')) return <FilePdfOutlined style={{ ...style, color: '#f5222d' }} />;
    if (record.mimeType?.includes('zip') || record.mimeType?.includes('rar')) return <FileZipOutlined style={{ ...style, color: '#faad14' }} />;
    if (record.mimeType?.includes('text/')) return <FileTextOutlined style={{ ...style, color: '#8c8c8c' }} />;
    return <FileOutlined style={{ ...style, color: '#8c8c8c' }} />;
  };

  const getMenuItems = (record: FileInfo) => [
    { key: 'preview', label: '预览', icon: <EyeOutlined />, onClick: () => setSelectedFile(record) },
    { key: 'download', label: '下载', icon: <DownloadOutlined />, onClick: () => handleDownload(record), disabled: record.type === 'folder' },
    { key: 'rename', label: '重命名', icon: <EditOutlined />, onClick: () => { setRenameId(record.id); setRenameValue(record.originalName); } },
    { key: 'copy', label: '复制链接', icon: <CopyOutlined />, onClick: () => handleCopyLink(record), disabled: record.type === 'folder' },
    { type: 'divider' as const },
    { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.id) },
  ];

  const getAsideFolderMenuItems = (record: FileInfo) => [
    { key: 'rename', label: '重命名', icon: <EditOutlined />, onClick: (e: any) => { e.domEvent.stopPropagation(); setRenameId(record.id); setRenameValue(record.originalName); } },
    { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true, onClick: (e: any) => { e.domEvent.stopPropagation(); handleDelete(record.id); } },
  ];

  const getAsideBgMenuItems = () => [
    { key: 'newFolder', label: '新建文件夹', icon: <FolderAddOutlined />, onClick: () => handleCreateFolder(null) },
    { key: 'refresh', label: '刷新', icon: <CloudOutlined />, onClick: handleRefresh },
  ];

  const getContentBgMenuItems = () => [
    { key: 'newFolder', label: '新建文件夹', icon: <FolderAddOutlined />, onClick: () => handleCreateFolder(currentFolderId) },
    { key: 'upload', label: '上传文件', icon: <UploadOutlined />, onClick: () => uploadButtonRef.current?.click() },
  ];

  const columns: ColumnsType<FileInfo> = [
    {
      title: '名称',
      dataIndex: 'originalName',
      key: 'originalName',
      render: (text, record) => (
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
          onClick={(e) => {
            e.stopPropagation();
            if (record.type === 'folder') {
              navigateTo({ id: record.id, name: record.originalName });
            } else {
              setSelectedFile(record);
            }
          }}
        >
          {getFileIcon(record)}
          {renameId === record.id ? (
            <Input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={() => handleRename(record.id)}
              onPressEnter={() => handleRename(record.id)}
              onClick={e => e.stopPropagation()}
              size="small"
              style={{ marginLeft: '12px', width: '200px' }}
            />
          ) : (
            <Text style={{ marginLeft: '12px' }}>{text}</Text>
          )}
        </div>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size, record) => record.type === 'file' ? formatSize(size || 0) : '--',
    },
    {
      title: '修改时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
    },
    {
      title: '',
      key: 'action',
      width: 40,
      render: (_, record) => (
        <Dropdown menu={{ items: getMenuItems(record) }} trigger={['click']}>
          <Button type="text" icon={<EllipsisOutlined />} onClick={e => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  const renderPreviewContent = () => {
    if (!selectedFile) return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf' }}>
        <InfoCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
        <Text type="secondary">选择文件查看详情</Text>
      </div>
    );

    const { mimeType, filename, originalName, size, createdAt } = selectedFile;
    const url = `/uploads/${filename}`;

    return (
      <div style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {selectedFile.type === 'file' && mimeType?.startsWith('image/') ? (
            <img src={url} alt={originalName} style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          ) : (
            getFileIcon(selectedFile, true)
          )}
          <Title level={4} style={{ marginTop: '24px', overflowWrap: 'break-word' }}>{originalName}</Title>
          <Text type="secondary">{selectedFile.type === 'folder' ? '文件夹' : (mimeType || '未知类型')}</Text>
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">文件大小:</Text>
            <Text>{selectedFile.type === 'file' ? formatSize(size || 0) : '--'}</Text>
          </div>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">创建时间:</Text>
            <Text>{formatDate(createdAt)}</Text>
          </div>
          {selectedFile.type === 'file' && (
            <Space direction="vertical" style={{ width: '100%', marginTop: '24px' }}>
              <Button block type="primary" icon={<DownloadOutlined />} onClick={() => handleDownload(selectedFile)}>下载文件</Button>
              <Button block icon={<CopyOutlined />} onClick={() => handleCopyLink(selectedFile)}>复制链接</Button>
            </Space>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout style={{ height: 'calc(100vh - 80px)', background: '#fff' }}>
      {/* Sidebar */}
      <Sider width={240} style={{ background: '#f5f5f7', borderRight: '1px solid #e5e5e5' }} theme="light">
        <Dropdown menu={{ items: getAsideBgMenuItems() }} trigger={['contextMenu']}>
          <div style={{ height: '100%', padding: '20px 16px' }}>
            <Title level={5} style={{ color: '#8e8e93', fontSize: '11px', textTransform: 'uppercase', marginBottom: '12px' }}>资源位置</Title>
            <Menu
              mode="inline"
              selectedKeys={[currentPath[0]?.id || '']}
              style={{ background: 'transparent', border: 'none' }}
              items={roots.map(root => ({
                key: root.id,
                icon: <CloudOutlined />,
                label: (
                  <Dropdown menu={{ items: getAsideFolderMenuItems(root) }} trigger={['contextMenu']}>
                    <span
                      style={{ width: '100%', display: 'inline-block' }}
                      onContextMenu={(e) => e.stopPropagation()}
                    >
                      {root.originalName}
                    </span>
                  </Dropdown>
                ),
                onClick: () => setCurrentPath([{ id: root.id, name: root.originalName }])
              }))}
            />
          </div>
        </Dropdown>
      </Sider>

      {/* Main Content */}
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{
          height: '52px',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}>
          <Space size="large">
            <Space>
              <Button
                type="text"
                icon={<LeftOutlined />}
                disabled={currentPath.length <= 1}
                onClick={() => navigateTo(currentPath[currentPath.length - 2])}
              />
              <Button type="text" icon={<RightOutlined />} disabled />
            </Space>
            <Breadcrumb>
              {currentPath.map((p, i) => (
                <Breadcrumb.Item key={i} onClick={() => navigateTo(p)} style={{ cursor: 'pointer' }}>
                  {i === 0 ? <HomeOutlined /> : p.name}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </Space>
          <Space>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索所有文件"
              variant="filled"
              style={{ width: '200px', borderRadius: '6px' }}
              value={searchQuery}
              onChange={handleSearch}
              allowClear
            />
            <Button icon={<FolderAddOutlined />} onClick={() => handleCreateFolder(currentFolderId)}>新建文件夹</Button>
            <Upload customRequest={handleUpload} showUploadList={false} multiple>
              <Button ref={uploadButtonRef} type="primary" icon={<UploadOutlined />}>上传</Button>
            </Upload>
            <Button type="text" icon={<InfoCircleOutlined />} onClick={() => setShowPreview(!showPreview)} />
          </Space>
        </div>

        {/* File Explorer */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Dropdown menu={{ items: getContentBgMenuItems() }} trigger={['contextMenu']}>
            <div style={{ minHeight: '100%' }}>
              <Table
                columns={columns}
                dataSource={files}
                rowKey="id"
                loading={loading}
                pagination={false}
                onRow={(record) => ({
                  onClick: () => setSelectedFile(record),
                  onContextMenu: (e) => e.stopPropagation(),
                  onDoubleClick: (e) => {
                    e.stopPropagation();
                    if (record.type === 'folder') {
                      navigateTo({ id: record.id, name: record.originalName });
                    }
                  },
                })}
                rowClassName={(record) => record.id === selectedFile?.id ? 'selected-row' : ''}
                components={{
                  body: {
                    row: (props: any) => {
                      const record = files.find(f => f.id === props['data-row-key']);
                      if (!record) return <tr {...props} />;
                      return (
                        <Dropdown
                          menu={{ items: getMenuItems(record) }}
                          trigger={['contextMenu']}
                          onOpenChange={(open) => {
                            if (open) setSelectedFile(record);
                          }}
                        >
                          <tr {...props} />
                        </Dropdown>
                      );
                    }
                  }
                }}
              />
            </div>
          </Dropdown>
        </div>
      </Content>

      {/* Preview Pane */}
      {showPreview && (
        <Sider width={300} style={{ background: '#fff', borderLeft: '1px solid #e5e5e5' }} theme="light">
          {renderPreviewContent()}
        </Sider>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .ant-table-thead > tr > th {
          background: #fff !important;
          color: #8e8e93 !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          height: 32px !important;
          padding: 8px 16px !important;
        }
        .ant-table-row {
          transition: background 0.2s;
        }
        .ant-table-row:hover {
          background-color: #f5f5f7 !important;
        }
        .selected-row {
          background-color: #e8f4ff !important;
        }
        .ant-breadcrumb {
          font-size: 13px;
          font-weight: 500;
        }
        .ant-layout-sider {
          transition: none !important;
        }
        .ant-menu-item-selected {
          background-color: #e5e5e5 !important;
          color: #000 !important;
        }
        .ant-menu-item {
          border-radius: 6px !important;
          margin: 4px 0 !important;
          height: 32px !important;
          line-height: 32px !important;
        }
      `}} />
    </Layout>
  );
};

export default Storage;
export { Storage as Experiment };
