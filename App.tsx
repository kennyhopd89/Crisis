
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

/**
 * Normalizes a URL string for consistent comparison.
 * - Forces HTTPS protocol.
 * - Removes 'www.' subdomain.
 * - Removes trailing slashes.
 * - Removes common tracking parameters.
 * - Sorts remaining query parameters alphabetically.
 * @param urlString The URL to normalize.
 * @returns A normalized URL string.
 */
const normalizeUrl = (urlString: string): string => {
  let urlWithProtocol = urlString.trim();
  if (!/^https?:\/\//i.test(urlWithProtocol)) {
    urlWithProtocol = 'https://' + urlWithProtocol;
  }

  try {
    const url = new URL(urlWithProtocol);
    
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.substring(4);
    }
    
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', '_ga', 'mc_cid', 'mc_eid', 'msclkid', 'dclid', '_r', '_t'];
    trackingParams.forEach(param => url.searchParams.delete(param));
    
    const sortedParams = new URLSearchParams();
    Array.from(url.searchParams.keys()).sort().forEach(key => {
        url.searchParams.getAll(key).sort().forEach(value => {
            sortedParams.append(key, value);
        });
    });
    url.search = sortedParams.toString();
    
    return `https://${url.hostname}${url.pathname}${url.search}`;
  } catch (error) {
    // Fallback for invalid URLs: basic trimming, lowercasing, and trailing slash removal
    return urlString.trim().toLowerCase().replace(/\/$/, "");
  }
};


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

  const handleSaveLink = async (linkData: Link) => {
    const isEditing = !!linkData.id;

    const normalizedUrl = normalizeUrl(linkData.url);

    // Kiểm tra link trùng lặp (hoạt động cho cả thêm mới và chỉnh sửa)
    const isDuplicate = links.some(
      link => (!isEditing || link.id !== linkData.id) && normalizeUrl(link.url) === normalizedUrl
    );

    if (isDuplicate) {
      alert('Lỗi: Link này đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.');
      return; // Dừng thực thi nếu link bị trùng
    }
    
    const action = isEditing ? 'updateLink' : 'addLink';
    const payload = { ...linkData };
      
    try {
      await fetch(API_URL, {
        method: 'POST',
        redirect: "follow",
        body: JSON.stringify({ action, payload }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
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
    const linkToDelete = links.find(link => link.id === linkId);
    if (!linkToDelete) {
        alert("Lỗi: Không tìm thấy link để xóa.");
        return;
    }

    // Bước 1: Yêu cầu nhập tên người xóa
    const deletedBy = prompt("Để tiếp tục, vui lòng nhập TÊN của bạn:");
    if (!deletedBy || deletedBy.trim() === '') {
        alert("Hành động xóa đã được hủy do không nhập tên.");
        return;
    }

    // Bước 2: Yêu cầu nhập văn bản xác nhận
    const confirmationText = "XÁC NHẬN XÓA";
    const userConfirmation = prompt(
        `Bạn đang chuẩn bị xóa (lưu trữ) link:\n` +
        `- Vấn đề: ${linkToDelete.issueType || 'Không có'}\n` +
        `- URL: ${linkToDelete.url}\n\n` +
        `Hành động này không thể hoàn tác. Để xác nhận, vui lòng nhập chính xác cụm từ sau vào ô bên dưới:\n\n` +
        `${confirmationText}`
    );

    // Bước 3: So sánh văn bản xác nhận
    if (userConfirmation !== confirmationText) {
        alert("Xác nhận không khớp. Hành động xóa đã được hủy.");
        return;
    }

    // Bước 4: Tiến hành xóa
    const payload = {
        id: linkId,
        deletedBy: deletedBy.trim(),
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify({
                action: 'deleteLink',
                payload: payload
            }),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
        });
        alert(`Link đã được xóa (lưu trữ) bởi ${deletedBy.trim()}.`);
        fetchData();
    } catch (error) {
        console.error("Lỗi khi xóa link:", error);
        alert("Xóa link thất bại. Vui lòng thử lại.");
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
