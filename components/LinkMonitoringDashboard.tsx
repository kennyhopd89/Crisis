
import React, { useState, useMemo } from 'react';
import { Link, Severity, Status, SourceType } from '../types';
import { EditIcon, TrashIcon, LinkIcon } from './icons';

interface LinkMonitoringDashboardProps {
  links: Link[];
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
}

const severityColor = {
  [Severity.High]: 'bg-red-500/20 text-red-400 border border-red-500/30',
  [Severity.Medium]: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  [Severity.Low]: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
};

const statusColor = {
  [Status.Done]: 'bg-green-500/20 text-green-400',
  [Status.InProgress]: 'bg-blue-500/20 text-blue-400',
  [Status.Pending]: 'bg-slate-600/30 text-slate-400',
};

const LinkMonitoringDashboard: React.FC<LinkMonitoringDashboardProps> = ({ links, onEdit, onDelete }) => {
  const [filters, setFilters] = useState({ severity: '', status: '', sourceType: '' });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      return (
        (filters.severity ? link.severity === filters.severity : true) &&
        (filters.status ? link.status === filters.status : true) &&
        (filters.sourceType ? link.sourceType === filters.sourceType : true)
      );
    });
  }, [links, filters]);

  const exportToCSV = () => {
    if (filteredLinks.length === 0) {
        alert("Không có dữ liệu để xuất.");
        return;
    }
    const headers = Object.keys(filteredLinks[0]).join(',');
    const rows = filteredLinks.map(link => Object.values(link).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "links_tieu_cuc.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-800/50 rounded-lg shadow-xl p-6 border border-slate-700">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">Link Monitoring</h2>
        <div className="flex flex-wrap items-center gap-4">
          <select name="severity" value={filters.severity} onChange={handleFilterChange} className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Tất cả mức độ</option>
            {Object.values(Severity).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Tất cả trạng thái</option>
            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="sourceType" value={filters.sourceType} onChange={handleFilterChange} className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Tất cả nguồn</option>
            {Object.values(SourceType).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Link / Nguồn</th>
              <th scope="col" className="px-6 py-3">Mức độ</th>
              <th scope="col" className="px-6 py-3">Tình trạng</th>
              <th scope="col" className="px-6 py-3">Người xử lý</th>
              <th scope="col" className="px-6 py-3">Thời gian</th>
              <th scope="col" className="px-6 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.length > 0 ? filteredLinks.map(link => (
              <tr key={link.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium text-indigo-400 hover:underline truncate" title={link.url}>
                    <LinkIcon className="w-4 h-4 shrink-0"/> <span className="truncate">{link.issueType}</span>
                  </a>
                  <p className="text-xs text-slate-500 truncate" title={link.source}>{link.source}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${severityColor[link.severity]}`}>{link.severity}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor[link.status]}`}>{link.status}</span>
                </td>
                <td className="px-6 py-4">{link.assignedTo}</td>
                <td className="px-6 py-4 text-xs">{new Date(link.detectedAt).toLocaleString('vi-VN')}</td>
                <td className="px-6 py-4">
                   <div className="flex justify-center items-center gap-4">
                    <button onClick={() => onEdit(link)} className="text-slate-400 hover:text-indigo-400 transition-colors" title="Chỉnh sửa"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDelete(link.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Xóa"><TrashIcon className="w-5 h-5"/></button>
                  </div>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">Không có dữ liệu.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LinkMonitoringDashboard;
