import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Input,
  Slider,
  Modal,
  Tag,
  Image,
  Space,
  Typography,
  Row,
  Col,
  Empty,
  Button,
  Tooltip,
  Rate,
  Divider,
  Cascader,
} from 'antd';
import {
  SearchOutlined,
  BookOutlined,
  StarFilled,
  UserOutlined,
  BankOutlined,
  CalendarOutlined,
  DollarOutlined,
  LinkOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { booksApi } from '../../api/books';
import type { Book, BookQueryParams, Tag as CateNode } from '../../api/books';
import './index.css';

const { Title, Text, Paragraph } = Typography;

const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);
  const [sortInfo, setSortInfo] = useState<{ field: string; order: string }>({
    field: 'created_at',
    order: 'desc',
  });
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState<CateNode[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[][]>([]);


  // 搜索防抖
  const [searchDebounce, setSearchDebounce] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params: BookQueryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: searchText,
        tagCodes: selectedTags.map((path: string[]) => path[path.length - 1]),
        minRating: ratingRange[0],
        maxRating: ratingRange[1],
        sortBy: sortInfo.field as 'rating' | 'created_at' | 'title',
        sortOrder: sortInfo.order as 'asc' | 'desc',
      };

      const response = await booksApi.getBooks(params);

      setBooks(response.data || []);
      setPagination((prev: any) => ({
        ...prev,
        total: response.pagination?.total || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, selectedTags, ratingRange, sortInfo]);

  const fetchCategories = async () => {
    try {
      const response = await booksApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearch = (value: string) => {
    if (searchDebounce) clearTimeout(searchDebounce);

    const timeout = setTimeout(() => {
      setSearchText(value);
      setPagination((prev: any) => ({ ...prev, current: 1 }));
    }, 500);

    setSearchDebounce(timeout);
  };

  const handleTableChange = (
    pag: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Book> | SorterResult<Book>[],
    extra: { action: 'paginate' | 'sort' | 'filter'; currentDataSource: Book[] }
  ) => {
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    // 如果是排序或筛选操作，强制回到第一页
    const nextCurrent = (extra.action === 'sort' || extra.action === 'filter') ? 1 : (pag.current || 1);

    setPagination({
      current: nextCurrent,
      pageSize: pag.pageSize || 10,
      total: pagination.total,
    });

    if (singleSorter.field && singleSorter.order) {
      setSortInfo({
        field: String(singleSorter.field),
        order: singleSorter.order === 'ascend' ? 'asc' : 'desc',
      });
    } else {
      // 默认排序
      setSortInfo({ field: 'created_at', order: 'desc' });
    }
  };

  const handleRatingChange = (value: number[]) => {
    setRatingRange(value as [number, number]);
    setPagination((prev: any) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedTags([]);
    setRatingRange([0, 10]);
    setSortInfo({ field: 'created_at', order: 'desc' });
    setPagination({ current: 1, pageSize: 10, total: 0 });
  };

  const showBookDetail = (book: Book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const columns: ColumnsType<Book> = [
    {
      title: '封面',
      dataIndex: 'cover_image',
      key: 'cover_image',
      width: 80,
      render: (url: string) => (
        <Image
          src={url ? `/api/crawler/image-proxy?url=${encodeURIComponent(url)}` : 'https://via.placeholder.com/60x80?text=No+Cover'}
          alt="封面"
          width={60}
          height={80}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="https://via.placeholder.com/60x80?text=Error"
          preview={false}
        />
      ),
    },
    {
      title: '书名',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Book) => (
        <a onClick={() => showBookDetail(record)} className="book-title-link">
          {title}
        </a>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 200,
      ellipsis: true,
      render: (author: string) => (
        <Tooltip title={author}>
          <span>{author || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '分类',
      key: 'category',
      width: 150,
      render: (_: any, record: Book) => {
        const findPath = (nodes: CateNode[], targetCode: string, path: string[] = []): string[] | null => {
          for (const node of nodes) {
            if (node.code === targetCode) return [...path, node.name];
            if (node.children) {
              const res = findPath(node.children, targetCode, [...path, node.name]);
              if (res) return res;
            }
          }
          return null;
        };
        const path = findPath(categories, record.tag_code);
        return path ? path.join('/') : '-';
      }
    },
    {
      title: '出版社',
      dataIndex: 'publisher',
      key: 'publisher',
      width: 150,
      ellipsis: true,
      render: (publisher: string) => publisher || '-',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      sorter: true,
      sortOrder: sortInfo.field === 'rating' ? (sortInfo.order === 'asc' ? 'ascend' : 'descend') : null,
      render: (rating: number) => (
        <Space>
          <StarFilled style={{ color: '#faad14' }} />
          <Text strong style={{ color: rating >= 9 ? '#52c41a' : rating >= 7 ? '#1890ff' : '#666' }}>
            {rating ? rating.toFixed(1) : '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: '入库时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      sorter: true,
      sortOrder: sortInfo.field === 'created_at' ? (sortInfo.order === 'asc' ? 'ascend' : 'descend') : null,
      render: (date: string) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Book) => (
        <Space>
          <Button type="link" size="small" onClick={() => showBookDetail(record)}>
            详情
          </Button>
          <Tooltip title="在豆瓣查看">
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              href={record.url}
              target="_blank"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="books-page">
      <div className="books-header">
        <div className="header-content">
          <div className="header-icon">
            <BookOutlined />
          </div>
          <div className="header-text">
            <Title level={2} className="header-title">
              豆瓣书籍库
            </Title>
            <Text className="header-subtitle">
              自动采集的优质图书，共 {pagination.total} 本
            </Text>
          </div>
        </div>
      </div>

      <div className="books-content container">
        <Card className="books-card" bordered={false}>
          {/* 搜索和筛选栏 */}
          <div className="search-bar">
            <Row gutter={[16, 16]} align="middle">
              <Col flex="auto">
                <Input
                  placeholder="搜索书名、作者、出版社..."
                  prefix={<SearchOutlined />}
                  size="large"
                  allowClear
                  onChange={(e) => handleSearch(e.target.value)}
                  className="search-input"
                  style={{ minWidth: 200 }}
                />
              </Col>
              <Col flex="400px">
                <Cascader
                  style={{ width: '100%' }}
                  options={categories.map(c1 => ({
                    label: c1.name,
                    value: c1.code,
                    children: c1.children?.map(c2 => ({
                      label: `${c2.name} (${c2.bookCount || c2.book_count || 0})`,
                      value: c2.code,
                    }))
                  }))}
                  onChange={(val: any) => {
                    setSelectedTags(val as string[][]);
                    setPagination((prev: any) => ({ ...prev, current: 1 }));
                  }}
                  value={selectedTags}
                  multiple
                  maxTagCount="responsive"
                  placeholder="按层级分类筛选 (可多选)..."
                  showSearch
                />
              </Col>
              <Col>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchBooks}
                    loading={loading}
                  >
                    刷新
                  </Button>
                  <Button
                    onClick={handleReset}
                  >
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* 筛选面板 */}
            <div className="filter-panel" style={{ display: 'block' }}>
              <Row gutter={24} align="middle">
                <Col span={3}>
                  <Text type="secondary">评分筛选：</Text>
                </Col>
                <Col span={17}>
                  <Slider
                    range
                    min={0}
                    max={10}
                    step={1}
                    value={ratingRange}
                    onChange={handleRatingChange}
                    marks={{
                      0: '0',
                      5: '5',
                      7: '7',
                      9: '9',
                      10: '10',
                    }}
                  />
                </Col>
                <Col span={4}>
                  <Tag color="geekblue">
                    {ratingRange[0]} - {ratingRange[1]} 分
                  </Tag>
                </Col>
              </Row>
            </div>
          </div>

          {/* 书籍表格 */}
          <Table
            columns={columns}
            dataSource={books}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 本书`,
              pageSizeOptions: ['10', '50', '100'],
            }}
            onChange={handleTableChange}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无书籍数据"
                />
              ),
            }}
            className="books-table"
          />
        </Card>
      </div>

      {/* 书籍详情弹窗 */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        className="book-detail-modal"
        centered
      >
        {selectedBook && (
          <div className="book-detail">
            <Row gutter={24}>
              <Col span={8}>
                <Image
                  src={selectedBook.cover_image
                    ? `/api/crawler/image-proxy?url=${encodeURIComponent(selectedBook.cover_image)}`
                    : 'https://via.placeholder.com/200x280?text=No+Cover'
                  }
                  alt={selectedBook.title}
                  className="detail-cover"
                  fallback="https://via.placeholder.com/200x280?text=Error"
                />
              </Col>
              <Col span={16}>
                <Title level={3} className="detail-title">
                  {selectedBook.title}
                </Title>

                <div className="detail-rating">
                  <Rate disabled value={selectedBook.rating / 2} allowHalf />
                  <Text strong className="rating-score">
                    {selectedBook.rating?.toFixed(1) || '-'}
                  </Text>
                </div>

                <Divider />

                <div className="detail-info">
                  <div className="info-row">
                    <UserOutlined />
                    <Text type="secondary">作者：</Text>
                    <Text>{selectedBook.author || '未知'}</Text>
                  </div>
                  <div className="info-row">
                    <BankOutlined />
                    <Text type="secondary">出版社：</Text>
                    <Text>{selectedBook.publisher || '未知'}</Text>
                  </div>
                  <div className="info-row">
                    <CalendarOutlined />
                    <Text type="secondary">出版日期：</Text>
                    <Text>{selectedBook.publish_date || '未知'}</Text>
                  </div>
                  <div className="info-row">
                    <DollarOutlined />
                    <Text type="secondary">价格：</Text>
                    <Text>{selectedBook.price ? `¥${(selectedBook.price / 100).toFixed(2)}` : '未知'}</Text>
                  </div>
                </div>

                <Divider />

                <div className="detail-summary">
                  <Title level={5}>内容简介</Title>
                  <Paragraph
                    ellipsis={{ rows: 5, expandable: true, symbol: '展开' }}
                    className="summary-text"
                  >
                    {selectedBook.summary || '暂无简介'}
                  </Paragraph>
                </div>

                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  href={selectedBook.url}
                  target="_blank"
                  className="detail-link-btn"
                >
                  在豆瓣查看
                </Button>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Books;
