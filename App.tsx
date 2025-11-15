
import React, { useState, useEffect, useCallback } from 'react';
import { Link, Source, View } from './types';
import Header from './components/Header';
import LinkMonitoringDashboard from './components/LinkMonitoringDashboard';
import SourceIntelligenceDashboard from './components/SourceIntelligenceDashboard';
import LinkEditor from './components/LinkEditor';
import Modal from './components/Modal';

// !!! QUAN TRỌNG: Hãy đảm bảo bạn dán ĐÚNG Web App URL của bạn vào đây.
// URL đúng chỉ có một "https://script.google.com/macros/s/" ở đầu.
const API_URL = "https://script.google.com/macros/s/AKfycbzREAeS-aFnaKD7-pty5Hd_vn5380UJZFEE4aQwTT03InbBwl4-C55VE-j02NcaUj8ecQ/exec";

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Links);
  // Chuyển từ useLocalStorage sang useState
  const [links, setLinks] = useState<Link[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  // Hàm để lấy dữ liệu từ backend
  const fetchData = useCallback(async () => {
    if (!loading) setLoading(true); // Hiển thị loading khi fetch lại
    try {
      // Sử dụng Promise.all để gọi API song song
      const [linksResponse, sourcesResponse] = await Promise.all([
        fetch(`${API_URL}?action=getLinks`, { redirect: 'follow' }),
        fetch(`${API_URL}?action=getSources`, { redirect: 'follow' })
      ]);

      if (!linksResponse.ok || !sourcesResponse.ok) {
        throw new Error('Lỗi mạng hoặc API không phản hồi');
      }
      
      const linksData = await linksResponse.json();
      const sourcesData = await sourcesResponse.json();

      setLinks(Array.isArray(linksData) ? linksData : []);
      setSources(Array.isArray(sourcesData) ? sourcesData : []);

    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      alert("Không thể kết nối đến server. Vui lòng kiểm tra lại URL API và đảm bảo đã deploy Apps Script chính xác.");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Gọi API khi component được mount lần đầu
  useEffect(() => {
    if (API_URL.includes("YOUR_APPS_SCRIPT_WEB_APP_URL")) { // Một kiểm tra nhỏ để nhắc nhở người dùng
        alert("Vui lòng cập nhật API_URL trong file App.tsx");
        setLoading(false);
        return;
    }
    fetchData();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần

  const handleSaveLink = async (linkToSave: Link) => {
    const isEditing = !!editingLink;

    // Kiểm tra link trùng lặp chỉ khi thêm mới
    if (!isEditing) {
      const isDuplicate = links.some(link => link.url.trim().toLowerCase() === linkToSave.url.trim().toLowerCase());
      if (isDuplicate) {
        alert('Lỗi: Link này đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.');
        return; // Dừng thực thi nếu link bị trùng
      }
    }

    const action = isEditing ? 'updateLink' : 'addLink';
    
    // Tạo payload cho API. Backend sẽ tự gán ID và detectedAt cho link mới.
    const payload = { ...linkToSave };
      
    try {
      // Apps Script yêu cầu gửi POST với kiểu Content-Type đặc biệt
      await fetch(API_URL, {
        method: 'POST',
        redirect: "follow",
        body: JSON.stringify({ action, payload }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      
      // Sau khi gửi, tải lại toàn bộ dữ liệu để đảm bảo đồng bộ
      fetchData();

    } catch (error) {
      console.error("Lỗi khi lưu link:", error);
      alert("Lưu link thất bại. Vui lòng thử lại.");
    }
    
    closeModal();
  };
  
  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };
  
  const handleDeleteLink = async (linkId: string) => {
     if (window.confirm('Bạn có chắc chắn muốn xóa link này?')) {
        try {
            await fetch(API_URL, {
                method: 'POST',
                redirect: 'follow',
                body: JSON.stringify({ action: 'deleteLink', payload: { id: linkId } }),
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
            });
            // Tải lại dữ liệu sau khi xóa
            fetchData();
        } catch (error) {
            console.error("Lỗi khi xóa link:", error);
            alert("Xóa link thất bại.");
        }
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
  
  const renderContent = () => {
    if (loading) {
        return <div className="text-center p-10">Đang tải dữ liệu...</div>;
    }
    if (view === View.Links) {
        return <LinkMonitoringDashboard 
            links={links} 
            onEdit={handleEditLink} 
            onDelete={handleDeleteLink}
        />;
    }
    return <SourceIntelligenceDashboard sources={sources} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans">
      <Header currentView={view} setView={setView} onAddLink={openAddModal} />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderContent()}
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
