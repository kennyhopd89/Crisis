
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
  const [links, setLinks] = useState<Link[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
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
  }, []);

  useEffect(() => {
    if (API_URL.includes("YOUR_APPS_SCRIPT_WEB_APP_URL")) {
        alert("Vui lòng cập nhật API_URL trong file App.tsx");
        setLoading(false);
        return;
    }
    fetchData();
  }, [fetchData]);

  const handleSaveLink = async (linkData: Link) => {
    const isEditing = !!linkData.id;
    const normalizedUrl = normalizeUrl(linkData.url);

    const isDuplicate = links.some(
      link => (!isEditing || link.id !== linkData.id) && normalizeUrl(link.url) === normalizedUrl
    );

    if (isDuplicate) {
      alert('Lỗi: Link này đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.');
      return;
    }
    
    const action = isEditing ? 'updateLink' : 'addLink';
    const payload = { ...linkData };
      
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: "follow",
        body: JSON.stringify({ action, payload }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with status ${response.status}: ${errorText || 'Unknown error'}`);
      }
      fetchData();
    } catch (error) {
      console.error("Lỗi khi lưu link:", error);
      alert(`Lưu link thất bại. Lỗi: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    closeModal();
  };
  
  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };
  
  // Hàm cốt lõi để thực hiện yêu cầu xóa trên server
  const performDeleteRequest = async (linkToDelete: Link, deletedBy: string) => {
    const payload = {
      ...linkToDelete,
      deletedBy: deletedBy.trim(),
    };
    const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({ action: 'deleteLink', payload }),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with status ${response.status}: ${errorText || 'Unknown error'}`);
    }
  };


  const handleDeleteLink = async (linkId: string) => {
    const linkToDelete = links.find(link => link.id === linkId);
    if (!linkToDelete) {
        alert("Lỗi: Không tìm thấy link để xóa.");
        return;
    }

    const deletedBy = prompt("Để tiếp tục, vui lòng nhập TÊN của bạn:");
    if (!deletedBy || deletedBy.trim() === '') {
        alert("Hành động xóa đã được hủy do không nhập tên.");
        return;
    }

    const confirmationText = "XÁC NHẬN XÓA";
    const userConfirmation = prompt(
        `Bạn đang chuẩn bị xóa (lưu trữ) link:\n` +
        `- Vấn đề: ${linkToDelete.issueType || 'Không có'}\n` +
        `- URL: ${linkToDelete.url}\n\n` +
        `Hành động này không thể hoàn tác. Để xác nhận, vui lòng nhập chính xác cụm từ sau:\n\n` +
        `${confirmationText}`
    );

    if (userConfirmation !== confirmationText) {
        alert("Xác nhận không khớp. Hành động xóa đã được hủy.");
        return;
    }
    
    try {
        await performDeleteRequest(linkToDelete, deletedBy);
        alert(`Link đã được xóa (lưu trữ) bởi ${deletedBy.trim()}.`);
        fetchData();
    } catch (error) {
        console.error("Lỗi khi xóa link:", error);
        alert(`Xóa link thất bại. Lỗi: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleDeduplicate = async () => {
    if (!window.confirm("Chức năng này sẽ quét toàn bộ dữ liệu, tìm các link trùng lặp (giữ lại link cũ nhất) và xóa các bản sao. Hành động này không thể hoàn tác. Bạn có muốn tiếp tục?")) {
      return;
    }
    setIsDeduplicating(true);

    // Bước 1: Nhóm tất cả các link theo URL đã được chuẩn hóa
    const urlMap = new Map<string, Link[]>();
    links.forEach(link => {
      const normalized = normalizeUrl(link.url);
      if (!urlMap.has(normalized)) {
        urlMap.set(normalized, []);
      }
      urlMap.get(normalized)!.push(link);
    });

    // Bước 2: Xác định các link cần xóa một cách trực tiếp
    const linksToDelete: Link[] = [];
    urlMap.forEach((linkGroup) => {
      // Chỉ xử lý các nhóm có nhiều hơn 1 link (tức là có trùng lặp)
      if (linkGroup.length > 1) {
        // Sắp xếp để xác định bản ghi gốc (cũ nhất)
        linkGroup.sort((a, b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime());
        // Tất cả các link trừ link đầu tiên (cũ nhất) được coi là bản sao cần xóa
        linksToDelete.push(...linkGroup.slice(1));
      }
    });

    if (linksToDelete.length === 0) {
      setIsDeduplicating(false);
      alert("Không tìm thấy link nào trùng lặp.");
      return;
    }

    const deletedBy = prompt(`Tìm thấy ${linksToDelete.length} link trùng lặp. Vui lòng nhập TÊN của bạn để xác nhận xóa:`
    );

    if (!deletedBy || deletedBy.trim() === '') {
        setIsDeduplicating(false);
        alert("Hành động dọn dẹp đã được hủy do không nhập tên.");
        return;
    }
    
    let successCount = 0;
    let errorCount = 0;

    for (const link of linksToDelete) {
      try {
        await performDeleteRequest(link, deletedBy);
        successCount++;
      } catch (error) {
        console.error(`Lỗi khi xóa link trùng lặp (ID: ${link.id}):`, error);
        errorCount++;
      }
    }
    
    setIsDeduplicating(false);
    alert(`Dọn dẹp hoàn tất!\n- Đã xóa thành công: ${successCount}\n- Thất bại: ${errorCount}`);
    
    if (successCount > 0) {
      fetchData(); // Tải lại dữ liệu sau khi dọn dẹp
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
     if (isDeduplicating) {
        return <div className="text-center p-10">Đang quét và dọn dẹp các link trùng lặp...</div>;
    }
    if (view === View.Links) {
        return <LinkMonitoringDashboard 
            links={links} 
            onEdit={handleEditLink} 
            onDelete={handleDeleteLink}
            onDeduplicate={handleDeduplicate}
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
