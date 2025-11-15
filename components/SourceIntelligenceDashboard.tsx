
import React from 'react';
import { Source } from '../types';
import { LinkIcon } from './icons';


interface SourceIntelligenceDashboardProps {
  sources: Source[];
}

const SourceIntelligenceDashboard: React.FC<SourceIntelligenceDashboardProps> = ({ sources }) => {
  return (
    <div className="bg-slate-800/50 rounded-lg shadow-xl p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">Source Intelligence</h2>
       <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Nguồn / Link Profile</th>
              <th scope="col" className="px-6 py-3">Loại Kênh</th>
              <th scope="col" className="px-6 py-3 text-center">Tổng số bài tiêu cực</th>
              <th scope="col" className="px-6 py-3">Ghi chú</th>
              <th scope="col" className="px-6 py-3 text-center">Nghi vấn</th>
            </tr>
          </thead>
          <tbody>
             {sources.length > 0 ? sources.sort((a, b) => b.negativePostCount - a.negativePostCount).map(source => (
              <tr key={source.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4">
                    <a href={source.profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium text-indigo-400 hover:underline" title={source.profileUrl}>
                       <LinkIcon className="w-4 h-4 shrink-0"/>
                       <span className="truncate">{source.name || source.profileUrl}</span>
                    </a>
                </td>
                <td className="px-6 py-4">{source.type}</td>
                <td className="px-6 py-4 text-center">
                    <span className="font-bold text-lg text-red-400">{source.negativePostCount}</span>
                </td>
                <td className="px-6 py-4 text-xs italic">{source.notes}</td>
                <td className="px-6 py-4 text-center">
                    {source.suspicious && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Có</span>}
                </td>
              </tr>
            )) : (
                 <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">Chưa có nguồn nào được ghi nhận.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SourceIntelligenceDashboard;
