import React, { useState } from 'react';

interface TaskInputProps {
  onAdd: (title: string) => Promise<void>;
}

export function TaskInput({ onAdd }: TaskInputProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onAdd(title);
    setTitle('');
  };

  return (
    <form className="task-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="你需要做什么？"
        className="input"
      />
      <button type="submit" className="btn btn-primary btn-small" disabled={!title.trim()}>
        添加
      </button>
    </form>
  );
}
