import React, { useCallback } from 'react';
import { useTranslate } from '@tolgee/react';
import { registerWidget } from '../registry';
import './SocialShare.css';

/**
 * SocialShare Widget
 *
 * Share buttons for social media. By default, only shows on results phase.
 * Configurable via config.platforms (array of platform names)
 */
function SocialShare({ config }) {
  const { t } = useTranslate();
  const platforms = config.platforms || ['twitter', 'facebook', 'whatsapp', 'copy'];
  const shareText = config.shareText || t('widgets.socialShare.defaultText');
  const shareUrl = config.shareUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = useCallback((platform) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
        // Could add a toast notification here
        alert('Link copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy link');
      });
      return;
    }

    const url = shareUrls[platform];
    if (url) {
      window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
    }
  }, [shareText, shareUrl]);

  const platformIcons = {
    twitter: 'X',
    facebook: 'f',
    whatsapp: 'W',
    linkedin: 'in',
    telegram: 'T',
    copy: '🔗',
  };

  const platformNames = {
    twitter: 'Twitter/X',
    facebook: 'Facebook',
    whatsapp: 'WhatsApp',
    linkedin: 'LinkedIn',
    telegram: 'Telegram',
    copy: 'Copy Link',
  };

  return (
    <div className="social-share">
      <span className="social-share-emoji">👉</span>
      <div className="social-share-content">
        <div className="social-share-label">{t('widgets.socialShare.label')}</div>
        <div className="social-share-buttons">
          {platforms.map(platform => (
            <button
              key={platform}
              className={`social-share-button social-share-${platform}`}
              onClick={() => handleShare(platform)}
              title={platformNames[platform] || platform}
              aria-label={`Share on ${platformNames[platform] || platform}`}
            >
              <span className="social-share-icon">{platformIcons[platform] || platform[0].toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
      <span className="social-share-emoji">👈</span>
    </div>
  );
}

// Register with defaults
registerWidget({
  id: 'social-share',
  component: SocialShare,
  defaults: {
    draggable: true,
    defaultSlot: 'bottom',
    showOnPhase: ['results'],
    platforms: ['twitter', 'facebook', 'whatsapp', 'copy'],
  },
});

export default SocialShare;
