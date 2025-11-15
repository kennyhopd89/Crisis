
import React, { useState, useEffect } from 'react';
import { Link, Severity, Status, SourceType } from '../types';

interface LinkEditorProps {
  onSave: (link: Link) => void;
  onCancel: () => void;
  existingLink: Link | null;
}

const LinkEditor: React.FC<LinkEditorProps> = ({ onSave, onCancel, existingLink }) => {
  const [link, setLink] = useState<Omit<Link, 'id' | 'detectedAt'>>({
    url: '',
    source: '',
    sourceType: SourceType.Facebook,
    severity: Severity.Medium,
    issueType: '',
    detectedBy: '',
    assignedTo: '',
    status: Status.Pending,
    actionNotes: '',
  });

  useEffect(() => {
    if (existingLink) {
      setLink(existingLink);
    }
  }, [existingLink]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLink(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.url || !link.source) {
        alert('Vui lòng điền URL bài viết và Nguồn đăng.');
        return;
    }
    const linkToSave: Link = existingLink 
      ? { ...existingLink, ...link }
      : { ...link, id: '', detectedAt: new Date().toISOString() };
    
    onSave(linkToSave);
  };

  const inputClass = "w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      <h2 className="text-2xl font-bold text-white">{existingLink ? 'Chỉnh sửa Link' : 'Thêm Link Tiêu Cực Mới'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="url" className={labelClass}>Link bài viết tiêu cực (*)</label>
          <input type="url" id="url" name="url" value={link.url} onChange={handleChange} required className={inputClass} placeholder="https://..."/>
        </div>
        <div>
          <label htmlFor="source" className={labelClass}>Nguồn đăng (URL Profile/Page/Group) (*)</label>
          <input type="url" id="source" name="source" value={link.source} onChange={handleChange} required className={inputClass} placeholder="https://facebook.com/username"/>
        </div>
        <div>
          <label htmlFor="sourceType" className={labelClass}>Loại nguồn</label>
          <select id="sourceType" name="sourceType" value={link.sourceType} onChange={handleChange} className={inputClass}>
            {Object.values(SourceType).map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="severity" className={labelClass}>Mức độ</label>
          <select id="severity" name="severity" value={link.severity} onChange={handleChange} className={inputClass}>
            {Object.values(Severity).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="issueType" className={labelClass}>Loại vấn đề</label>
          <input type="text" id="issueType" name="issueType" value={link.issueType} onChange={handleChange} className={inputClass} placeholder="Review ác ý, sai sự thật..."/>
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>Tình trạng</label>
          <select id="status" name="status" value={link.status} onChange={handleChange} className={inputClass}>
            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="detectedBy" className={labelClass}>Người phát hiện</label>
          <input type="text" id="detectedBy" name="detectedBy" value={link.detectedBy} onChange={handleChange} className={inputClass} placeholder="Tên nhân viên"/>
        </div>
        <div>
          <label htmlFor="assignedTo" className={labelClass}>Người được giao xử lý</label>
          <input type="text" id="assignedTo" name="assignedTo" value={link.assignedTo} onChange={handleChange} className={inputClass} placeholder="Tên nhân viên"/>
        </div>
        <div className="md:col-span-2">
            <label htmlFor="actionNotes" className={labelClass}>Ghi chú hành động</label>
            <textarea id="actionNotes" name="actionNotes" value={link.actionNotes} onChange={handleChange} rows={3} className={inputClass} placeholder="Đã bình luận, báo cáo..."></textarea>
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md text-sm font-medium bg-slate-600 hover:bg-slate-500 text-white transition">Hủy</button>
        <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition">{existingLink ? 'Lưu thay đổi' : 'Thêm Link'}</button>
      </div>
    </form>
  );
};

export default LinkEditor;
