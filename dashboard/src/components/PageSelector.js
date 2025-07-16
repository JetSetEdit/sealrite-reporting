import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, Search } from 'lucide-react';

const PageSelector = ({ selectedPage, onPageSelect }) => {
  const [pages, setPages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/pages`);
        setPages(response.data);
      } catch (error) {
        console.error('Error fetching pages:', error);
        // Fallback to mock data if API fails
        const mockPages = [
          { id: '123456789', name: 'SealRite Official' },
          { id: '987654321', name: 'SealRite Marketing' },
          { id: '456789123', name: 'SealRite Support' }
        ];
        setPages(mockPages);
      }
    };

    fetchPages();
  }, []);

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPageData = pages.find(page => page.id === selectedPage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-sm font-medium text-gray-900">
          {selectedPageData ? selectedPageData.name : 'Select Page'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredPages.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No pages found
              </div>
            ) : (
              filteredPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => {
                    onPageSelect(page.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                    selectedPage === page.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{page.name}</div>
                  <div className="text-sm text-gray-500">ID: {page.id}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default PageSelector; 