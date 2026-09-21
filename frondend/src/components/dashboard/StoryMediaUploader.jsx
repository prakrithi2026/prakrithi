import { useState, useRef } from 'react';
import { 
  FiImage, 
  FiVideo, 
  FiUploadCloud, 
  FiTrash2, 
  FiRefreshCw, 
  FiPlay, 
  FiCheck, 
  FiAlertCircle, 
  FiLink 
} from 'react-icons/fi';
import { compressImage, getYouTubeEmbedUrl } from '../../utils/imageOptimizer';
import defaultConfig from '../../data/defaultConfig';
import './StoryMediaUploader.css';

/**
 * Dedicated Media Uploader for Our Story section.
 * Supports:
 *  1. Image: File upload (PNG/JPG/WEBP with automatic WebP compression) or Image URL
 *  2. Video: YouTube / Vimeo / MP4 URL or direct video file upload (<25MB)
 * No SVG code requirement.
 */
export default function StoryMediaUploader({
  mediaType = 'image',
  onMediaTypeChange,
  image = '',
  onImageChange,
  video = '',
  onVideoChange
}) {
  const displayImage = image || '';
  const [activeTab, setActiveTab] = useState('image');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [imageError, setImageError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [isDragOverImage, setIsDragOverImage] = useState(false);
  const [isDragOverVideo, setIsDragOverVideo] = useState(false);

  const imageFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const posterFileInputRef = useRef(null);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (onMediaTypeChange) {
      onMediaTypeChange(tab);
    }
  };

  // ── Image Handlers ──
  const processImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setImageError('');
    setUploadingImage(true);
    try {
      const compressed = await compressImage(file, 900, 675, 0.85);
      onImageChange(compressed);
      if (onMediaTypeChange && activeTab !== 'image') {
        onMediaTypeChange('image');
      }
    } catch (err) {
      setImageError('Failed to process image: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setIsDragOverImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // ── Video Handlers ──
  const processVideoFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setVideoError('Please select a valid video file (.mp4, .webm, .mov).');
      return;
    }

    // Check file size (25MB limit for inline database storage)
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setVideoError(
        'Video file is too large (' + (file.size / (1024 * 1024)).toFixed(1) + 'MB). For smooth performance and database limits, videos larger than 25MB should be uploaded to YouTube or Vimeo and pasted as a link.'
      );
      return;
    }

    setVideoError('');
    setUploadingVideo(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      onVideoChange(event.target.result);
      if (onMediaTypeChange) {
        onMediaTypeChange('video');
      }
      setUploadingVideo(false);
    };
    reader.onerror = () => {
      setVideoError('Failed to read video file.');
      setUploadingVideo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
    e.target.value = '';
  };

  const handleVideoDrop = (e) => {
    e.preventDefault();
    setIsDragOverVideo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const handlePosterFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 900, 675, 0.85);
        onImageChange(compressed);
      } catch (err) {
        setVideoError('Failed to set video poster: ' + err.message);
      }
    }
    e.target.value = '';
  };

  const isYouTubeOrVimeo = video && (
    video.includes('youtube.com') || 
    video.includes('youtu.be') || 
    video.includes('vimeo.com')
  );

  const embedUrl = isYouTubeOrVimeo ? getYouTubeEmbedUrl(video) : '';

  return (
    <div className="story-media-uploader">
      {/* Header */}
      <div className="story-media-header">
        <div className="story-media-title-group">
          <label className="story-media-label">Story Image</label>
        </div>
      </div>

      {/* ── IMAGE TAB CONTENT ── */}
      {activeTab === 'image' && (
        <div className="story-media-panel">
          {displayImage ? (
            /* Active Image Preview Card */
            <div className="story-media-preview-card">
              <div className="story-media-img-container">
                <img 
                  src={displayImage} 
                  alt="Our Story Preview" 
                  className="story-media-img-preview" 
                  loading="eager"
                />
                <div className="story-media-play-overlay">
                  <svg width="44" height="44" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="56" height="56" rx="28" fill="#FF1818"/>
                    <path d="M22 38.7633L40.0937 28.3817L22 18V38.7633Z" fill="white"/>
                  </svg>
                </div>
              </div>
              <div className="story-media-preview-info">
                <div className="story-media-preview-status">
                  <span className="story-media-status-badge">
                    <FiCheck size={13} /> Active Story Image
                  </span>
                </div>

                <div className="story-media-btn-group">
                  <button
                    type="button"
                    className="story-media-action-btn story-media-action-btn--primary"
                    onClick={() => imageFileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? <FiRefreshCw className="spin" size={13} /> : <FiUploadCloud size={14} />}
                    <span>{uploadingImage ? 'Processing...' : 'Replace Image'}</span>
                  </button>
                  <button
                    type="button"
                    className="story-media-action-btn story-media-action-btn--danger"
                    onClick={() => onImageChange('')}
                  >
                    <FiTrash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Image Zone */
            <div className="story-media-upload-area">
              <div
                className={`story-media-dropzone ${isDragOverImage ? 'story-media-dropzone--dragover' : ''} ${uploadingImage ? 'story-media-dropzone--uploading' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOverImage(true); }}
                onDragLeave={() => setIsDragOverImage(false)}
                onDrop={handleImageDrop}
                onClick={() => imageFileInputRef.current?.click()}
              >
                <div className="story-media-dropzone-icon">
                  {uploadingImage ? (
                    <FiRefreshCw className="spin" size={32} />
                  ) : (
                    <FiUploadCloud size={32} />
                  )}
                </div>
                <h4 className="story-media-dropzone-title">
                  {uploadingImage ? 'Optimizing image...' : 'Click or drag & drop to upload Image'}
                </h4>
                <p className="story-media-dropzone-desc">
                  Supports PNG, JPG, or WEBP (automatically optimized for web)
                </p>
              </div>

              {/* Or paste URL */}
              <div className="story-media-divider">
                <span>OR ENTER IMAGE URL</span>
              </div>

              <div className="story-media-url-row">
                <FiLink className="story-media-url-icon" size={14} />
                <input
                  type="url"
                  className="story-media-url-input"
                  placeholder="https://example.com/story.jpg or /images/..."
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      onImageChange(e.target.value.trim());
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.target.value.trim()) {
                        onImageChange(e.target.value.trim());
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {imageError && (
            <div className="story-media-error">
              <FiAlertCircle size={15} />
              <span>{imageError}</span>
            </div>
          )}

          {/* Video Link Option for Story Image */}
          <div className="story-media-field-block story-media-video-link-block">
            <div className="story-media-poster-header">
              <label className="story-media-mini-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiPlay size={14} style={{ color: '#FF1818' }} />
                <span>Play Button Video Link</span>
              </label>
              {video && (
                <button
                  type="button"
                  className="story-media-mini-clear"
                  onClick={() => onVideoChange('')}
                >
                  Clear Link
                </button>
              )}
            </div>
            <span className="story-media-hint">
              Paste a video URL (YouTube, Vimeo, or direct link). When visitors click the play button on the image, they will go to this video link.
            </span>
            <div className="story-media-url-row">
              <FiLink className="story-media-url-icon" size={14} />
              <input
                type="url"
                className="story-media-url-input"
                value={video || ''}
                onChange={(e) => onVideoChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              />
            </div>
            {video && (
              <div className="story-media-link-status">
                <FiCheck size={13} style={{ color: '#059669', flexShrink: 0 }} />
                <span>
                  Video button linked to:{' '}
                  <a
                    href={video.startsWith('http') ? video : `https://${video}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#006B3F', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    {video}
                  </a>
                </span>
              </div>
            )}
          </div>

          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            style={{ display: 'none' }}
            onChange={handleImageFileChange}
          />
        </div>
      )}

      {/* ── VIDEO TAB CONTENT ── */}
      {activeTab === 'video' && (
        <div className="story-media-panel">
          {video ? (
            /* Active Video Preview Card */
            <div className="story-media-preview-card story-media-preview-card--video">
              <div className="story-media-video-container">
                {isYouTubeOrVimeo && embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title="Our Story Video Preview"
                    className="story-media-video-iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={video}
                    controls
                    playsInline
                    poster={image || undefined}
                    className="story-media-video-player"
                  >
                    Your browser does not support HTML5 video.
                  </video>
                )}
              </div>

              <div className="story-media-preview-info">
                <div className="story-media-preview-status">
                  <span className="story-media-status-badge story-media-status-badge--video">
                    <FiPlay size={12} /> Active Story Video
                  </span>
                  <span className="story-media-source-tag">
                    {isYouTubeOrVimeo ? 'YouTube / Vimeo' : (video.startsWith('data:') ? 'Uploaded File' : 'Direct MP4')}
                  </span>
                </div>

                {/* Video Link Field */}
                <div className="story-media-field-block">
                  <label className="story-media-mini-label">Video URL</label>
                  <div className="story-media-url-row">
                    <FiLink className="story-media-url-icon" size={14} />
                    <input
                      type="text"
                      className="story-media-url-input"
                      value={video}
                      onChange={(e) => onVideoChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </div>

                {/* Optional Poster / Thumbnail for Video */}
                <div className="story-media-field-block">
                  <div className="story-media-poster-header">
                    <label className="story-media-mini-label">Video Cover / Poster Image (Optional)</label>
                    {image && (
                      <button
                        type="button"
                        className="story-media-mini-clear"
                        onClick={() => onImageChange('')}
                      >
                        Remove Cover
                      </button>
                    )}
                  </div>
                  {image ? (
                    <div className="story-media-poster-row">
                      <img src={image} alt="Video Poster" className="story-media-poster-thumb" />
                      <span className="story-media-poster-text">Custom poster thumbnail set</span>
                      <button
                        type="button"
                        className="story-media-action-btn story-media-action-btn--secondary"
                        onClick={() => posterFileInputRef.current?.click()}
                      >
                        Change Cover
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="story-media-action-btn story-media-action-btn--secondary"
                      onClick={() => posterFileInputRef.current?.click()}
                    >
                      <FiImage size={13} />
                      <span>Upload Video Cover Image</span>
                    </button>
                  )}
                </div>

                <div className="story-media-btn-group">
                  <button
                    type="button"
                    className="story-media-action-btn story-media-action-btn--primary"
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={uploadingVideo}
                  >
                    {uploadingVideo ? <FiRefreshCw className="spin" size={13} /> : <FiUploadCloud size={14} />}
                    <span>{uploadingVideo ? 'Uploading...' : 'Replace Video File'}</span>
                  </button>
                  <button
                    type="button"
                    className="story-media-action-btn story-media-action-btn--danger"
                    onClick={() => onVideoChange('')}
                  >
                    <FiTrash2 size={13} />
                    <span>Remove Video</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Add Video Form */
            <div className="story-media-upload-area">
              {/* Video URL Input */}
              <div className="story-media-field-block">
                <label className="story-media-mini-label">Paste Video URL (YouTube, Vimeo, or MP4)</label>
                <div className="story-media-url-row">
                  <FiLink className="story-media-url-icon" size={14} />
                  <input
                    type="text"
                    className="story-media-url-input"
                    placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        onVideoChange(e.target.value.trim());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.target.value.trim()) {
                          onVideoChange(e.target.value.trim());
                        }
                      }
                    }}
                  />
                </div>
                <span className="story-media-hint" style={{ marginTop: '4px', display: 'block' }}>
                  Paste a link to YouTube, YouTube Shorts, Vimeo, or an MP4 file. Press Enter to apply.
                </span>
              </div>

              {/* Or upload video file */}
              <div className="story-media-divider">
                <span>OR UPLOAD VIDEO FILE</span>
              </div>

              <div
                className={`story-media-dropzone story-media-dropzone--video ${isDragOverVideo ? 'story-media-dropzone--dragover' : ''} ${uploadingVideo ? 'story-media-dropzone--uploading' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOverVideo(true); }}
                onDragLeave={() => setIsDragOverVideo(false)}
                onDrop={handleVideoDrop}
                onClick={() => videoFileInputRef.current?.click()}
              >
                <div className="story-media-dropzone-icon">
                  {uploadingVideo ? (
                    <FiRefreshCw className="spin" size={32} />
                  ) : (
                    <FiVideo size={32} />
                  )}
                </div>
                <h4 className="story-media-dropzone-title">
                  {uploadingVideo ? 'Loading video file...' : 'Click to select or drag & drop video file'}
                </h4>
                <p className="story-media-dropzone-desc">
                  Supports MP4, WebM (up to 25MB). For larger videos, use YouTube or Vimeo links.
                </p>
              </div>
            </div>
          )}

          {videoError && (
            <div className="story-media-error">
              <FiAlertCircle size={15} />
              <span>{videoError}</span>
            </div>
          )}

          <input
            ref={videoFileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            style={{ display: 'none' }}
            onChange={handleVideoFileChange}
          />
          <input
            ref={posterFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            style={{ display: 'none' }}
            onChange={handlePosterFileChange}
          />
        </div>
      )}
    </div>
  );
}
