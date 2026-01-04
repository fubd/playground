import React, { useState, useEffect } from 'react';
import { Card, Input, List, Checkbox, Button, Typography, Space, message, Spin, Empty } from 'antd';
import { DeleteOutlined, PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

const TodoPage: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const API_URL = '/api/todos';

  const fetchTodos = async () => {
    try {
      const res = await axios.get(API_URL);
      setTodos(res.data);
    } catch {
      message.error('无法获取待办事项');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAdd = async () => {
    if (!inputValue.trim()) return;
    try {
      const res = await axios.post(API_URL, { title: inputValue });
      setTodos([res.data, ...todos]);
      setInputValue('');
      message.success('已添加待办事项');
    } catch {
      message.error('添加失败');
    }
  };

  const handleToggle = async (id: number, completed: boolean) => {
    try {
      await axios.put(`${API_URL}/${id}`, { completed: !completed });
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));
    } catch {
      message.error('更新状态失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTodos(todos.filter(t => t.id !== id));
      message.success('已删除');
    } catch {
      message.error('删除失败');
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditValue(todo.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (id: number) => {
    if (!editValue.trim()) return;
    try {
      await axios.put(`${API_URL}/${id}`, { title: editValue });
      setTodos(todos.map(t => t.id === id ? { ...t, title: editValue } : t));
      setEditingId(null);
      message.success('已更新');
    } catch {
      message.error('更新失败');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <Card
        bordered={false}
        style={{ borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
        title={<Title level={3} style={{ margin: 0 }}>待办事项 ✨</Title>}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', gap: '10px' }}>
            <Input
              size="large"
              placeholder="添加新的任务..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={handleAdd}
              style={{ borderRadius: '12px' }}
            />
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{ borderRadius: '12px', height: 'auto' }}
            >
              添加
            </Button>
          </div>

          <Spin spinning={loading}>
            {todos.length === 0 && !loading ? (
              <Empty description="暂无待办事项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={todos}
                renderItem={(todo) => (
                  <List.Item
                    actions={[
                      editingId === todo.id ? (
                        <Space key="actions">
                          <Button
                            type="text"
                            icon={<CheckOutlined style={{ color: '#52c41a' }} />}
                            onClick={() => saveEdit(todo.id)}
                          />
                          <Button
                            type="text"
                            icon={<CloseOutlined style={{ color: '#ff4d4f' }} />}
                            onClick={cancelEdit}
                          />
                        </Space>
                      ) : (
                        <Space key="actions">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => startEdit(todo)}
                          />
                          <Button
                            type="text"
                            icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
                            onClick={() => handleDelete(todo.id)}
                          />
                        </Space>
                      )
                    ]}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: todo.completed ? '#f9f9f9' : 'transparent',
                      transition: 'all 0.3s ease',
                      borderBottom: '1px solid #f0f0f0',
                      marginBottom: '8px'
                    }}
                  >
                    <Space style={{ width: '100%' }}>
                      <Checkbox
                        checked={todo.completed}
                        onChange={() => handleToggle(todo.id, todo.completed)}
                      />
                      {editingId === todo.id ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onPressEnter={() => saveEdit(todo.id)}
                          autoFocus
                          style={{ borderRadius: '6px' }}
                        />
                      ) : (
                        <Text
                          delete={todo.completed}
                          type={todo.completed ? 'secondary' : undefined}
                          style={{ fontSize: '16px' }}
                        >
                          {todo.title}
                        </Text>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </Space>
      </Card>
    </div>
  );
};

export default TodoPage;
