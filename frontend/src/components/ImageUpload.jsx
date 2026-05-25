/**
 * ImageUpload — drag & drop / click to upload images.
 * Calls POST /api/listings/upload-image/ and returns the URL.
 */
import { useState, useRef } from 'react';
import { Icon } from './UI';

const MAX_FILES = 10;

export default function ImageUpload({ images = [], onChange, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const uploadFile = async (file) => {
    const token = localStorage.getItem('access_token');
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/listings/upload-image/', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json(); // { url, public_id }
  };

  const handleFiles = async (files) => {
    const allowed = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!allowed.length) return;
    const remaining = MAX_FILES - images.length;
    const toUpload = allowed.slice(0, remaining);
    if (!toUpload.length) return alert(`Max ${MAX_FILES} images allowed.`);

    setUploading(true);
    try {
      const results = await Promise.all(toUpload.map(uploadFile));
      const newUrls = results.map(r => r.url);
      onChange([...images, ...newUrls]);
    } catch (e) {
      alert(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const moveImage = (from, to) => {
    const arr = [...images];
    [arr[from], arr[to]] = [arr[to], arr[from]];
    onChange(arr);
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          if (!disabled && !uploading) handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: `2px dashed ${dragging ? '#E8472A' : '#ddd'}`,
          borderRadius: 12,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          background: dragging ? '#fff5f3' : '#fafaf8',
          transition: 'all .15s',
          marginBottom: 16,
          opacity: disabled ? .5 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div style={{ color: '#E8472A' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Uploading...</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <p style={{ fontWeight: 700, margin: '0 0 4px' }}>
              {images.length === 0 ? 'Add photos' : 'Add more photos'}
            </p>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
              Drag and drop or click to browse — up to {MAX_FILES} images, max 10MB each
            </p>
          </>
        )}
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          {images.map((url, idx) => (
            <div key={idx} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3', background: '#f0f0f0' }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

              {/* Primary badge */}
              {idx === 0 && (
                <div style={{ position: 'absolute', top: 6, left: 6, background: '#E8472A', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                  Cover
                </div>
              )}

              {/* Actions */}
              <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                {idx > 0 && (
                  <button
                    onClick={() => moveImage(idx, idx - 1)}
                    title="Move left"
                    style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.55)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >←</button>
                )}
                <button
                  onClick={() => removeImage(idx)}
                  title="Remove"
                  style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(220,38,38,.8)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
        {images.length}/{MAX_FILES} photos · First photo is the cover image
      </p>
    </div>
  );
}
