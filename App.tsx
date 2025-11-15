
import React, { useState, useEffect, useCallback } from 'react';
import { Link, Source, Status, View } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import LinkMonitoringDashboard from './components/LinkMonitoringDashboard';
import SourceIntelligenceDashboard from './components/SourceIntelligenceDashboard';
import LinkEditor from './components/LinkEditor';
import Modal from './components/Modal';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Links);
  const [links, setLinks] = useLocalStorage<Link[]>('negativeLinks', []);
  const [sources, setSources] = useLocalStorage<Source[]>('negativeSources', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const updateSourceIntelligence = useCallback((newLink: Link) => {
    setSources(prevSources => {
      const sourceIndex = prevSources.findIndex(s => s.profileUrl.toLowerCase() === newLink.source.toLowerCase());
      if (sourceIndex > -1) {
        const updatedSources = [...prevSources];
        updatedSources[sourceIndex].negativePostCount += 1;
        return updatedSources;
      } else {
        const newSource: Source = {
          id: Date.now().toString(),
          name: newLink.source, // Tên ban đầu có thể là URL
          profileUrl: newLink.source,
          negativePostCount: 1,
          type: 'Chưa xác định',
          notes: 'Tự động thêm vào hệ thống.',
          suspicious: false,
        };
        return [...prevSources, newSource];
      }
    });
  }, [setSources]);

  const handleSaveLink = (linkToSave: Link) => {
    if (editingLink) {
      // Logic cập nhật link
      setLinks(prevLinks => prevLinks.map(l => l.id === linkToSave.id ? linkToSave : l));
    } else {
      // Logic thêm link mới
      const newLink = { ...linkToSave, id: Date.now().toString() };
      setLinks(prevLinks => [newLink, ...prevLinks]);
      updateSourceIntelligence(newLink);
    }
    closeModal();
  };
  
  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };
  
  const handleDeleteLink = (linkId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa link này?')) {
        setLinks(prevLinks => prevLinks.filter(l => l.id !== linkId));
        // Optional: Add logic to decrement source count if needed
    }
  };

  const openAddModal = () => {
    setEditingLink(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans">
      <Header currentView={view} setView={setView} onAddLink={openAddModal} />
      <main className="p-4 sm:p-6 lg:p-8">
        {view === View.Links ? (
          <LinkMonitoringDashboard 
            links={links} 
            onEdit={handleEditLink} 
            onDelete={handleDeleteLink}
          />
        ) : (
          <SourceIntelligenceDashboard sources={sources} />
        )}
      </main>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <LinkEditor 
          onSave={handleSaveLink} 
          onCancel={closeModal} 
          existingLink={editingLink} 
        />
      </Modal>
    </div>
  );
};

export default App;
