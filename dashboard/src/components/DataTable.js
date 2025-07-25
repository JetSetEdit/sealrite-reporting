import React from 'react';
import moment from 'moment';
import { Instagram, ExternalLink, Heart, MessageCircle, Eye, Video, Image as ImageIcon, GalleryHorizontalEnd } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

const DataTable = ({ data }) => {



  const getInstagramPosts = () => {
    if (!data?.instagram?.posts?.data) return [];
    
    return data.instagram.posts.data.map(post => ({
      id: post.id,
      platform: 'Instagram',
      content: post.caption || 'No caption',
      type: post.media_type,
      created_time: post.timestamp,
      permalink_url: post.permalink,
      metrics: {
        reach: post.insights?.data?.find(i => i.name === 'reach')?.values?.[0]?.value || post.like_count || 0,
        likes: post.like_count || 0,
        comments: post.comments_count || 0
      }
    }));
  };

  const instagramPosts = getInstagramPosts();

  const getPosts = () => {
    return instagramPosts;
  };

  const posts = getPosts();

  const getPlatformIcon = () => {
    return <Instagram className="h-4 w-4 text-instagram" />;
  };

  const getMediaTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'photo':
        return <ImageIcon className="h-4 w-4" />;
      case 'carousel_album':
        return <GalleryHorizontalEnd className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Instagram className="h-6 w-6 text-instagram" />
        <h2 className="text-xl font-semibold text-gray-900">Recent Instagram Posts</h2>
        <span className="text-sm text-gray-500">({instagramPosts.length} posts)</span>
      </div>
      
      {/* Note about metrics */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> Individual post metrics (likes, comments) are now displayed when available from the Instagram API. 
          Some metrics may show as 0 if not available for certain post types or due to API limitations.
        </p>
      </div>

      {/* No posts message */}
      {instagramPosts.length === 0 && (
        <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <Instagram className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Posts Available</h3>
          <p className="text-gray-600 mb-3">
            No Instagram posts were found for the selected month ({moment().format('MMMM YYYY')}).
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm font-medium mb-2">📅 Account Timeline:</p>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• <strong>March 2025:</strong> Instagram account created</li>
              <li>• <strong>May 22nd, 2025:</strong> Agreement effective date</li>
              <li>• <strong>Current:</strong> Account is actively growing</li>
            </ul>
          </div>
          <p className="text-gray-500 text-sm">
            This could be because:
          </p>
          <ul className="text-gray-500 text-sm mt-2 space-y-1">
            <li>• No posts were published in this month</li>
            <li>• Instagram API has limited access to historical data</li>
            <li>• The posts are not accessible with current permissions</li>
            <li>• Selected month is before the account creation date</li>
          </ul>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metrics
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No posts available
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getPlatformIcon()}
                      <span className="text-sm font-medium text-gray-900">
                        Instagram
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900 truncate">
                        {post.content}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span>{getMediaTypeIcon(post.type)}</span>
                      <span className="text-sm text-gray-900 capitalize">
                        {post.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {moment(post.created_time).format('MMM D, YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {post.metrics.reach}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {post.metrics.likes}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {post.metrics.comments}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a
                      href={post.permalink_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-900"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View</span>
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable; 